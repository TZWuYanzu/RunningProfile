from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.engine import get_db
from db.repositories import TrainingNotesRepository, StagingRepository
from memory.profile import AthleteProfileManager
from memory.notes import TrainingNotesGenerator

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/profile/{user_id}")
async def get_profile(user_id: str = "default", db: Session = Depends(get_db)):
    manager = AthleteProfileManager(db, user_id)
    profile = manager.profile_repo.get(user_id)
    if not profile:
        return {"status": "empty", "message": "学员档案为空，需要先完成 Onboarding"}

    return {
        "user_id": profile.user_id,
        "scores": {
            "aerobic_base": profile.aerobic_base_score,
            "climbing_ability": profile.climbing_ability_score,
            "descent_ability": profile.descent_ability_score,
            "trail_efficiency": profile.trail_efficiency_score,
            "endurance": profile.endurance_score,
            "load_risk": profile.load_risk_score,
        },
        "current_mode": profile.current_mode,
        "primary_goal": profile.primary_goal,
        "target_race": profile.target_race,
        "injury_history": profile.injury_history,
        "running_experience_years": profile.running_experience_years,
        "preferred_training_time": profile.preferred_training_time,
        "personality_notes": profile.personality_notes,
        "updated_at": profile.updated_at,
        "summary": manager.get_summary(),
    }


@router.get("/notes/{user_id}")
async def get_notes(user_id: str = "default", limit: int = 20,
                    db: Session = Depends(get_db)):
    repo = TrainingNotesRepository(db)
    notes = repo.get_by_user(user_id, limit=limit)
    return {
        "user_id": user_id,
        "count": len(notes),
        "notes": [
            {
                "id": n.id,
                "activity_id": n.activity_id,
                "coach_note": n.coach_note,
                "tags": json.loads(n.tags) if n.tags else [],
                "created_at": n.created_at,
            }
            for n in notes
        ],
    }


@router.get("/staging/{user_id}")
async def get_staging(user_id: str = "default", db: Session = Depends(get_db)):
    repo = StagingRepository(db)
    pending = repo.pending(user_id)
    return {
        "user_id": user_id,
        "count": len(pending),
        "entries": [
            {
                "id": e.id,
                "op": e.op,
                "field_name": e.field_name,
                "old_value": e.old_value,
                "new_value": e.new_value,
                "reason": e.reason,
                "source_dialogue_id": e.source_dialogue_id,
                "created_at": e.created_at,
            }
            for e in pending
        ],
    }


@router.post("/notes/generate")
async def generate_notes(user_id: str = "default",
                         activity_ids: Optional[list[int]] = None,
                         db: Session = Depends(get_db)):
    generator = TrainingNotesGenerator(db, user_id)
    results = generator.generate_batch(activity_ids)
    return {
        "user_id": user_id,
        "generated": len(results),
        "notes": results,
    }
