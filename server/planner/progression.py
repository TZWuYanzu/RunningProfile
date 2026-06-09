"""Progressive overload calculations with 4-week mesocycle deload."""

from __future__ import annotations


def calculate_week_multiplier(phase_name: str, week_in_phase: int) -> float:
    if phase_name == "减量期":
        return 0.55 + 0.05 * max(0, 2 - week_in_phase)

    if phase_name == "基础期":
        growth_rate = 0.08
    elif phase_name in ("建设期", "发展期"):
        growth_rate = 0.06
    else:  # 专项期
        growth_rate = 0.04

    cycle_pos = week_in_phase % 4
    if cycle_pos == 3:
        return 0.70 + growth_rate * (week_in_phase - 1)

    return 1.0 + growth_rate * week_in_phase


def apply_progression(base_hours: float, base_elevation: float,
                      phase_name: str, week_in_phase: int) -> dict:
    mult = calculate_week_multiplier(phase_name, week_in_phase)
    return {
        "weekly_hours": round(base_hours * mult, 1),
        "weekly_elevation": round(base_elevation * mult, 0),
        "multiplier": round(mult, 2),
        "is_deload": (week_in_phase % 4 == 3 and phase_name != "减量期"),
    }
