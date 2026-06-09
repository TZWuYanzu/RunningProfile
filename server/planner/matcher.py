"""Match daily plans against actual activities and generate feedback."""

from __future__ import annotations

from sqlalchemy.orm import Session

from db.models import Activity, DailyPlan
from db.repositories import DailyPlanRepository, ActivityRepository


def match_daily_plans(db: Session, user_id: str, target_date: str) -> list[dict]:
    daily_repo = DailyPlanRepository(db)
    activity_repo = ActivityRepository(db)

    plan = daily_repo.get_by_date(user_id, target_date)
    if not plan:
        return [{"date": target_date, "status": "no_plan"}]

    if plan.workout_type == "休息":
        return [{"date": target_date, "status": "rest_day", "title": plan.title}]

    if plan.completion_status in ("completed", "skipped"):
        return [{"date": target_date, "status": plan.completion_status,
                 "title": plan.title, "coach_feedback": plan.coach_feedback}]

    activities = activity_repo.list(limit=5, date_after=target_date, date_before=target_date)
    if not activities:
        activities = activity_repo.list(limit=3, date_after=target_date)
        activities = [a for a in activities if a.start_date_local and
                      a.start_date_local[:10] == target_date]

    if not activities:
        return [{"date": target_date, "status": "pending",
                 "title": plan.title, "message": "今日暂无匹配的活动数据"}]

    best_match = _find_best_match(plan, activities)
    if not best_match:
        return [{"date": target_date, "status": "no_match",
                 "title": plan.title, "message": "有活动但未能匹配到计划"}]

    activity, score = best_match
    completion_pct = _calculate_completion(plan, activity)
    feedback = _generate_feedback(plan, activity, completion_pct)

    status = "completed" if completion_pct >= 0.8 else ("partial" if completion_pct >= 0.5 else "partial")
    deviation = _calculate_deviation(plan, activity)

    daily_repo.match_activity(
        plan.id, activity.run_id, status,
        round(completion_pct, 2), feedback, deviation)

    return [{
        "date": target_date,
        "status": status,
        "title": plan.title,
        "matched_activity_id": activity.run_id,
        "completion_pct": round(completion_pct * 100, 1),
        "coach_feedback": feedback,
        "deviation_notes": deviation,
    }]


def _find_best_match(plan: DailyPlan, activities: list[Activity]) -> tuple | None:
    if not activities:
        return None
    if len(activities) == 1:
        return (activities[0], 1.0)

    scores = []
    for a in activities:
        score = 0
        if plan.target_distance_km and a.distance:
            dist_ratio = (a.distance / 1000) / plan.target_distance_km
            score += max(0, 1.0 - abs(1.0 - dist_ratio))
        if plan.target_elevation_m and a.elevation_gain:
            elev_ratio = a.elevation_gain / plan.target_elevation_m
            score += max(0, 1.0 - abs(1.0 - elev_ratio)) * 0.5
        if plan.target_duration_min and a.moving_time:
            dur_min = _parse_minutes(a.moving_time)
            if dur_min > 0:
                dur_ratio = dur_min / plan.target_duration_min
                score += max(0, 1.0 - abs(1.0 - dur_ratio)) * 0.8
        scores.append((a, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[0] if scores[0][1] > 0 else (activities[0], 0.5)


def _calculate_completion(plan: DailyPlan, activity: Activity) -> float:
    ratios = []

    if plan.target_distance_km and plan.target_distance_km > 0 and activity.distance:
        ratios.append(min((activity.distance / 1000) / plan.target_distance_km, 1.2))

    if plan.target_duration_min and plan.target_duration_min > 0 and activity.moving_time:
        dur = _parse_minutes(activity.moving_time)
        if dur > 0:
            ratios.append(min(dur / plan.target_duration_min, 1.2))

    if plan.target_elevation_m and plan.target_elevation_m > 0 and activity.elevation_gain:
        ratios.append(min(activity.elevation_gain / plan.target_elevation_m, 1.2))

    if not ratios:
        return 0.5

    return min(sum(ratios) / len(ratios), 1.0)


def _generate_feedback(plan: DailyPlan, activity: Activity, completion_pct: float) -> str:
    parts = []

    if completion_pct >= 0.95:
        parts.append("执行到位")
    elif completion_pct >= 0.8:
        parts.append("基本完成")
    elif completion_pct >= 0.5:
        parts.append("部分完成")
    else:
        parts.append("训练量不足")

    if plan.target_hr_zone and activity.average_heartrate:
        hr = activity.average_heartrate
        zone = plan.target_hr_zone
        if "Z1" in zone or "Z2" in zone:
            if hr > 160:
                parts.append("心率偏高，注意控制强度")
            elif hr < 145:
                parts.append("心率控制良好")
        elif "Z3" in zone or "Z4" in zone:
            if hr < 150:
                parts.append("强度可能不够")

    if plan.target_distance_km and activity.distance:
        diff_pct = ((activity.distance / 1000) - plan.target_distance_km) / plan.target_distance_km * 100
        if abs(diff_pct) > 15:
            if diff_pct > 0:
                parts.append(f"距离超出计划{diff_pct:.0f}%")
            else:
                parts.append(f"距离不足计划{abs(diff_pct):.0f}%")

    return "，".join(parts) + "。"


def _calculate_deviation(plan: DailyPlan, activity: Activity) -> str:
    lines = []
    if plan.target_distance_km and activity.distance:
        actual = activity.distance / 1000
        lines.append(f"距离: 计划{plan.target_distance_km:.1f}km / 实际{actual:.1f}km")
    if plan.target_duration_min and activity.moving_time:
        dur = _parse_minutes(activity.moving_time)
        lines.append(f"时长: 计划{plan.target_duration_min:.0f}min / 实际{dur:.0f}min")
    if plan.target_elevation_m and activity.elevation_gain:
        lines.append(f"爬升: 计划{plan.target_elevation_m:.0f}m / 实际{activity.elevation_gain:.0f}m")
    return "; ".join(lines)


def _parse_minutes(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time).replace("1970-01-01 ", "")
    parts = s.split(":")
    try:
        return int(parts[0]) * 60 + int(parts[1]) + float(parts[2]) / 60
    except (ValueError, IndexError):
        return 0
