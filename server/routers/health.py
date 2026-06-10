from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db.engine import get_db
from db.repositories import DailyHealthRepository

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/daily")
def get_daily_health(
    user_id: str = "default",
    start: str = Query("", description="YYYY-MM-DD"),
    end: str = Query("", description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    repo = DailyHealthRepository(db)

    if not start or not end:
        latest = repo.latest(user_id)
        if not latest:
            return {"records": []}
        return {
            "records": [
                _format_record(latest)
            ]
        }

    records = repo.get_range(user_id, start, end)
    return {"records": [_format_record(r) for r in records]}


def _format_record(r) -> dict:
    return {
        "date": r.date,
        "resting_heart_rate": r.resting_heart_rate,
        "hrv_rmssd": r.hrv_rmssd,
        "hrv_baseline": r.hrv_baseline,
        "fatigue_rate": r.fatigue_rate,
        "training_load": r.training_load,
        "sleep_score": r.sleep_score,
        "sleep_duration_min": r.sleep_duration_min,
        "deep_sleep_min": r.deep_sleep_min,
        "light_sleep_min": r.light_sleep_min,
        "rem_sleep_min": r.rem_sleep_min,
        "source": r.source,
    }
