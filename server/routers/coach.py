from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Generator

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.engine import get_db
from db.repositories import ProfileRepository
from agent.router import model_router
from agent.prompts import build_system_prompt
from agent.tools import TOOL_DEFINITIONS
from agent.executor import ToolExecutor
from memory.timeline import DialogueTimeline
from memory.consolidation import MemoryConsolidator

router = APIRouter(prefix="/api/coach", tags=["coach"])


class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _stream_chat(message: str, user_id: str, db: Session) -> Generator[str, None, None]:
    timeline = DialogueTimeline(db, user_id)
    profile_repo = ProfileRepository(db)
    executor = ToolExecutor(db, user_id)
    consolidator = MemoryConsolidator(db, user_id)

    timeline.append_user(message)

    profile = profile_repo.get(user_id)
    profile_dict = _profile_to_dict(profile) if profile else None
    system_prompt = build_system_prompt(profile_dict)

    history = timeline.build_context(limit=30)
    messages = [{"role": "system", "content": system_prompt}] + history

    full_response = ""
    tool_calls_buffer: dict[int, dict] = {}

    for chunk in model_router.chat_stream(messages, tools=TOOL_DEFINITIONS):
        if not chunk.choices:
            continue
        choice = chunk.choices[0]
        delta = choice.delta

        if delta.content:
            full_response += delta.content
            yield _sse_event({"type": "token", "content": delta.content})

        if delta.tool_calls:
            for tc in delta.tool_calls:
                idx = tc.index
                if idx not in tool_calls_buffer:
                    tool_calls_buffer[idx] = {
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                else:
                    tool_calls_buffer[idx]["arguments"] += tc.function.arguments

        if choice.finish_reason == "tool_calls":
            for idx in sorted(tool_calls_buffer.keys()):
                tc = tool_calls_buffer[idx]
                yield _sse_event({
                    "type": "tool_call",
                    "name": tc["name"],
                    "args": json.loads(tc["arguments"]) if tc["arguments"] else {},
                })

                result_str = executor.execute(tc["name"], tc["arguments"])
                result = json.loads(result_str)

                yield _sse_event({"type": "tool_result", "name": tc["name"], "content": result})

                if tc["name"] == "evaluate_ability":
                    consolidator.consolidate_evaluation(result)

                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [{
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": tc["arguments"]},
                    }],
                })
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": result_str,
                })

            tool_calls_buffer.clear()
            full_response = ""

            for chunk2 in model_router.chat_stream(messages, tools=TOOL_DEFINITIONS):
                if not chunk2.choices:
                    continue
                delta2 = chunk2.choices[0].delta
                if delta2.content:
                    full_response += delta2.content
                    yield _sse_event({"type": "token", "content": delta2.content})

    if full_response:
        msg = timeline.append_assistant(full_response)
        yield _sse_event({"type": "done", "message_id": msg})

        current_turn = [
            {"role": "user", "content": message},
            {"role": "assistant", "content": full_response},
        ]
        changes = consolidator.consolidate_dialogue(current_turn, source_dialogue_id=msg)
        if changes:
            yield _sse_event({"type": "memory_update", "changes": changes})

    yield _sse_event({"type": "stream_end"})


@router.post("/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        _stream_chat(req.message, req.user_id, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/onboarding")
async def onboarding(user_id: str = "default", db: Session = Depends(get_db)):
    profile_repo = ProfileRepository(db)
    profile = profile_repo.get(user_id)
    if profile and profile.aerobic_base_score is not None:
        return {"status": "already_done", "message": "学员档案已存在，无需重复初评"}

    executor = ToolExecutor(db, user_id)
    consolidator = MemoryConsolidator(db, user_id)

    trail_eval = json.loads(executor.execute("evaluate_ability", '{"mode": "trail"}'))
    road_eval = json.loads(executor.execute("evaluate_ability", '{"mode": "road"}'))

    consolidator.consolidate_evaluation(trail_eval)

    timeline = DialogueTimeline(db, user_id)
    summary = _format_onboarding_summary(trail_eval, road_eval)
    timeline.append_assistant(summary)

    return {
        "status": "completed",
        "trail_evaluation": trail_eval,
        "road_evaluation": road_eval,
        "greeting": summary,
    }


@router.get("/greeting")
async def greeting(user_id: str = "default", db: Session = Depends(get_db)):
    timeline = DialogueTimeline(db, user_id)
    last_time = timeline.last_interaction_time()

    if not last_time:
        return {"should_greet": True, "message": "你好！我是你的 AI 跑步教练。先让我看看你的训练数据，了解一下你的水平？"}

    try:
        last_dt = datetime.fromisoformat(last_time)
    except ValueError:
        last_dt = datetime.utcnow()

    gap_hours = (datetime.utcnow() - last_dt).total_seconds() / 3600

    if gap_hours < 72:
        return {"should_greet": False, "gap_hours": round(gap_hours, 1)}

    return {
        "should_greet": True,
        "gap_hours": round(gap_hours, 1),
        "message": f"好久没聊了（{int(gap_hours // 24)}天）。这段时间有出去跑吗？让我看看你最近的训练数据。",
    }


def _profile_to_dict(profile) -> dict:
    return {
        "aerobic_base_score": profile.aerobic_base_score,
        "climbing_ability_score": profile.climbing_ability_score,
        "descent_ability_score": profile.descent_ability_score,
        "trail_efficiency_score": profile.trail_efficiency_score,
        "endurance_score": profile.endurance_score,
        "load_risk_score": profile.load_risk_score,
        "current_mode": profile.current_mode,
        "primary_goal": profile.primary_goal,
        "target_race": profile.target_race,
        "injury_history": profile.injury_history,
        "running_experience_years": profile.running_experience_years,
    }


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """Accept audio file, send to DashScope Paraformer ASR, return text."""
    from config import settings

    audio_bytes = await file.read()

    if not settings.qwen_api_key:
        return {"text": "[语音识别需要配置 QWEN_API_KEY]", "language": "zh"}

    import io
    from openai import OpenAI

    client = OpenAI(
        api_key=settings.qwen_api_key,
        base_url=settings.qwen_base_url,
    )

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = file.filename or "recording.webm"

    try:
        transcript = client.audio.transcriptions.create(
            model="paraformer-realtime-v2",
            file=audio_file,
            language="zh",
        )
        return {"text": transcript.text, "language": "zh"}
    except Exception as e:
        return {"text": "", "error": str(e)}


def _format_onboarding_summary(trail_eval: dict, road_eval: dict) -> str:
    lines = ["你好！我刚看完你所有的训练数据，先给你一个初步画像：\n"]

    lines.append("**越野跑能力：**")
    for key, dim in trail_eval.get("dimensions", {}).items():
        lines.append(f"- {dim.get('description', key)}")

    lines.append("\n**公路跑能力：**")
    for key, dim in road_eval.get("dimensions", {}).items():
        lines.append(f"- {dim.get('description', key)}")

    lines.append("\n有几个问题想确认：你目前有什么目标赛事吗？还有，有没有正在困扰你的伤病？")
    return "\n".join(lines)
