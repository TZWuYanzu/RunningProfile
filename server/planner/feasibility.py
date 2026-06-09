"""Feasibility assessment: can the user realistically achieve their goal?"""

from __future__ import annotations

from datetime import date
from planner.input import PlanInput


def assess(plan_input: PlanInput, current_vdot: float | None = None,
           current_itra_pi: int | None = None) -> dict:
    weeks = (plan_input.race_date - date.today()).days // 7

    if weeks < 4:
        return {
            "feasible": False,
            "level": "insufficient_time",
            "message": f"距离赛事仅{weeks}周，时间不足以制定有效备赛计划。建议以完赛为目标。",
            "weeks_available": weeks,
        }

    if plan_input.race_type == "road":
        return _road_feasibility(plan_input, current_vdot, weeks)
    return _trail_feasibility(plan_input, current_itra_pi, weeks)


def _road_feasibility(plan_input: PlanInput, current_vdot: float | None, weeks: int) -> dict:
    if not plan_input.target_time or not current_vdot:
        return {
            "feasible": True,
            "level": "no_target",
            "message": "未设定目标成绩，将以安全完赛为目标制定计划。",
            "weeks_available": weeks,
        }

    from planner.vdot import get_target_vdot
    target_vdot = get_target_vdot(plan_input.target_time, plan_input.race_distance_km)
    gap = target_vdot - current_vdot

    if current_vdot >= 55:
        rate = 0.2
    elif current_vdot >= 45:
        rate = 0.5
    else:
        rate = 1.0
    max_gain = rate * weeks

    if gap <= 0:
        level, msg = "achievable", "目标在当前能力范围内，重点是赛事执行策略。"
    elif gap <= max_gain * 0.7:
        level, msg = "realistic", "目标合理，正常训练可达到。"
    elif gap <= max_gain:
        level, msg = "challenging", "目标有挑战性，需要高质量训练和良好恢复。"
    else:
        level, msg = "aggressive", f"目标较为激进（需提升VDOT {gap:.1f}点，预计最多{max_gain:.1f}），建议调整预期或延后赛事。"

    return {
        "feasible": level != "aggressive",
        "level": level,
        "message": msg,
        "weeks_available": weeks,
        "current_vdot": current_vdot,
        "target_vdot": target_vdot,
        "vdot_gap": round(gap, 1),
    }


def _trail_feasibility(plan_input: PlanInput, current_pi: int | None, weeks: int) -> dict:
    km_effort = plan_input.km_effort

    if km_effort >= 200 and weeks < 16:
        return {
            "feasible": False,
            "level": "insufficient_time",
            "message": f"赛事 km-effort {km_effort:.0f}（超长距离），{weeks}周准备时间不够，建议至少16周。",
            "weeks_available": weeks,
            "km_effort": km_effort,
        }

    if not current_pi:
        return {
            "feasible": True,
            "level": "no_baseline",
            "message": "无 ITRA PI 数据，将根据训练数据评估当前能力后制定计划。",
            "weeks_available": weeks,
            "km_effort": km_effort,
        }

    if plan_input.target_itra_pi:
        gap = plan_input.target_itra_pi - current_pi
        if current_pi >= 700:
            rate_per_month = 5
        elif current_pi >= 500:
            rate_per_month = 10
        else:
            rate_per_month = 15
        max_gain = rate_per_month * (weeks / 4.3)

        if gap <= 0:
            level, msg = "achievable", "目标 PI 在当前能力范围内。"
        elif gap <= max_gain * 0.7:
            level, msg = "realistic", "目标合理。"
        elif gap <= max_gain:
            level, msg = "challenging", "有挑战性，需要系统训练。"
        else:
            level, msg = "aggressive", f"目标较激进（需提升PI {gap}点），建议降低目标。"
    else:
        level, msg = "no_target", "未设定目标 PI，将以安全完赛为目标。"

    return {
        "feasible": level not in ("aggressive", "insufficient_time"),
        "level": level,
        "message": msg,
        "weeks_available": weeks,
        "km_effort": km_effort,
        "current_pi": current_pi,
    }
