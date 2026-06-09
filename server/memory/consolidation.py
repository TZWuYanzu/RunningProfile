from __future__ import annotations

import json
import re
from datetime import datetime
from sqlalchemy.orm import Session

from db.repositories import ProfileRepository, StagingRepository
from config import settings


CONSOLIDATION_PROMPT = """你是一个记忆提取器。从以下教练与学员的对话中，提取应更新到学员档案的信息。

当前学员档案：
{profile_json}

最近对话：
{dialogue}

请以 JSON 数组格式输出变更指令，每项包含：
- op: "ADD" | "UPDATE" | "NOOP"
- field_name: 学员档案字段名（仅限以下字段：primary_goal, target_race, injury_history, running_experience_years, preferred_training_time, personality_notes）
- old_value: 旧值（如果是 UPDATE）
- new_value: 新值
- reason: 变更理由

如果对话中没有需要更新的信息，返回空数组 []。

只提取明确的事实信息，不要推测。"""

FIELD_PATTERNS = {
    "target_race": [
        (r"(?:目标|备赛|参加|报名).*?(?:赛事|比赛|马拉松|越野赛|ultra)[:：是]?\s*(.+?)(?:[，。,.]|$)", None),
        (r"(UTMB|CCC|OCC|TDS|TNF\s*100|武功山|莫干山|崇礼|柴古唐斯|江南百英里)", None),
    ],
    "injury_history": [
        (r"(?:受伤|伤病|疼痛|不适|扭伤|拉伤|膝盖|脚踝|跟腱|足底筋膜).*?(.{5,30}?)(?:[，。,.]|$)", None),
    ],
    "primary_goal": [
        (r"(?:目标|想要?|希望|打算|计划)\s*(?:是|要)?\s*(?:跑|完成|突破|sub|PB|PR)\s*(.{3,30}?)(?:[，。,.]|$)", None),
        (r"(sub\s*\d+|破[34567]|BQ|波马)", None),
    ],
    "running_experience_years": [
        (r"(?:跑了?|跑龄|跑步)\s*(\d+)\s*(?:年|yr)", lambda m: m.group(1)),
    ],
    "preferred_training_time": [
        (r"(?:一般|通常|习惯|喜欢).*?(?:早上|晚上|中午|下午|早晨|傍晚|清晨).*?(?:跑|训练)", None),
    ],
}


class MemoryConsolidator:

    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id
        self.profile_repo = ProfileRepository(db)
        self.staging_repo = StagingRepository(db)

    def consolidate_evaluation(self, eval_result: dict):
        dims = eval_result.get("dimensions", {})
        mode = eval_result.get("mode", "trail")

        updates = {}
        if mode == "trail":
            score_map = {
                "aerobic_base": "aerobic_base_score",
                "climbing_ability": "climbing_ability_score",
                "descent_ability": "descent_ability_score",
                "trail_efficiency": "trail_efficiency_score",
                "endurance": "endurance_score",
                "load_risk": "load_risk_score",
            }
        else:
            score_map = {
                "aerobic_base": "aerobic_base_score",
                "endurance_ceiling": "endurance_score",
                "load_risk": "load_risk_score",
            }

        for dim_key, profile_field in score_map.items():
            dim = dims.get(dim_key)
            if dim and "score" in dim:
                updates[profile_field] = dim["score"]

        if updates:
            updates["current_mode"] = mode
            self.profile_repo.upsert(self.user_id, **updates)

    def consolidate_dialogue(self, dialogue_messages: list[dict],
                             source_dialogue_id: int | None = None) -> list[dict]:
        if not dialogue_messages:
            return []

        user_messages = [m["content"] for m in dialogue_messages if m.get("role") == "user"]
        if not user_messages:
            return []

        if settings.deepseek_api_key:
            return self._consolidate_via_llm(dialogue_messages, source_dialogue_id)
        return self._consolidate_via_rules(user_messages, source_dialogue_id)

    def _consolidate_via_rules(self, user_messages: list[str],
                               source_dialogue_id: int | None) -> list[dict]:
        profile = self.profile_repo.get(self.user_id)
        changes = []
        combined = " ".join(user_messages)

        for field_name, patterns in FIELD_PATTERNS.items():
            current_value = getattr(profile, field_name, None) if profile else None

            for pattern, extractor in patterns:
                match = re.search(pattern, combined, re.IGNORECASE)
                if match:
                    if extractor:
                        new_value = extractor(match)
                    else:
                        new_value = match.group(1).strip() if match.lastindex else match.group(0).strip()

                    if not new_value or new_value == str(current_value):
                        continue

                    op = "UPDATE" if current_value else "ADD"
                    self.staging_repo.create(
                        user_id=self.user_id,
                        op=op,
                        field_name=field_name,
                        old_value=str(current_value) if current_value else "",
                        new_value=new_value,
                        reason=f"从对话中提取: ...{combined[max(0, match.start()-10):match.end()+10]}...",
                        source_dialogue_id=source_dialogue_id or 0,
                    )
                    changes.append({"op": op, "field": field_name, "value": new_value})
                    break

        if changes:
            self._auto_apply_staging()

        return changes

    def _consolidate_via_llm(self, dialogue_messages: list[dict],
                             source_dialogue_id: int | None) -> list[dict]:
        from openai import OpenAI

        profile = self.profile_repo.get(self.user_id)
        profile_json = "{}" if not profile else json.dumps({
            "primary_goal": profile.primary_goal,
            "target_race": profile.target_race,
            "injury_history": profile.injury_history,
            "running_experience_years": profile.running_experience_years,
            "preferred_training_time": profile.preferred_training_time,
            "personality_notes": profile.personality_notes,
        }, ensure_ascii=False)

        dialogue_text = "\n".join(
            f"{'学员' if m['role'] == 'user' else '教练'}: {m['content']}"
            for m in dialogue_messages
        )

        prompt = CONSOLIDATION_PROMPT.format(
            profile_json=profile_json,
            dialogue=dialogue_text,
        )

        client = OpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )

        try:
            resp = client.chat.completions.create(
                model=settings.tier1_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            content = resp.choices[0].message.content.strip()
            json_match = re.search(r"\[.*\]", content, re.DOTALL)
            if not json_match:
                return []

            instructions = json.loads(json_match.group())
        except Exception:
            return self._consolidate_via_rules(
                [m["content"] for m in dialogue_messages if m.get("role") == "user"],
                source_dialogue_id,
            )

        changes = []
        valid_fields = {"primary_goal", "target_race", "injury_history",
                        "running_experience_years", "preferred_training_time",
                        "personality_notes"}

        for instr in instructions:
            op = instr.get("op", "NOOP")
            field = instr.get("field_name", "")
            if op == "NOOP" or field not in valid_fields:
                continue

            self.staging_repo.create(
                user_id=self.user_id,
                op=op,
                field_name=field,
                old_value=instr.get("old_value", ""),
                new_value=instr.get("new_value", ""),
                reason=instr.get("reason", "LLM 提取"),
                source_dialogue_id=source_dialogue_id or 0,
            )
            changes.append({"op": op, "field": field, "value": instr.get("new_value")})

        if changes:
            self._auto_apply_staging()

        return changes

    def _auto_apply_staging(self):
        from memory.profile import AthleteProfileManager
        manager = AthleteProfileManager(self.db, self.user_id)
        manager.update_from_staging()
