import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.engine import get_db
from db.models import Activity
from db.repositories import ActivityRepository

router = APIRouter(prefix="/api/activities", tags=["activities"])


class ActivitySummary(BaseModel):
    run_id: int
    name: Optional[str] = None
    distance: Optional[float] = None
    moving_time: Optional[str] = None
    type: Optional[str] = None
    subtype: Optional[str] = None
    start_date_local: Optional[str] = None
    location_country: Optional[str] = None
    average_heartrate: Optional[float] = None
    average_speed: Optional[float] = None
    elevation_gain: Optional[float] = None
    elevation_loss: Optional[float] = None
    max_heartrate: Optional[float] = None
    avg_cadence: Optional[float] = None
    calories: Optional[float] = None


class ActivityDetail(ActivitySummary):
    avg_power: Optional[float] = None
    avg_temperature: Optional[float] = None
    hr_zone_time: Optional[list] = None
    laps: Optional[list] = None


def _to_summary(a: Activity) -> dict:
    return {
        "run_id": a.run_id,
        "name": a.name,
        "distance": a.distance,
        "moving_time": str(a.moving_time) if a.moving_time else None,
        "type": a.type,
        "subtype": a.subtype,
        "start_date_local": a.start_date_local,
        "location_country": a.location_country,
        "average_heartrate": a.average_heartrate,
        "average_speed": a.average_speed,
        "elevation_gain": a.elevation_gain,
        "elevation_loss": a.elevation_loss,
        "max_heartrate": a.max_heartrate,
        "avg_cadence": a.avg_cadence,
        "calories": a.calories,
    }


def _to_detail(a: Activity) -> dict:
    d = _to_summary(a)
    d["avg_power"] = a.avg_power
    d["avg_temperature"] = a.avg_temperature
    d["hr_zone_time"] = json.loads(a.hr_zone_time) if a.hr_zone_time else None
    d["laps"] = json.loads(a.laps) if a.laps else None
    return d


@router.get("")
def list_activities(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    type: Optional[str] = None,
    date_after: Optional[str] = None,
    date_before: Optional[str] = None,
    location: Optional[str] = None,
    min_elevation: Optional[float] = None,
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    activities = repo.list(
        limit=limit,
        offset=offset,
        activity_type=type,
        date_after=date_after,
        date_before=date_before,
        location_like=location,
        min_elevation=min_elevation,
    )
    return {"data": [_to_summary(a) for a in activities], "total": repo.count()}


@router.get("/summary")
def activity_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Activity.run_id)).scalar()
    total_distance = db.query(func.sum(Activity.distance)).scalar() or 0
    total_elevation = db.query(func.sum(Activity.elevation_gain)).scalar() or 0
    avg_hr = db.query(func.avg(Activity.average_heartrate)).scalar()
    return {
        "total_activities": total,
        "total_distance_km": round(total_distance / 1000, 1),
        "total_elevation_gain_m": round(total_elevation, 0),
        "avg_heartrate": round(avg_hr, 1) if avg_hr else None,
    }


@router.get("/{run_id}")
def get_activity(run_id: int, db: Session = Depends(get_db)):
    repo = ActivityRepository(db)
    activity = repo.get(run_id)
    if not activity:
        return {"error": "not found"}, 404
    return _to_detail(activity)
