from __future__ import annotations

from sqlalchemy.orm import Session

from db.repositories import DialogueRepository, ProfileRepository


class DialogueTimeline:
    def __init__(self, db: Session, user_id: str):
        self.repo = DialogueRepository(db)
        self.profile_repo = ProfileRepository(db)
        self.user_id = user_id

    def append_user(self, content: str) -> int:
        msg = self.repo.append(self.user_id, "user", content)
        return msg.id

    def append_assistant(self, content: str) -> int:
        msg = self.repo.append(self.user_id, "assistant", content)
        return msg.id

    def build_context(self, limit: int = 50) -> list[dict]:
        messages = self.repo.recent(self.user_id, limit=limit)
        return [{"role": m.role, "content": m.content} for m in messages]

    def last_interaction_time(self) -> str | None:
        return self.repo.last_message_time(self.user_id)
