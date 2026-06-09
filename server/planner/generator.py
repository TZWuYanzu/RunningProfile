"""Top-level plan generator: PlanInput → RacePlan + DailyPlans in DB."""

from __future__ import annotations

import json
from datetime import date, timedelta

from sqlalchemy.orm import Session

from planner.input import PlanInput
from planner.feasibility import assess as assess_feasibility
from planner.periodization import generate_periodization
from planner.weekly import generate_week, WEEKDAY_NAMES
from planner.vdot import get_training_paces, estimate_vdot_from_race
from db.repositories import RacePlanRepository, DailyPlanRepository, ActivityRepository


def generate_race_plan(db: Session, plan_input: PlanInput) -> dict:
    plan_start = date.today() + timedelta(days=(7 - date.today().weekday()) % 7 or 7)

    current_vdot = _estimate_current_vdot(db)
    feasibility = assess_feasibility(plan_input, current_vdot=current_vdot)

    if not feasibility["feasible"]:
        return {"status": "infeasible", "feasibility": feasibility}

    phases = generate_periodization(plan_input, plan_start)
    if not phases:
        return {"status": "error", "message": "无法生成周期划分"}

    plan_end = phases[-1].end_date
    total_weeks = sum(p.weeks for p in phases)

    base_hours, base_elevation = _get_current_baseline(db)

    training_paces = None
    if plan_input.race_type == "road" and current_vdot:
        training_paces = get_training_paces(current_vdot)

    race_plan_repo = RacePlanRepository(db)
    daily_plan_repo = DailyPlanRepository(db)

    race_plan = race_plan_repo.create(
        user_id=plan_input.user_id,
        race_name=plan_input.race_name,
        race_type=plan_input.race_type,
        race_date=plan_input.race_date.isoformat(),
        race_distance_km=plan_input.race_distance_km,
        race_elevation_m=plan_input.race_elevation_m,
        target_time=plan_input.target_time,
        target_itra_pi=plan_input.target_itra_pi,
        plan_start_date=plan_start.isoformat(),
        plan_end_date=plan_end.isoformat(),
        total_weeks=total_weeks,
        current_phase=phases[0].name,
        phase_config=json.dumps(
            [{"name": p.name, "weeks": p.weeks, "focus": p.focus,
              "start": p.start_date.isoformat(), "end": p.end_date.isoformat()}
             for p in phases], ensure_ascii=False),
        weekly_available_days=plan_input.weekly_available_days,
        long_run_day=plan_input.long_run_day,
        rest_days=json.dumps(plan_input.rest_days, ensure_ascii=False),
    )

    daily_plans = []
    for phase in phases:
        for week_idx in range(phase.weeks):
            week_start = phase.start_date + timedelta(weeks=week_idx)
            week_templates = generate_week(
                plan_input, phase.name, week_idx,
                base_hours, base_elevation, training_paces)

            for day_idx, tmpl in enumerate(week_templates):
                plan_date = week_start + timedelta(days=day_idx)
                if plan_date > plan_end:
                    break
                daily_plans.append({
                    "plan_id": race_plan.id,
                    "user_id": plan_input.user_id,
                    "plan_date": plan_date.isoformat(),
                    "day_of_week": tmpl.day_of_week,
                    "workout_type": tmpl.workout_type,
                    "title": tmpl.title,
                    "description": tmpl.description,
                    "target_duration_min": tmpl.target_duration_min,
                    "target_distance_km": tmpl.target_distance_km,
                    "target_elevation_m": tmpl.target_elevation_m,
                    "target_hr_zone": tmpl.target_hr_zone,
                    "target_pace": tmpl.target_pace,
                    "intensity": tmpl.intensity,
                    "source": "ai_generated",
                })

    daily_plan_repo.create_batch(daily_plans)

    first_week = [dp for dp in daily_plans[:7]]

    return {
        "status": "success",
        "plan_id": race_plan.id,
        "race_name": plan_input.race_name,
        "race_date": plan_input.race_date.isoformat(),
        "total_weeks": total_weeks,
        "plan_start": plan_start.isoformat(),
        "plan_end": plan_end.isoformat(),
        "feasibility": feasibility,
        "phases": [{"name": p.name, "weeks": p.weeks, "focus": p.focus} for p in phases],
        "first_week_preview": [
            {"date": dp["plan_date"], "day": dp["day_of_week"],
             "type": dp["workout_type"], "title": dp["title"]}
            for dp in first_week
        ],
    }


def _estimate_current_vdot(db: Session) -> float | None:
    repo = ActivityRepository(db)
    recent = repo.list(limit=50, activity_type="Run")

    best_5k = None
    best_10k = None
    best_hm = None

    for a in recent:
        if not a.distance or not a.moving_time:
            continue
        dist_km = a.distance / 1000
        secs = _parse_seconds(a.moving_time)
        if secs <= 0:
            continue

        if 4.5 <= dist_km <= 5.5:
            if best_5k is None or secs < best_5k:
                best_5k = secs
        elif 9.5 <= dist_km <= 10.5:
            if best_10k is None or secs < best_10k:
                best_10k = secs
        elif 20 <= dist_km <= 22:
            if best_hm is None or secs < best_hm:
                best_hm = secs

    if best_hm:
        return estimate_vdot_from_race(21.1, best_hm)
    if best_10k:
        return estimate_vdot_from_race(10, best_10k)
    if best_5k:
        return estimate_vdot_from_race(5, best_5k)
    return None


def _get_current_baseline(db: Session) -> tuple[float, float]:
    from datetime import datetime
    repo = ActivityRepository(db)
    four_weeks_ago = (datetime.utcnow() - timedelta(weeks=4)).strftime("%Y-%m-%d")
    recent = repo.list(limit=100, date_after=four_weeks_ago)

    total_hours = 0
    total_elev = 0
    for a in recent:
        secs = _parse_seconds(a.moving_time)
        total_hours += secs / 3600
        total_elev += a.elevation_gain or 0

    weekly_hours = total_hours / 4 if total_hours > 0 else 4.0
    weekly_elev = total_elev / 4 if total_elev > 0 else 300.0

    return max(weekly_hours, 3.0), max(weekly_elev, 200.0)


def _parse_seconds(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time).replace("1970-01-01 ", "")
    parts = s.split(":")
    try:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    except (ValueError, IndexError):
        return 0
