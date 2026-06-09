from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from db.models import (
    Activity,
    AthleteProfile,
    TrainingNote,
    DialogueMessage,
    ProfileStaging,
    TrainingPlan,
    RacePlan,
    DailyPlan,
)


class ActivityRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        limit: int = 20,
        offset: int = 0,
        activity_type: Optional[str] = None,
        date_after: Optional[str] = None,
        date_before: Optional[str] = None,
        location_like: Optional[str] = None,
        min_elevation: Optional[float] = None,
    ) -> list[Activity]:
        q = self.db.query(Activity)
        if activity_type:
            q = q.filter(Activity.type == activity_type)
        if date_after:
            q = q.filter(Activity.start_date_local >= date_after)
        if date_before:
            q = q.filter(Activity.start_date_local <= date_before)
        if location_like:
            q = q.filter(Activity.location_country.like(f"%{location_like}%"))
        if min_elevation:
            q = q.filter(Activity.elevation_gain >= min_elevation)
        return q.order_by(desc(Activity.start_date_local)).offset(offset).limit(limit).all()

    def get(self, run_id: int) -> Optional[Activity]:
        return self.db.query(Activity).filter(Activity.run_id == run_id).first()

    def count(self) -> int:
        return self.db.query(Activity).count()

    def recent(self, n: int = 5) -> list[Activity]:
        return (
            self.db.query(Activity)
            .order_by(desc(Activity.start_date_local))
            .limit(n)
            .all()
        )


class ProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> Optional[AthleteProfile]:
        return self.db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()

    def upsert(self, user_id: str, **fields) -> AthleteProfile:
        profile = self.get(user_id)
        if not profile:
            profile = AthleteProfile(user_id=user_id, **fields)
            self.db.add(profile)
        else:
            for k, v in fields.items():
                if hasattr(profile, k):
                    setattr(profile, k, v)
        profile.updated_at = datetime.utcnow().isoformat()
        self.db.commit()
        self.db.refresh(profile)
        return profile


class TrainingNotesRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: str, limit: int = 20) -> list[TrainingNote]:
        return (
            self.db.query(TrainingNote)
            .filter(TrainingNote.user_id == user_id)
            .order_by(desc(TrainingNote.created_at))
            .limit(limit)
            .all()
        )

    def get_by_activity_ids(self, activity_ids: list[int]) -> list[TrainingNote]:
        return (
            self.db.query(TrainingNote)
            .filter(TrainingNote.activity_id.in_(activity_ids))
            .all()
        )

    def create(self, user_id: str, activity_id: int, coach_note: str, tags: str) -> TrainingNote:
        note = TrainingNote(
            user_id=user_id,
            activity_id=activity_id,
            coach_note=coach_note,
            tags=tags,
            created_at=datetime.utcnow().isoformat(),
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note


class DialogueRepository:
    def __init__(self, db: Session):
        self.db = db

    def append(self, user_id: str, role: str, content: str) -> DialogueMessage:
        msg = DialogueMessage(
            user_id=user_id,
            role=role,
            content=content,
            created_at=datetime.utcnow().isoformat(),
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def recent(self, user_id: str, limit: int = 100) -> list[DialogueMessage]:
        return (
            self.db.query(DialogueMessage)
            .filter(
                DialogueMessage.user_id == user_id,
                DialogueMessage.is_archived == 0,
            )
            .order_by(DialogueMessage.id)
            .limit(limit)
            .all()
        )

    def last_message_time(self, user_id: str) -> Optional[str]:
        msg = (
            self.db.query(DialogueMessage)
            .filter(DialogueMessage.user_id == user_id)
            .order_by(desc(DialogueMessage.id))
            .first()
        )
        return msg.created_at if msg else None


class StagingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: str, op: str, field_name: str,
               old_value: str, new_value: str, reason: str,
               source_dialogue_id: int) -> ProfileStaging:
        entry = ProfileStaging(
            user_id=user_id,
            op=op,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            source_dialogue_id=source_dialogue_id,
            created_at=datetime.utcnow().isoformat(),
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def pending(self, user_id: str) -> list[ProfileStaging]:
        return (
            self.db.query(ProfileStaging)
            .filter(ProfileStaging.user_id == user_id, ProfileStaging.status == "pending")
            .all()
        )

    def apply(self, staging_id: int):
        entry = self.db.query(ProfileStaging).get(staging_id)
        if entry:
            entry.status = "applied"
            entry.reviewed_at = datetime.utcnow().isoformat()
            self.db.commit()


class PlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_month(self, user_id: str, year: int, month: int) -> list[TrainingPlan]:
        prefix = f"{year:04d}-{month:02d}"
        return (
            self.db.query(TrainingPlan)
            .filter(
                TrainingPlan.user_id == user_id,
                TrainingPlan.plan_date.like(f"{prefix}%"),
            )
            .order_by(TrainingPlan.plan_date)
            .all()
        )

    def get_by_date(self, user_id: str, date: str) -> Optional[TrainingPlan]:
        return (
            self.db.query(TrainingPlan)
            .filter(TrainingPlan.user_id == user_id, TrainingPlan.plan_date == date)
            .first()
        )

    def create(self, **fields) -> TrainingPlan:
        plan = TrainingPlan(
            **fields,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def update(self, plan_id: int, **fields) -> Optional[TrainingPlan]:
        plan = self.db.query(TrainingPlan).get(plan_id)
        if not plan:
            return None
        for k, v in fields.items():
            if hasattr(plan, k):
                setattr(plan, k, v)
        plan.updated_at = datetime.utcnow().isoformat()
        self.db.commit()
        self.db.refresh(plan)
        return plan


class RacePlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **fields) -> RacePlan:
        plan = RacePlan(
            **fields,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def get(self, plan_id: int) -> Optional[RacePlan]:
        return self.db.query(RacePlan).filter(RacePlan.id == plan_id).first()

    def list_active(self, user_id: str) -> list[RacePlan]:
        return (
            self.db.query(RacePlan)
            .filter(RacePlan.user_id == user_id, RacePlan.status == "active")
            .order_by(RacePlan.race_date)
            .all()
        )

    def update(self, plan_id: int, **fields) -> Optional[RacePlan]:
        plan = self.get(plan_id)
        if not plan:
            return None
        for k, v in fields.items():
            if hasattr(plan, k):
                setattr(plan, k, v)
        plan.updated_at = datetime.utcnow().isoformat()
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def abandon(self, plan_id: int) -> Optional[RacePlan]:
        return self.update(plan_id, status="abandoned")


class DailyPlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_batch(self, plans: list[dict]) -> list[DailyPlan]:
        now = datetime.utcnow().isoformat()
        objects = []
        for p in plans:
            obj = DailyPlan(**p, created_at=now, updated_at=now)
            self.db.add(obj)
            objects.append(obj)
        self.db.commit()
        for obj in objects:
            self.db.refresh(obj)
        return objects

    def get_by_plan_id(self, plan_id: int) -> list[DailyPlan]:
        return (
            self.db.query(DailyPlan)
            .filter(DailyPlan.plan_id == plan_id)
            .order_by(DailyPlan.plan_date)
            .all()
        )

    def get_by_date_range(self, user_id: str, start: str, end: str) -> list[DailyPlan]:
        return (
            self.db.query(DailyPlan)
            .filter(
                DailyPlan.user_id == user_id,
                DailyPlan.plan_date >= start,
                DailyPlan.plan_date <= end,
            )
            .order_by(DailyPlan.plan_date)
            .all()
        )

    def get_by_date(self, user_id: str, date: str) -> Optional[DailyPlan]:
        return (
            self.db.query(DailyPlan)
            .filter(DailyPlan.user_id == user_id, DailyPlan.plan_date == date)
            .first()
        )

    def get_by_month(self, user_id: str, year: int, month: int) -> list[DailyPlan]:
        prefix = f"{year:04d}-{month:02d}"
        return (
            self.db.query(DailyPlan)
            .filter(DailyPlan.user_id == user_id, DailyPlan.plan_date.like(f"{prefix}%"))
            .order_by(DailyPlan.plan_date)
            .all()
        )

    def update(self, daily_plan_id: int, **fields) -> Optional[DailyPlan]:
        plan = self.db.query(DailyPlan).filter(DailyPlan.id == daily_plan_id).first()
        if not plan:
            return None
        for k, v in fields.items():
            if hasattr(plan, k):
                setattr(plan, k, v)
        plan.updated_at = datetime.utcnow().isoformat()
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def match_activity(self, daily_plan_id: int, activity_id: int,
                       completion_status: str, completion_pct: float,
                       coach_feedback: str = "", deviation_notes: str = "") -> Optional[DailyPlan]:
        return self.update(
            daily_plan_id,
            matched_activity_id=activity_id,
            completion_status=completion_status,
            completion_pct=completion_pct,
            coach_feedback=coach_feedback,
            deviation_notes=deviation_notes,
        )
