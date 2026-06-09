from __future__ import annotations

import json
from sqlalchemy.orm import Session

from datetime import date, datetime, timedelta

from db.repositories import (
    ActivityRepository, ProfileRepository, TrainingNotesRepository,
    RacePlanRepository, DailyPlanRepository,
)
from eval.trail import evaluate_trail
from eval.road import evaluate_road
from planner.input import PlanInput
from planner.generator import generate_race_plan


class ToolExecutor:
    def __init__(self, db: Session, user_id: str = "default"):
        self.db = db
        self.user_id = user_id

    def execute(self, tool_name: str, arguments: str) -> str:
        args = json.loads(arguments) if arguments else {}
        handler = getattr(self, f"_tool_{tool_name}", None)
        if not handler:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
        result = handler(**args)
        return json.dumps(result, ensure_ascii=False, default=str)

    def _tool_evaluate_ability(self, mode: str = "trail") -> dict:
        if mode == "road":
            return evaluate_road(self.db, self.user_id)
        return evaluate_trail(self.db, self.user_id)

    def _tool_get_recent_activities(self, count: int = 5) -> dict:
        repo = ActivityRepository(self.db)
        activities = repo.recent(count)
        return {
            "activities": [
                {
                    "run_id": a.run_id,
                    "date": a.start_date_local,
                    "type": a.type,
                    "subtype": a.subtype,
                    "distance_km": round(a.distance / 1000, 1) if a.distance else 0,
                    "duration_min": _moving_to_min(a.moving_time),
                    "elevation_gain": a.elevation_gain,
                    "avg_hr": a.average_heartrate,
                    "max_hr": a.max_heartrate,
                    "avg_pace": _speed_to_pace(a.average_speed),
                    "location": a.location_country,
                    "calories": a.calories,
                }
                for a in activities
            ]
        }

    def _tool_search_history(self, query: str = "") -> dict:
        repo = ActivityRepository(self.db)
        notes_repo = TrainingNotesRepository(self.db)

        filters = _parse_query_filters(query)
        activities = repo.list(
            limit=10,
            activity_type=filters.get("type"),
            date_after=filters.get("date_after"),
            date_before=filters.get("date_before"),
            location_like=filters.get("location"),
            min_elevation=filters.get("min_elevation"),
        )

        activity_ids = [a.run_id for a in activities]
        notes = notes_repo.get_by_activity_ids(activity_ids) if activity_ids else []

        return {
            "query": query,
            "results": [
                {
                    "run_id": a.run_id,
                    "date": a.start_date_local,
                    "type": a.type,
                    "distance_km": round(a.distance / 1000, 1) if a.distance else 0,
                    "elevation_gain": a.elevation_gain,
                    "avg_hr": a.average_heartrate,
                    "location": a.location_country,
                }
                for a in activities
            ],
            "notes": [
                {"activity_id": n.activity_id, "note": n.coach_note, "tags": n.tags}
                for n in notes
            ],
        }

    def _tool_get_profile(self) -> dict:
        repo = ProfileRepository(self.db)
        profile = repo.get(self.user_id)
        if not profile:
            return {"status": "empty", "message": "学员档案为空，需要先完成 Onboarding"}

        return {
            "user_id": profile.user_id,
            "aerobic_base_score": profile.aerobic_base_score,
            "climbing_ability_score": profile.climbing_ability_score,
            "descent_ability_score": profile.descent_ability_score,
            "trail_efficiency_score": profile.trail_efficiency_score,
            "endurance_score": profile.endurance_score,
            "load_risk_score": profile.load_risk_score,
            "current_mode": profile.current_mode,
            "primary_goal": profile.primary_goal,
            "target_race": profile.target_race,
            "injury_history": profile.injury_history,
            "running_experience_years": profile.running_experience_years,
            "updated_at": profile.updated_at,
        }

    def _tool_generate_plan(self, race_type: str = "trail", race_name: str = "",
                            race_date: str = "", race_distance_km: float = 0,
                            race_elevation_m: float = 0, target_time: str = None,
                            target_itra_pi: int = None, weekly_available_days: int = 5,
                            long_run_day: str = "周六") -> dict:
        try:
            rd = date.fromisoformat(race_date)
        except (ValueError, TypeError):
            return {"error": "race_date 格式无效，需要 YYYY-MM-DD"}

        plan_input = PlanInput(
            race_type=race_type,
            race_name=race_name,
            race_date=rd,
            race_distance_km=race_distance_km,
            race_elevation_m=race_elevation_m,
            target_time=target_time,
            target_itra_pi=target_itra_pi,
            weekly_available_days=weekly_available_days,
            long_run_day=long_run_day,
            user_id=self.user_id,
        )
        return generate_race_plan(self.db, plan_input)

    def _tool_update_plan(self, changes: list = None) -> dict:
        if not changes:
            return {"error": "没有提供修改内容"}

        daily_repo = DailyPlanRepository(self.db)
        results = []

        for change in changes:
            target_date = change.get("date")
            action = change.get("action")
            plan = daily_repo.get_by_date(self.user_id, target_date)

            if not plan:
                results.append({"date": target_date, "status": "not_found"})
                continue

            if action == "skip":
                daily_repo.update(plan.id, completion_status="skipped",
                                  coach_notes="用户跳过此训练")
                results.append({"date": target_date, "status": "skipped"})

            elif action == "rest":
                daily_repo.update(plan.id, workout_type="休息", title="休息日",
                                  description="调整为休息", intensity="rest",
                                  source="ai_adjusted")
                results.append({"date": target_date, "status": "changed_to_rest"})

            elif action == "move":
                move_to = change.get("move_to")
                if not move_to:
                    results.append({"date": target_date, "status": "error", "message": "缺少move_to"})
                    continue
                existing = daily_repo.get_by_date(self.user_id, move_to)
                if existing:
                    daily_repo.update(existing.id,
                                      workout_type=plan.workout_type, title=plan.title,
                                      description=plan.description,
                                      target_duration_min=plan.target_duration_min,
                                      target_distance_km=plan.target_distance_km,
                                      target_elevation_m=plan.target_elevation_m,
                                      target_hr_zone=plan.target_hr_zone,
                                      target_pace=plan.target_pace,
                                      intensity=plan.intensity, source="ai_adjusted")
                daily_repo.update(plan.id, workout_type="休息", title="休息日",
                                  description="训练已移至" + move_to, intensity="rest",
                                  source="ai_adjusted")
                results.append({"date": target_date, "status": "moved", "moved_to": move_to})

            elif action == "replace":
                fields = {}
                if change.get("new_workout_type"):
                    fields["workout_type"] = change["new_workout_type"]
                if change.get("new_title"):
                    fields["title"] = change["new_title"]
                if change.get("new_description"):
                    fields["description"] = change["new_description"]
                fields["source"] = "ai_adjusted"
                daily_repo.update(plan.id, **fields)
                results.append({"date": target_date, "status": "replaced"})

            else:
                results.append({"date": target_date, "status": "unknown_action"})

        return {"changes_applied": results}

    def _tool_get_weekly_summary(self, week_start: str = None) -> dict:
        if not week_start:
            today = date.today()
            monday = today - timedelta(days=today.weekday())
            week_start = monday.isoformat()

        week_end = (date.fromisoformat(week_start) + timedelta(days=6)).isoformat()
        daily_repo = DailyPlanRepository(self.db)
        plans = daily_repo.get_by_date_range(self.user_id, week_start, week_end)

        if not plans:
            return {"week_start": week_start, "message": "本周无训练计划"}

        total = len([p for p in plans if p.workout_type != "休息"])
        completed = len([p for p in plans if p.completion_status == "completed"])
        partial = len([p for p in plans if p.completion_status == "partial"])
        skipped = len([p for p in plans if p.completion_status == "skipped"])

        return {
            "week_start": week_start,
            "week_end": week_end,
            "planned_sessions": total,
            "completed": completed,
            "partial": partial,
            "skipped": skipped,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
            "daily_plans": [
                {"date": p.plan_date, "day": p.day_of_week, "type": p.workout_type,
                 "title": p.title, "status": p.completion_status}
                for p in plans
            ],
        }


def _moving_to_min(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time).replace("1970-01-01 ", "")
    parts = s.split(":")
    try:
        return round(int(parts[0]) * 60 + int(parts[1]) + float(parts[2]) / 60, 1)
    except (ValueError, IndexError):
        return 0


def _speed_to_pace(speed: float) -> str:
    if not speed or speed <= 0:
        return "N/A"
    pace_sec = 1000 / speed
    minutes = int(pace_sec // 60)
    seconds = int(pace_sec % 60)
    return f"{minutes}'{seconds:02d}\""


def _parse_query_filters(query: str) -> dict:
    filters = {}
    q = query.lower()

    if "越野" in q or "trail" in q:
        filters["type"] = "Run"
    if "跑" in q and "越野" not in q:
        filters["type"] = "Run"

    from datetime import datetime, timedelta
    now = datetime.utcnow()
    if "上个月" in q or "上月" in q:
        first_of_month = now.replace(day=1)
        last_month_end = first_of_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        filters["date_after"] = last_month_start.strftime("%Y-%m-%d")
        filters["date_before"] = last_month_end.strftime("%Y-%m-%d")
    elif "本月" in q or "这个月" in q:
        filters["date_after"] = now.strftime("%Y-%m-01")
    elif "最近" in q:
        filters["date_after"] = (now - timedelta(weeks=4)).strftime("%Y-%m-%d")

    import re
    elev_match = re.search(r"(\d+)\s*m?\s*(?:爬升|D\+|elevation)", q)
    if elev_match:
        filters["min_elevation"] = float(elev_match.group(1))

    for keyword in ["武功山", "莫干山", "四姑娘", "玄武湖", "紫金山", "上海", "杭州", "南京", "深圳", "北京"]:
        if keyword in q:
            filters["location"] = keyword
            break

    return filters
