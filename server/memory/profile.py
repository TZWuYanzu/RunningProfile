from __future__ import annotations

from sqlalchemy.orm import Session

from db.repositories import ProfileRepository, StagingRepository


class AthleteProfileManager:

    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id
        self.profile_repo = ProfileRepository(db)
        self.staging_repo = StagingRepository(db)

    def get_or_create(self):
        profile = self.profile_repo.get(self.user_id)
        if not profile:
            profile = self.profile_repo.upsert(self.user_id)
        return profile

    def update_from_staging(self) -> list[dict]:
        pending = self.staging_repo.pending(self.user_id)
        if not pending:
            return []

        applied = []
        profile = self.get_or_create()

        for entry in pending:
            if entry.op in ("ADD", "UPDATE") and entry.field_name and entry.new_value:
                if hasattr(profile, entry.field_name):
                    setattr(profile, entry.field_name, entry.new_value)
                    self.staging_repo.apply(entry.id)
                    applied.append({
                        "field": entry.field_name,
                        "op": entry.op,
                        "value": entry.new_value,
                        "reason": entry.reason,
                    })
            elif entry.op == "DELETE" and entry.field_name:
                if hasattr(profile, entry.field_name):
                    setattr(profile, entry.field_name, None)
                    self.staging_repo.apply(entry.id)
                    applied.append({
                        "field": entry.field_name,
                        "op": "DELETE",
                        "reason": entry.reason,
                    })
            elif entry.op == "NOOP":
                self.staging_repo.apply(entry.id)

        if applied:
            from datetime import datetime
            profile.updated_at = datetime.utcnow().isoformat()
            self.db.commit()

        return applied

    def get_summary(self) -> str:
        profile = self.profile_repo.get(self.user_id)
        if not profile:
            return "学员档案为空，尚未完成 Onboarding。"

        lines = []

        scores = {
            "有氧基础": profile.aerobic_base_score,
            "爬升能力": profile.climbing_ability_score,
            "下降能力": profile.descent_ability_score,
            "越野效率": profile.trail_efficiency_score,
            "长时续航": profile.endurance_score,
            "负荷风险": profile.load_risk_score,
        }
        scored = {k: v for k, v in scores.items() if v is not None}
        if scored:
            parts = [f"{k}: {v:.0f}" for k, v in scored.items()]
            lines.append(f"能力评分: {' / '.join(parts)}")

        if profile.current_mode:
            lines.append(f"当前模式: {profile.current_mode}")
        if profile.primary_goal:
            lines.append(f"训练目标: {profile.primary_goal}")
        if profile.target_race:
            lines.append(f"目标赛事: {profile.target_race}")
        if profile.injury_history:
            lines.append(f"伤病史: {profile.injury_history}")
        if profile.running_experience_years:
            lines.append(f"跑龄: {profile.running_experience_years}年")
        if profile.personality_notes:
            lines.append(f"备注: {profile.personality_notes}")

        return "\n".join(lines) if lines else "学员档案已创建，但信息尚不完整。"
