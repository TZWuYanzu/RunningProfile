from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.engine import get_db
from db.repositories import ShoeRepository, ShoeLogRepository, ActivityRepository

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


class CreateShoeRequest(BaseModel):
    user_id: str = "default"
    name: str
    brand: str = ""
    usage: str = "trail"
    traits: list[str] = []
    initial_km: float = 0


class CreateShoeLogRequest(BaseModel):
    activity_run_id: int | None = None
    terrain: str = ""
    grip: str = ""
    cushion: str = ""
    stability: str = ""
    overall: str = ""
    notes: str = ""


@router.get("/shoes")
def list_shoes(user_id: str = "default", status: str = "active", db: Session = Depends(get_db)):
    repo = ShoeRepository(db)
    shoes = repo.list_by_user(user_id, status=status if status != "all" else None)
    return {
        "shoes": [
            {
                "id": s.id,
                "name": s.name,
                "brand": s.brand,
                "usage": s.usage,
                "traits": json.loads(s.traits) if s.traits else [],
                "initial_km": s.initial_km,
                "total_km": s.total_km,
                "total_runs": s.total_runs,
                "status": s.status,
                "created_at": s.created_at,
            }
            for s in shoes
        ]
    }


@router.post("/shoes")
def create_shoe(req: CreateShoeRequest, db: Session = Depends(get_db)):
    repo = ShoeRepository(db)
    shoe = repo.create(
        user_id=req.user_id,
        name=req.name,
        brand=req.brand,
        usage=req.usage,
        traits=json.dumps(req.traits, ensure_ascii=False),
        initial_km=req.initial_km,
        total_km=req.initial_km,
    )
    return {"status": "created", "id": shoe.id}


@router.get("/shoes/{shoe_id}")
def get_shoe(shoe_id: int, db: Session = Depends(get_db)):
    shoe_repo = ShoeRepository(db)
    log_repo = ShoeLogRepository(db)

    shoe = shoe_repo.get(shoe_id)
    if not shoe:
        return {"error": "shoe not found"}

    logs = log_repo.get_by_shoe(shoe_id)
    return {
        "shoe": {
            "id": shoe.id,
            "name": shoe.name,
            "brand": shoe.brand,
            "usage": shoe.usage,
            "traits": json.loads(shoe.traits) if shoe.traits else [],
            "initial_km": shoe.initial_km,
            "total_km": shoe.total_km,
            "total_runs": shoe.total_runs,
            "status": shoe.status,
            "created_at": shoe.created_at,
        },
        "logs": [
            {
                "id": l.id,
                "activity_run_id": l.activity_run_id,
                "terrain": l.terrain,
                "grip": l.grip,
                "cushion": l.cushion,
                "stability": l.stability,
                "overall": l.overall,
                "notes": l.notes,
                "logged_at": l.logged_at,
            }
            for l in logs
        ],
    }


@router.put("/shoes/{shoe_id}")
def update_shoe(shoe_id: int, updates: dict, db: Session = Depends(get_db)):
    repo = ShoeRepository(db)
    allowed = {"name", "brand", "usage", "traits", "initial_km"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if "traits" in filtered and isinstance(filtered["traits"], list):
        filtered["traits"] = json.dumps(filtered["traits"], ensure_ascii=False)
    result = repo.update(shoe_id, **filtered)
    if not result:
        return {"error": "shoe not found"}
    return {"status": "updated", "id": shoe_id}


@router.delete("/shoes/{shoe_id}")
def retire_shoe(shoe_id: int, db: Session = Depends(get_db)):
    repo = ShoeRepository(db)
    result = repo.retire(shoe_id)
    if not result:
        return {"error": "shoe not found"}
    return {"status": "retired", "id": shoe_id}


@router.post("/shoes/{shoe_id}/log")
def create_shoe_log(shoe_id: int, req: CreateShoeLogRequest, db: Session = Depends(get_db)):
    shoe_repo = ShoeRepository(db)
    log_repo = ShoeLogRepository(db)

    shoe = shoe_repo.get(shoe_id)
    if not shoe:
        return {"error": "shoe not found"}

    log = log_repo.create(
        shoe_id=shoe_id,
        activity_run_id=req.activity_run_id,
        terrain=req.terrain,
        grip=req.grip,
        cushion=req.cushion,
        stability=req.stability,
        overall=req.overall,
        notes=req.notes,
    )

    if req.activity_run_id:
        act_repo = ActivityRepository(db)
        activity = act_repo.get(req.activity_run_id)
        if activity and activity.distance:
            shoe_repo.add_km(shoe_id, activity.distance / 1000)

    return {"status": "logged", "id": log.id}
