from __future__ import annotations

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from db.models import Activity


def evaluate_trail(db: Session, user_id: str = "default") -> dict:
    now = datetime.utcnow()
    four_weeks_ago = (now - timedelta(weeks=4)).strftime("%Y-%m-%d")
    twelve_weeks_ago = (now - timedelta(weeks=12)).strftime("%Y-%m-%d")

    recent = _query_activities(db, four_weeks_ago)
    historical = _query_activities(db, twelve_weeks_ago)
    trail_recent = [a for a in recent if _is_trail(a)]
    trail_historical = [a for a in historical if _is_trail(a)]

    return {
        "mode": "trail",
        "period": f"近4周 ({four_weeks_ago} ~ now)",
        "activity_count": len(recent),
        "trail_activity_count": len(trail_recent),
        "dimensions": {
            "aerobic_base": _aerobic_base(recent, historical),
            "climbing_ability": _climbing_ability(trail_recent, trail_historical),
            "descent_ability": _descent_ability(trail_recent),
            "trail_efficiency": _trail_efficiency(trail_recent),
            "endurance": _endurance(recent, historical),
            "load_risk": _load_risk(recent),
        },
    }


def _query_activities(db: Session, since: str) -> list[Activity]:
    return (
        db.query(Activity)
        .filter(Activity.start_date_local >= since)
        .order_by(Activity.start_date_local)
        .all()
    )


def _is_trail(a: Activity) -> bool:
    subtype = (a.subtype or "").lower()
    name = (a.name or "").lower()
    return (
        subtype in ("trail", "trail_run")
        or "trail" in name
        or "越野" in name
        or (a.elevation_gain and a.elevation_gain > 200 and a.distance and a.distance > 5000)
    )


def _parse_moving_seconds(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time)
    if "day" in s:
        return 0
    parts = s.replace("1970-01-01 ", "").split(":")
    try:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    except (ValueError, IndexError):
        return 0


def _clamp(score: float) -> int:
    return max(0, min(100, int(score)))


def _aerobic_base(recent: list[Activity], historical: list[Activity]) -> dict:
    if not recent:
        return {"score": 0, "description": "近4周无训练数据"}

    total_time_hrs = sum(_parse_moving_seconds(a.moving_time) for a in recent) / 3600
    weekly_hrs = total_time_hrs / 4

    low_hr_runs = [a for a in recent if a.average_heartrate and a.average_heartrate < 155]
    low_hr_ratio = len(low_hr_runs) / len(recent) if recent else 0

    score = min(weekly_hrs * 8, 50) + low_hr_ratio * 50

    if weekly_hrs >= 8:
        desc = f"周均训练{weekly_hrs:.1f}小时，有氧底座扎实"
    elif weekly_hrs >= 5:
        desc = f"周均训练{weekly_hrs:.1f}小时，有氧基础中等，可以稳步增加训练时间"
    else:
        desc = f"周均训练仅{weekly_hrs:.1f}小时，有氧底座偏薄，建议增加低强度训练量"

    return {"score": _clamp(score), "description": desc}


def _climbing_ability(trail: list[Activity], historical: list[Activity]) -> dict:
    if not trail:
        return {"score": 0, "description": "近期无越野训练数据，无法评估爬升能力"}

    climb_rates = []
    for a in trail:
        if a.elevation_gain and a.elevation_gain > 50:
            secs = _parse_moving_seconds(a.moving_time)
            if secs > 0:
                climb_rates.append(a.elevation_gain / (secs / 3600))

    if not climb_rates:
        return {"score": 20, "description": "爬升数据不足"}

    avg_rate = sum(climb_rates) / len(climb_rates)

    if avg_rate >= 800:
        score, desc = 90, f"平均爬升速率 {avg_rate:.0f}m/h，爬升能力优秀"
    elif avg_rate >= 600:
        score, desc = 70, f"平均爬升速率 {avg_rate:.0f}m/h，爬升能力良好"
    elif avg_rate >= 400:
        score, desc = 50, f"平均爬升速率 {avg_rate:.0f}m/h，爬升能力中等，上坡可以更放松"
    else:
        score, desc = 30, f"平均爬升速率 {avg_rate:.0f}m/h，爬升能力偏弱，建议增加坡度训练"

    return {"score": _clamp(score), "description": desc}


def _descent_ability(trail: list[Activity]) -> dict:
    if not trail:
        return {"score": 0, "description": "无越野数据"}

    descent_data = [a for a in trail if a.elevation_loss and a.elevation_loss > 100]
    if not descent_data:
        return {"score": 30, "description": "下坡数据不足，建议增加有下坡的训练"}

    speeds = []
    for a in descent_data:
        secs = _parse_moving_seconds(a.moving_time)
        if secs > 0 and a.distance:
            speeds.append(a.distance / secs)

    avg_speed = sum(speeds) / len(speeds) if speeds else 0

    if avg_speed >= 3.5:
        score, desc = 80, "下坡速度和控制力优秀"
    elif avg_speed >= 2.5:
        score, desc = 60, "下坡能力中等，可加强离心控制训练"
    else:
        score, desc = 40, "下坡偏保守，建议练习技术性下坡增加信心"

    return {"score": _clamp(score), "description": desc}


def _trail_efficiency(trail: list[Activity]) -> dict:
    if not trail:
        return {"score": 0, "description": "无越野数据"}

    efficiencies = []
    for a in trail:
        if a.elevation_gain and a.distance and a.distance > 3000:
            gain_per_km = a.elevation_gain / (a.distance / 1000)
            secs = _parse_moving_seconds(a.moving_time)
            if secs > 0:
                pace = secs / (a.distance / 1000)
                efficiencies.append(pace / (1 + gain_per_km / 100))

    if not efficiencies:
        return {"score": 40, "description": "数据不足"}

    avg_eff = sum(efficiencies) / len(efficiencies)

    if avg_eff < 300:
        score, desc = 85, "越野效率优秀，技术路段损耗小"
    elif avg_eff < 400:
        score, desc = 65, "越野效率中等，技术路段有一定配速损耗"
    else:
        score, desc = 40, "越野效率偏低，技术路段损耗较多，建议多跑非铺装路面"

    return {"score": _clamp(score), "description": desc}


def _endurance(recent: list[Activity], historical: list[Activity]) -> dict:
    if not recent:
        return {"score": 0, "description": "无训练数据"}

    long_runs = []
    for a in recent:
        secs = _parse_moving_seconds(a.moving_time)
        if secs >= 5400:
            long_runs.append(secs / 3600)

    if not long_runs:
        return {"score": 30, "description": "近4周没有超过1.5小时的长距离训练，长时续航未经考验"}

    max_duration = max(long_runs)
    avg_long = sum(long_runs) / len(long_runs)

    if max_duration >= 5:
        score, desc = 85, f"最长训练{max_duration:.1f}小时，长时续航能力强"
    elif max_duration >= 3:
        score, desc = 65, f"最长训练{max_duration:.1f}小时，续航能力中等"
    else:
        score, desc = 45, f"最长训练{max_duration:.1f}小时，需要更多长距离训练"

    return {"score": _clamp(score), "description": desc}


def _load_risk(recent: list[Activity]) -> dict:
    if not recent:
        return {"score": 50, "description": "无训练数据，风险未知"}

    weekly_loads = [0.0] * 4
    now = datetime.utcnow()
    for a in recent:
        try:
            dt = datetime.strptime(a.start_date_local, "%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            continue
        weeks_ago = (now - dt).days // 7
        if 0 <= weeks_ago < 4:
            secs = _parse_moving_seconds(a.moving_time)
            weekly_loads[weeks_ago] += secs / 3600

    current_week = weekly_loads[0]
    avg_prev = sum(weekly_loads[1:]) / 3 if sum(weekly_loads[1:]) > 0 else current_week

    if avg_prev == 0:
        acwr = 1.0
    else:
        acwr = current_week / avg_prev

    if acwr > 1.5:
        score, desc = 85, f"ACWR={acwr:.2f}，本周负荷激增，伤病风险高，建议立即降量"
    elif acwr > 1.3:
        score, desc = 65, f"ACWR={acwr:.2f}，负荷偏高，注意控制增量"
    elif acwr > 0.8:
        score, desc = 30, f"ACWR={acwr:.2f}，负荷合理，可以稳步推进"
    else:
        score, desc = 20, f"ACWR={acwr:.2f}，训练量偏低或在减量期"

    return {"score": _clamp(score), "description": desc}
