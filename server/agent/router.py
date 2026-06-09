from __future__ import annotations

import json
import time
from typing import Generator

from openai import OpenAI

from config import settings


TIER1_KEYWORDS = {"你好", "谢谢", "好的", "明白", "收到", "嗯"}

TIER2_TRIGGERS = {
    "evaluate_ability", "weekly_summary", "generate_plan",
    "get_recent_activities", "search_history",
    "update_plan", "get_weekly_summary",
}

TIER3_TRIGGERS = {"race_strategy", "season_plan"}


class ModelRouter:
    def __init__(self):
        self.clients: dict[str, OpenAI] = {}
        self._mock_mode = True
        self._init_clients()

    def _init_clients(self):
        if settings.deepseek_api_key:
            self.clients["deepseek"] = OpenAI(
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
            )
            self._mock_mode = False
        if settings.qwen_api_key:
            self.clients["qwen"] = OpenAI(
                api_key=settings.qwen_api_key,
                base_url=settings.qwen_base_url,
            )

    @property
    def is_mock(self) -> bool:
        return self._mock_mode

    def route(self, message: str, active_tool: str = None) -> tuple[str, str]:
        if active_tool and active_tool in TIER3_TRIGGERS:
            return self._tier3()
        if active_tool and active_tool in TIER2_TRIGGERS:
            return self._tier2()

        msg_stripped = message.strip()
        if len(msg_stripped) < 10 and any(k in msg_stripped for k in TIER1_KEYWORDS):
            return self._tier1()

        return self._tier2()

    def _tier1(self) -> tuple[str, str]:
        return "deepseek", settings.tier1_model

    def _tier2(self) -> tuple[str, str]:
        return "deepseek", settings.tier2_model

    def _tier3(self) -> tuple[str, str]:
        if "qwen" in self.clients:
            return "qwen", settings.tier3_model
        return self._tier2()

    def get_client(self, provider: str) -> OpenAI:
        if provider not in self.clients:
            raise ValueError(f"Provider '{provider}' not configured. Check API keys in .env")
        return self.clients[provider]

    def chat_stream(self, messages: list[dict], tools: list[dict] = None):
        if self._mock_mode:
            yield from self._mock_stream(messages, tools)
            return

        provider, model = self.route(messages[-1].get("content", ""))
        client = self.get_client(provider)

        kwargs = {"model": model, "messages": messages, "stream": True}
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = client.chat.completions.create(**kwargs)
        for chunk in response:
            yield chunk

    def _mock_stream(self, messages: list[dict], tools: list[dict] = None):
        last_msg = messages[-1] if messages else {}
        last_role = last_msg.get("role", "")
        user_msg = last_msg.get("content", "") or ""

        if last_role == "tool":
            response = _generate_mock_tool_response(messages)
            for char in response:
                yield _mock_content_chunk(char)
            yield _mock_done_chunk()
            return

        if "什么水平" in user_msg or "能力" in user_msg or "评估" in user_msg:
            yield _mock_tool_call_chunk("evaluate_ability", {"mode": "trail"})
            return

        if "最近" in user_msg and ("训练" in user_msg or "跑" in user_msg):
            yield _mock_tool_call_chunk("get_recent_activities", {"count": 5})
            return

        if "档案" in user_msg or "了解我" in user_msg:
            yield _mock_tool_call_chunk("get_profile", {})
            return

        response = _generate_mock_response(user_msg)
        for char in response:
            yield _mock_content_chunk(char)
        yield _mock_done_chunk()


class _MockChunk:
    def __init__(self, delta_content=None, delta_tool_calls=None, finish_reason=None):
        self.choices = [_MockChoice(delta_content, delta_tool_calls, finish_reason)]


class _MockChoice:
    def __init__(self, delta_content, delta_tool_calls, finish_reason):
        self.delta = _MockDelta(delta_content, delta_tool_calls)
        self.finish_reason = finish_reason


class _MockDelta:
    def __init__(self, content, tool_calls):
        self.content = content
        self.tool_calls = tool_calls


class _MockToolCall:
    def __init__(self, id, name, arguments):
        self.id = id
        self.index = 0
        self.type = "function"
        self.function = _MockFunction(name, arguments)


class _MockFunction:
    def __init__(self, name, arguments):
        self.name = name
        self.arguments = arguments


def _mock_content_chunk(text: str) -> _MockChunk:
    return _MockChunk(delta_content=text)


def _mock_tool_call_chunk(name: str, args: dict) -> _MockChunk:
    tc = _MockToolCall(f"mock_{name}_{int(time.time())}", name, json.dumps(args))
    return _MockChunk(delta_tool_calls=[tc], finish_reason="tool_calls")


def _mock_done_chunk() -> _MockChunk:
    return _MockChunk(finish_reason="stop")


def _generate_mock_tool_response(messages: list[dict]) -> str:
    tool_content = messages[-1].get("content", "")
    try:
        data = json.loads(tool_content)
    except (json.JSONDecodeError, TypeError):
        data = {}

    if "dimensions" in data:
        mode = data.get("mode", "trail")
        dims = data.get("dimensions", {})
        parts = []
        for key, dim in dims.items():
            desc = dim.get("description", "")
            if desc:
                parts.append(f"- {desc}")
        mode_label = "越野跑" if mode == "trail" else "公路跑"
        return (
            f"[Mock] 根据你的数据，以下是{mode_label}能力评估：\n"
            + "\n".join(parts)
            + "\n\n整体来看，建议你先从增加训练量开始。有什么具体目标赛事吗？"
        )

    if "activities" in data:
        acts = data["activities"]
        if not acts:
            return "[Mock] 暂时没有查到最近的训练记录。你最近有在跑吗？"
        lines = [f"- {a.get('date', '')} {a.get('distance_km', 0)}km" for a in acts[:5]]
        return "[Mock] 最近的训练记录：\n" + "\n".join(lines)

    return "[Mock] 数据已获取，需要我进一步分析吗？"


def _generate_mock_response(user_msg: str) -> str:
    if "累" in user_msg or "疲" in user_msg:
        return (
            "你说的累是身体上感觉重，还是心理上不想跑？"
            "这两者的处理方式不一样——如果是身体疲劳，我们看看最近的训练负荷；"
            "如果是心理层面的，可能需要调整一下训练节奏。"
        )
    if "计划" in user_msg:
        return (
            "[Mock] 根据你当前的能力评估和目标赛事，我建议这样安排："
            "本周以恢复为主，2次轻松跑（心率Z2）+ 1次长距离。"
            "具体配速和距离等我查看完你最近的数据再给出。"
        )
    return (
        f"[Mock 模式] 收到你的消息：「{user_msg[:50]}」。"
        "当前未配置 LLM API Key，使用模拟响应。"
        "配置 DEEPSEEK_API_KEY 后将使用真实 AI 教练回复。"
    )


model_router = ModelRouter()
