from __future__ import annotations

import json
from datetime import date as date_type, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.engine import get_db
from db.repositories import (
    PlanRepository, RacePlanRepository, DailyPlanRepository, ActivityRepository,
)
from planner.input import PlanInput
from planner.generator import generate_race_plan
from planner.matcher import match_daily_plans

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


class GenerateRequest(BaseModel):
    user_id: str = "default"
    race_type: str = "trail"
    race_name: str = ""
    race_date: str = ""
    race_distance_km: float = 0
    race_elevation_m: float = 0
    target_time: str | None = None
    target_itra_pi: int | None = None
    weekly_available_days: int = 5
    long_run_day: str = "周六"
    rest_days: list[str] = ["周一"]


class CompareRequest(BaseModel):
    user_id: str = "default"
    date: str = ""


@router.get("")
def get_month(
    month: str = Query(..., description="YYYY-MM format"),
    user_id: str = "default",
    db: Session = Depends(get_db),
):
    parts = month.split("-")
    year, mo = int(parts[0]), int(parts[1])

    daily_repo = DailyPlanRepository(db)
    plans = daily_repo.get_by_month(user_id, year, mo)

    if plans:
        return {
            "month": month,
            "plans": [
                {
                    "id": p.id,
                    "date": p.plan_date,
                    "type": p.workout_type,
                    "title": p.title,
                    "intensity": p.intensity,
                    "status": p.completion_status,
                }
                for p in plans
            ],
        }

    legacy_repo = PlanRepository(db)
    legacy_plans = legacy_repo.get_by_month(user_id, year, mo)
    return {
        "month": month,
        "plans": [
            {
                "id": p.id,
                "date": p.plan_date,
                "type": p.plan_type,
                "title": p.title,
                "intensity": p.intensity,
                "status": p.completion_status,
            }
            for p in legacy_plans
        ],
    }


@router.get("/plans")
def list_plans(user_id: str = "default", db: Session = Depends(get_db)):
    repo = RacePlanRepository(db)
    plans = repo.list_active(user_id)
    return {
        "plans": [
            {
                "id": p.id,
                "race_name": p.race_name,
                "race_type": p.race_type,
                "race_date": p.race_date,
                "total_weeks": p.total_weeks,
                "current_phase": p.current_phase,
                "status": p.status,
            }
            for p in plans
        ]
    }


@router.get("/plan/{plan_id}")
def get_plan_detail(plan_id: int, db: Session = Depends(get_db)):
    race_repo = RacePlanRepository(db)
    daily_repo = DailyPlanRepository(db)

    race_plan = race_repo.get(plan_id)
    if not race_plan:
        return {"error": "plan not found"}

    daily_plans = daily_repo.get_by_plan_id(plan_id)
    return {
        "plan": {
            "id": race_plan.id,
            "race_name": race_plan.race_name,
            "race_type": race_plan.race_type,
            "race_date": race_plan.race_date,
            "race_distance_km": race_plan.race_distance_km,
            "race_elevation_m": race_plan.race_elevation_m,
            "target_time": race_plan.target_time,
            "target_itra_pi": race_plan.target_itra_pi,
            "plan_start_date": race_plan.plan_start_date,
            "plan_end_date": race_plan.plan_end_date,
            "total_weeks": race_plan.total_weeks,
            "current_phase": race_plan.current_phase,
            "phase_config": json.loads(race_plan.phase_config) if race_plan.phase_config else [],
            "status": race_plan.status,
        },
        "daily_plans": [
            {
                "id": dp.id,
                "date": dp.plan_date,
                "day_of_week": dp.day_of_week,
                "workout_type": dp.workout_type,
                "title": dp.title,
                "description": dp.description,
                "target_duration_min": dp.target_duration_min,
                "target_distance_km": dp.target_distance_km,
                "target_elevation_m": dp.target_elevation_m,
                "target_hr_zone": dp.target_hr_zone,
                "target_pace": dp.target_pace,
                "intensity": dp.intensity,
                "completion_status": dp.completion_status,
                "coach_feedback": dp.coach_feedback,
            }
            for dp in daily_plans
        ],
    }


@router.get("/{date}")
def get_day(date: str, user_id: str = "default", db: Session = Depends(get_db)):
    daily_repo = DailyPlanRepository(db)
    plan = daily_repo.get_by_date(user_id, date)

    if not plan:
        legacy_repo = PlanRepository(db)
        lp = legacy_repo.get_by_date(user_id, date)
        if not lp:
            return {"date": date, "plan": None}
        return {
            "date": date,
            "plan": {
                "id": lp.id, "type": lp.plan_type, "title": lp.title,
                "description": lp.description, "status": lp.completion_status,
            },
        }

    return {
        "date": date,
        "plan": {
            "id": plan.id,
            "plan_id": plan.plan_id,
            "type": plan.workout_type,
            "title": plan.title,
            "description": plan.description,
            "target_distance_km": plan.target_distance_km,
            "target_duration_min": plan.target_duration_min,
            "target_elevation_m": plan.target_elevation_m,
            "target_hr_zone": plan.target_hr_zone,
            "target_pace": plan.target_pace,
            "intensity": plan.intensity,
            "status": plan.completion_status,
            "completion_pct": plan.completion_pct,
            "coach_feedback": plan.coach_feedback,
            "deviation_notes": plan.deviation_notes,
        },
    }


@router.post("/generate")
async def generate_plan_endpoint(req: GenerateRequest, db: Session = Depends(get_db)):
    try:
        race_date = date_type.fromisoformat(req.race_date)
    except (ValueError, TypeError):
        return {"status": "error", "message": "race_date 格式无效"}

    plan_input = PlanInput(
        race_type=req.race_type,
        race_name=req.race_name,
        race_date=race_date,
        race_distance_km=req.race_distance_km,
        race_elevation_m=req.race_elevation_m,
        target_time=req.target_time,
        target_itra_pi=req.target_itra_pi,
        weekly_available_days=req.weekly_available_days,
        long_run_day=req.long_run_day,
        rest_days=req.rest_days,
        user_id=req.user_id,
    )
    return generate_race_plan(db, plan_input)


@router.post("/compare")
async def compare_plan_endpoint(req: CompareRequest, db: Session = Depends(get_db)):
    target_date = req.date or date_type.today().isoformat()
    results = match_daily_plans(db, req.user_id, target_date)
    return {"date": target_date, "results": results}


@router.put("/{daily_plan_id}")
async def update_daily_plan(daily_plan_id: int, updates: dict, db: Session = Depends(get_db)):
    daily_repo = DailyPlanRepository(db)
    allowed_fields = {"workout_type", "title", "description", "target_duration_min",
                      "target_distance_km", "target_elevation_m", "target_hr_zone",
                      "target_pace", "intensity", "coach_notes"}
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}
    filtered["source"] = "user_created"
    result = daily_repo.update(daily_plan_id, **filtered)
    if not result:
        return {"error": "plan not found"}
    return {"status": "updated", "id": daily_plan_id}


@router.delete("/plan/{plan_id}")
async def abandon_plan(plan_id: int, db: Session = Depends(get_db)):
    repo = RacePlanRepository(db)
    result = repo.abandon(plan_id)
    if not result:
        return {"error": "plan not found"}
    return {"status": "abandoned", "plan_id": plan_id}
