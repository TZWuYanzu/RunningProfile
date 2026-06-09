"""Weekly template generation for road and trail plans."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from planner.input import PlanInput
from planner.progression import apply_progression


WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


@dataclass
class DayTemplate:
    day_of_week: str
    workout_type: str
    title: str
    description: str
    target_duration_min: float | None = None
    target_distance_km: float | None = None
    target_elevation_m: float | None = None
    target_hr_zone: str | None = None
    target_pace: str | None = None
    intensity: str = "easy"


def generate_week(plan_input: PlanInput, phase_name: str, week_in_phase: int,
                  base_hours: float, base_elevation: float,
                  training_paces: dict | None = None) -> list[DayTemplate]:
    prog = apply_progression(base_hours, base_elevation, phase_name, week_in_phase)

    if plan_input.race_type == "road":
        return _road_week(plan_input, phase_name, prog, training_paces or {})
    return _trail_week(plan_input, phase_name, prog)


def _road_week(plan_input: PlanInput, phase_name: str,
               prog: dict, paces: dict) -> list[DayTemplate]:
    weekly_km = prog["weekly_hours"] * 10  # rough: ~10km/hr for road
    e_pace = paces.get("easy", "5'30\"/km")
    t_pace = paces.get("threshold", "4'40\"/km")
    m_pace = paces.get("marathon", "5'00\"/km")
    i_pace = paces.get("interval", "4'10\"/km")

    rest_set = set(plan_input.rest_days)
    long_day = plan_input.long_run_day
    training_days = [d for d in WEEKDAY_NAMES if d not in rest_set]

    days: list[DayTemplate] = []
    for d in WEEKDAY_NAMES:
        if d in rest_set:
            days.append(DayTemplate(d, "休息", "休息日", "完全休息或轻度活动", intensity="rest"))
        elif d == long_day:
            if phase_name == "基础期":
                dist = weekly_km * 0.30
                days.append(DayTemplate(d, "长距离", f"长距离 {dist:.0f}km",
                    f"心率Z2，配速 {e_pace}，匀速完成",
                    target_distance_km=round(dist, 1), target_hr_zone="Z2",
                    target_pace=e_pace, intensity="moderate"))
            elif phase_name == "专项期":
                dist = weekly_km * 0.35
                days.append(DayTemplate(d, "长距离", f"长距离含马配 {dist:.0f}km",
                    f"前半Z2，后半按马拉松配速 {m_pace}",
                    target_distance_km=round(dist, 1), target_hr_zone="Z2-Z3",
                    target_pace=m_pace, intensity="hard"))
            else:
                dist = weekly_km * 0.30
                days.append(DayTemplate(d, "长距离", f"长距离 {dist:.0f}km",
                    f"Z2 为主，配速 {e_pace}",
                    target_distance_km=round(dist, 1), target_hr_zone="Z2",
                    target_pace=e_pace, intensity="moderate"))
        else:
            days.append(_assign_road_session(d, training_days, long_day,
                                            phase_name, weekly_km, paces, prog))
    return days


def _assign_road_session(day: str, training_days: list, long_day: str,
                         phase: str, weekly_km: float, paces: dict,
                         prog: dict) -> DayTemplate:
    non_long_days = [d for d in training_days if d != long_day]
    idx = non_long_days.index(day) if day in non_long_days else 0
    num_sessions = len(non_long_days)

    e_pace = paces.get("easy", "5'30\"/km")
    t_pace = paces.get("threshold", "4'40\"/km")
    i_pace = paces.get("interval", "4'10\"/km")

    easy_dist = weekly_km * 0.12

    if phase == "基础期":
        if idx == 0:
            return DayTemplate(day, "轻松跑", f"轻松跑 {easy_dist:.0f}km",
                f"配速 {e_pace}，心率Z1-Z2", target_distance_km=round(easy_dist, 1),
                target_hr_zone="Z1-Z2", target_pace=e_pace, intensity="easy")
        elif idx == 1:
            dist = weekly_km * 0.15
            return DayTemplate(day, "有氧跑", f"有氧跑 {dist:.0f}km + strides",
                f"Z2 跑 + 4×20s 大步流星", target_distance_km=round(dist, 1),
                target_hr_zone="Z2", intensity="easy")
        else:
            return DayTemplate(day, "轻松跑", f"轻松跑 {easy_dist:.0f}km",
                f"配速 {e_pace}", target_distance_km=round(easy_dist, 1),
                target_hr_zone="Z1-Z2", target_pace=e_pace, intensity="easy")

    elif phase == "发展期":
        if idx == 0:
            return DayTemplate(day, "间歇", "间歇训练 5×1000m",
                f"1000m @ {i_pace}，间休400m慢跑",
                target_duration_min=50, target_hr_zone="Z4-Z5",
                target_pace=i_pace, intensity="hard")
        elif idx == 1:
            dist = weekly_km * 0.15
            return DayTemplate(day, "节奏跑", f"节奏跑 {dist:.0f}km",
                f"含20min连续 @ {t_pace}", target_distance_km=round(dist, 1),
                target_hr_zone="Z3-Z4", target_pace=t_pace, intensity="hard")
        else:
            return DayTemplate(day, "轻松跑", f"轻松跑 {easy_dist:.0f}km",
                f"配速 {e_pace}", target_distance_km=round(easy_dist, 1),
                target_hr_zone="Z1-Z2", intensity="easy")

    elif phase == "专项期":
        if idx == 0:
            return DayTemplate(day, "马配跑", "马拉松配速跑",
                f"10-15km @ 马拉松配速 {paces.get('marathon', '5:00/km')}",
                target_distance_km=round(weekly_km * 0.18, 1),
                target_hr_zone="Z3", target_pace=paces.get("marathon"), intensity="hard")
        elif idx == 1:
            return DayTemplate(day, "节奏跑", "节奏跑",
                f"25min连续 @ {t_pace}", target_duration_min=55,
                target_hr_zone="Z3-Z4", target_pace=t_pace, intensity="hard")
        else:
            return DayTemplate(day, "轻松跑", f"轻松跑 {easy_dist:.0f}km",
                f"配速 {e_pace}", target_distance_km=round(easy_dist, 1),
                target_hr_zone="Z1-Z2", intensity="easy")

    else:  # 减量期
        if idx == 0:
            return DayTemplate(day, "节奏跑", "减量节奏跑",
                f"15min @ {t_pace}，保持感觉", target_duration_min=40,
                target_hr_zone="Z3-Z4", target_pace=t_pace, intensity="moderate")
        else:
            dist = easy_dist * 0.7
            return DayTemplate(day, "轻松跑", f"轻松跑 {dist:.0f}km",
                "轻松保持活性", target_distance_km=round(dist, 1),
                target_hr_zone="Z1-Z2", intensity="easy")


def _trail_week(plan_input: PlanInput, phase_name: str, prog: dict) -> list[DayTemplate]:
    weekly_hrs = prog["weekly_hours"]
    weekly_elev = prog["weekly_elevation"]
    is_deload = prog["is_deload"]
    rest_set = set(plan_input.rest_days)
    long_day = plan_input.long_run_day

    days: list[DayTemplate] = []
    for d in WEEKDAY_NAMES:
        if d in rest_set:
            days.append(DayTemplate(d, "休息", "休息日", "完全休息", intensity="rest"))
        elif d == long_day:
            days.append(_trail_long_run(d, phase_name, weekly_hrs, weekly_elev, is_deload))
        else:
            days.append(_trail_session(d, plan_input, phase_name,
                                       weekly_hrs, weekly_elev, long_day, rest_set))
    return days


def _trail_long_run(day: str, phase: str, weekly_hrs: float,
                    weekly_elev: float, is_deload: bool) -> DayTemplate:
    long_ratio = 0.35 if not is_deload else 0.25
    dur_min = weekly_hrs * long_ratio * 60
    elev = weekly_elev * long_ratio

    if phase == "基础期":
        return DayTemplate(day, "长距离", f"长距离 {dur_min:.0f}min",
            f"Z1-Z2 为主，含 D+{elev:.0f}m，保持匀速",
            target_duration_min=round(dur_min), target_elevation_m=round(elev),
            target_hr_zone="Z1-Z2", intensity="moderate")
    elif phase == "建设期":
        return DayTemplate(day, "长距离山地", f"山地长距离 {dur_min:.0f}min",
            f"D+{elev:.0f}m，后半程模拟疲劳状态下的爬升",
            target_duration_min=round(dur_min), target_elevation_m=round(elev),
            target_hr_zone="Z2-Z3", intensity="hard")
    elif phase == "专项期":
        return DayTemplate(day, "赛事模拟", f"赛事模拟 {dur_min:.0f}min",
            f"模拟赛道强度和节奏，D+{elev:.0f}m，练补给策略",
            target_duration_min=round(dur_min), target_elevation_m=round(elev),
            target_hr_zone="Z2-Z3", intensity="hard")
    else:
        dur_min *= 0.6
        return DayTemplate(day, "轻松长跑", f"减量长跑 {dur_min:.0f}min",
            "Z1-Z2 轻松完成，保持腿感",
            target_duration_min=round(dur_min), target_hr_zone="Z1-Z2", intensity="easy")


def _trail_session(day: str, plan_input: PlanInput, phase: str,
                   weekly_hrs: float, weekly_elev: float,
                   long_day: str, rest_set: set) -> DayTemplate:
    training_days = [d for d in WEEKDAY_NAMES if d not in rest_set and d != long_day]
    idx = training_days.index(day) if day in training_days else 0

    session_dur = weekly_hrs * 0.15 * 60  # each non-long session ~15% of weekly time

    if phase == "基础期":
        templates = [
            DayTemplate(day, "轻松跑", f"轻松跑 {session_dur:.0f}min",
                "Z1-Z2 有氧跑，平路或缓坡",
                target_duration_min=round(session_dur), target_hr_zone="Z1-Z2", intensity="easy"),
            DayTemplate(day, "力量训练", "力量训练 60min",
                "深蹲/单腿蹲/核心/臀桥，越野跑者专项力量",
                target_duration_min=60, intensity="moderate"),
            DayTemplate(day, "有氧跑+strides", f"有氧跑 {session_dur:.0f}min + 4×20s",
                "Z2 跑 + 结束前4组20s大步加速",
                target_duration_min=round(session_dur), target_hr_zone="Z2", intensity="easy"),
            DayTemplate(day, "恢复跑", f"恢复跑 {session_dur*0.7:.0f}min",
                "Z1 极轻松",
                target_duration_min=round(session_dur * 0.7), target_hr_zone="Z1", intensity="easy"),
        ]
    elif phase == "建设期":
        elev_session = weekly_elev * 0.2
        templates = [
            DayTemplate(day, "垂直间歇", f"爬坡重复 D+{elev_session:.0f}m",
                f"6-8组×3min Z4上坡 + 下坡慢跑恢复",
                target_duration_min=round(session_dur), target_elevation_m=round(elev_session),
                target_hr_zone="Z4", intensity="hard"),
            DayTemplate(day, "轻松跑", f"轻松跑 {session_dur:.0f}min",
                "Z1-Z2 恢复性有氧",
                target_duration_min=round(session_dur), target_hr_zone="Z1-Z2", intensity="easy"),
            DayTemplate(day, "力量训练", "力量训练 50min",
                "维持力量，不增负荷",
                target_duration_min=50, intensity="moderate"),
            DayTemplate(day, "节奏跑", f"越野节奏跑 {session_dur:.0f}min",
                "含20min Z3 连续爬升",
                target_duration_min=round(session_dur), target_hr_zone="Z3", intensity="hard"),
        ]
    elif phase == "专项期":
        elev_session = weekly_elev * 0.2
        templates = [
            DayTemplate(day, "ME训练", f"肌耐力爬坡 D+{elev_session:.0f}m",
                "长坡连续Z3-Z4爬升20-40min",
                target_duration_min=round(session_dur), target_elevation_m=round(elev_session),
                target_hr_zone="Z3-Z4", intensity="hard"),
            DayTemplate(day, "轻松跑", f"轻松跑 {session_dur*0.8:.0f}min",
                "Z1-Z2 恢复",
                target_duration_min=round(session_dur * 0.8), target_hr_zone="Z1-Z2", intensity="easy"),
            DayTemplate(day, "中距离山地", f"中距离 {session_dur*1.2:.0f}min",
                "背靠背第2天，含少量D+",
                target_duration_min=round(session_dur * 1.2), target_hr_zone="Z2", intensity="moderate"),
            DayTemplate(day, "轻松跑", f"轻松跑 {session_dur*0.7:.0f}min",
                "保持活性",
                target_duration_min=round(session_dur * 0.7), target_hr_zone="Z1", intensity="easy"),
        ]
    else:  # 减量期
        templates = [
            DayTemplate(day, "轻松跑", f"轻松跑 {session_dur*0.5:.0f}min",
                "Z1-Z2 保持腿感",
                target_duration_min=round(session_dur * 0.5), target_hr_zone="Z1-Z2", intensity="easy"),
            DayTemplate(day, "短间歇", "短间歇保持锐度",
                "4×30s 快跑 + 充分恢复",
                target_duration_min=30, target_hr_zone="Z4", intensity="moderate"),
        ]

    return templates[idx % len(templates)]
