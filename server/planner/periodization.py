"""Periodization engine: splits available weeks into training phases."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from planner.input import PlanInput


@dataclass
class Phase:
    name: str
    weeks: int
    focus: str
    start_date: date
    end_date: date


def generate_periodization(plan_input: PlanInput, plan_start: date) -> list[Phase]:
    weeks_available = (plan_input.race_date - plan_start).days // 7
    if weeks_available < 4:
        return [Phase("专项期", weeks_available, "全力备赛", plan_start, plan_input.race_date - timedelta(days=1))]

    if plan_input.race_type == "road":
        return _road_periodization(weeks_available, plan_start)
    return _trail_periodization(weeks_available, plan_start, plan_input.km_effort)


def _road_periodization(weeks: int, start: date) -> list[Phase]:
    taper = 2 if weeks <= 14 else 3
    remaining = weeks - taper
    base = max(2, int(remaining * 0.35))
    build = max(2, int(remaining * 0.30))
    specific = remaining - base - build

    phases_def = [
        ("基础期", base, "有氧基础+力量，建立跑量"),
        ("发展期", build, "乳酸阈+VO2max提升"),
        ("专项期", specific, "马拉松配速+长距离"),
        ("减量期", taper, "削量保强度，恢复体能"),
    ]
    return _build_phases(phases_def, start)


def _trail_periodization(weeks: int, start: date, km_effort: float) -> list[Phase]:
    if km_effort < 75:  # S级: ~30km越野
        taper = 1
        base_ratio, build_ratio = 0.45, 0.30
    elif km_effort < 155:  # M-L级: 50-100km
        taper = 2
        base_ratio, build_ratio = 0.40, 0.25
    else:  # XL-XXL级: 100km+
        taper = 3
        base_ratio, build_ratio = 0.45, 0.20

    remaining = weeks - taper
    base = max(2, int(remaining * base_ratio))
    build = max(2, int(remaining * build_ratio))
    specific = remaining - base - build

    phases_def = [
        ("基础期", base, "有氧+力量周期化，建立耐受"),
        ("建设期", build, "增量+爬升+背靠背长距离"),
        ("专项期", specific, "赛事模拟+B赛检验"),
        ("减量期", taper, "削量保爬升感觉"),
    ]
    return _build_phases(phases_def, start)


def _build_phases(phases_def: list[tuple[str, int, str]], start: date) -> list[Phase]:
    phases = []
    cursor = start
    for name, wks, focus in phases_def:
        if wks <= 0:
            continue
        end = cursor + timedelta(weeks=wks) - timedelta(days=1)
        phases.append(Phase(name=name, weeks=wks, focus=focus, start_date=cursor, end_date=end))
        cursor = end + timedelta(days=1)
    return phases
