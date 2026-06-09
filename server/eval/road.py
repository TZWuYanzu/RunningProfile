from __future__ import annotations

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from db.models import Activity


def evaluate_road(db: Session, user_id: str = "default") -> dict:
    now = datetime.utcnow()
    four_weeks_ago = (now - timedelta(weeks=4)).strftime("%Y-%m-%d")
    twelve_weeks_ago = (now - timedelta(weeks=12)).strftime("%Y-%m-%d")

    recent = _query_road(db, four_weeks_ago)
    historical = _query_road(db, twelve_weeks_ago)

    return {
        "mode": "road",
        "period": f"近4周 ({four_weeks_ago} ~ now)",
        "activity_count": len(recent),
        "dimensions": {
            "aerobic_base": _aerobic_base(recent),
            "pace_stability": _pace_stability(recent),
            "endurance_ceiling": _endurance_ceiling(recent),
            "recovery_ability": _recovery_ability(recent),
            "race_fitness": _race_fitness(recent, historical),
            "load_risk": _load_risk(recent),
        },
    }


def _query_road(db: Session, since: str) -> list[Activity]:
    return (
        db.query(Activity)
        .filter(
            Activity.start_date_local >= since,
            Activity.type == "Run",
        )
        .order_by(Activity.start_date_local)
        .all()
    )


def _parse_moving_seconds(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time)
    parts = s.replace("1970-01-01 ", "").split(":")
    try:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    except (ValueError, IndexError):
        return 0


def _clamp(score: float) -> int:
    return max(0, min(100, int(score)))


def _aerobic_base(recent: list[Activity]) -> dict:
    if not recent:
        return {"score": 0, "description": "近4周无跑步数据"}

    total_km = sum((a.distance or 0) for a in recent) / 1000
    weekly_km = total_km / 4

    low_hr = [a for a in recent if a.average_heartrate and a.average_heartrate < 150]
    low_hr_pct = len(low_hr) / len(recent) * 100

    score = min(weekly_km * 1.5, 50) + (low_hr_pct / 100) * 50

    if weekly_km >= 50:
        desc = f"周均跑量{weekly_km:.0f}km，有氧底子扎实"
    elif weekly_km >= 30:
        desc = f"周均跑量{weekly_km:.0f}km，有氧基础中等"
    else:
        desc = f"周均跑量{weekly_km:.0f}km，有氧底子偏薄，建议逐步增加跑量"

    return {"score": _clamp(score), "description": desc}


def _pace_stability(recent: list[Activity]) -> dict:
    if len(recent) < 3:
        return {"score": 0, "description": "数据不足，至少需要3次跑步"}

    easy_runs = [
        a for a in recent
        if a.average_heartrate and 130 <= a.average_heartrate <= 155
        and a.distance and a.distance > 3000
    ]

    if len(easy_runs) < 2:
        return {"score": 40, "description": "同强度跑步次数不足，节奏感有待观察"}

    paces = []
    for a in easy_runs:
        secs = _parse_moving_seconds(a.moving_time)
        if secs > 0 and a.distance:
            paces.append(secs / (a.distance / 1000))

    if not paces:
        return {"score": 40, "description": "配速数据异常"}

    avg_pace = sum(paces) / len(paces)
    variance = sum((p - avg_pace) ** 2 for p in paces) / len(paces)
    cv = (variance ** 0.5) / avg_pace * 100

    if cv < 3:
        score, desc = 85, f"同强度配速波动仅{cv:.1f}%，节奏感优秀"
    elif cv < 6:
        score, desc = 65, f"同强度配速波动{cv:.1f}%，节奏感还需要练"
    else:
        score, desc = 40, f"同强度配速波动{cv:.1f}%，节奏控制需要加强"

    return {"score": _clamp(score), "description": desc}


def _endurance_ceiling(recent: list[Activity]) -> dict:
    if not recent:
        return {"score": 0, "description": "无数据"}

    long_runs = [a for a in recent if a.distance and a.distance > 10000]
    if not long_runs:
        return {"score": 30, "description": "近期没有超过10km的跑步，耐力天花板未知"}

    max_dist = max(a.distance for a in long_runs) / 1000

    if max_dist >= 30:
        score, desc = 85, f"最长跑{max_dist:.0f}km，长距离耐力优秀"
    elif max_dist >= 20:
        score, desc = 65, f"最长跑{max_dist:.0f}km，半马距离没问题"
    elif max_dist >= 15:
        score, desc = 50, f"最长跑{max_dist:.0f}km，15km后可能掉速"
    else:
        score, desc = 35, f"最长跑{max_dist:.0f}km，需要更多长距离训练"

    return {"score": _clamp(score), "description": desc}


def _recovery_ability(recent: list[Activity]) -> dict:
    if len(recent) < 4:
        return {"score": 50, "description": "数据不足，恢复能力有待观察"}

    gaps = []
    for i in range(1, len(recent)):
        try:
            d1 = datetime.strptime(recent[i-1].start_date_local, "%Y-%m-%d %H:%M:%S")
            d2 = datetime.strptime(recent[i].start_date_local, "%Y-%m-%d %H:%M:%S")
            gaps.append((d2 - d1).total_seconds() / 3600)
        except (ValueError, TypeError):
            continue

    if not gaps:
        return {"score": 50, "description": "无法计算训练间隔"}

    avg_gap = sum(gaps) / len(gaps)

    if avg_gap < 24:
        score, desc = 85, f"平均训练间隔{avg_gap:.0f}小时，恢复快，可以加密度"
    elif avg_gap < 48:
        score, desc = 65, f"平均训练间隔{avg_gap:.0f}小时，恢复节奏正常"
    else:
        score, desc = 40, f"平均训练间隔{avg_gap:.0f}小时，训练频率偏低"

    return {"score": _clamp(score), "description": desc}


def _race_fitness(recent: list[Activity], historical: list[Activity]) -> dict:
    if not recent:
        return {"score": 0, "description": "无近期数据"}

    recent_paces = _avg_pace(recent)
    hist_paces = _avg_pace(historical)

    if recent_paces is None:
        return {"score": 50, "description": "配速数据不足"}

    if hist_paces and recent_paces < hist_paces:
        improvement = (1 - recent_paces / hist_paces) * 100
        score = min(70 + improvement * 3, 90)
        desc = f"近4周配速比历史平均快{improvement:.1f}%，状态在往上走"
    elif hist_paces:
        decline = (recent_paces / hist_paces - 1) * 100
        score = max(60 - decline * 2, 20)
        desc = f"近4周配速比历史平均慢{decline:.1f}%，状态在回调"
    else:
        score = 50
        desc = "历史数据不足，竞技状态待观察"

    return {"score": _clamp(score), "description": desc}


def _load_risk(recent: list[Activity]) -> dict:
    if not recent:
        return {"score": 50, "description": "无数据"}

    weekly_km = [0.0] * 4
    now = datetime.utcnow()
    for a in recent:
        try:
            dt = datetime.strptime(a.start_date_local, "%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            continue
        weeks_ago = (now - dt).days // 7
        if 0 <= weeks_ago < 4:
            weekly_km[weeks_ago] += (a.distance or 0) / 1000

    current = weekly_km[0]
    avg_prev = sum(weekly_km[1:]) / 3 if sum(weekly_km[1:]) > 0 else current

    acwr = current / avg_prev if avg_prev > 0 else 1.0

    if acwr > 1.5:
        score, desc = 85, f"ACWR={acwr:.2f}，这周加太猛，悠着点"
    elif acwr > 1.3:
        score, desc = 65, f"ACWR={acwr:.2f}，跑量增幅偏大"
    elif acwr > 0.8:
        score, desc = 30, f"ACWR={acwr:.2f}，跑量增幅合理"
    else:
        score, desc = 20, f"ACWR={acwr:.2f}，在减量或训练量偏低"

    return {"score": _clamp(score), "description": desc}


def _avg_pace(activities: list[Activity]) -> float | None:
    paces = []
    for a in activities:
        secs = _parse_moving_seconds(a.moving_time)
        if secs > 0 and a.distance and a.distance > 3000:
            paces.append(secs / (a.distance / 1000))
    return sum(paces) / len(paces) if paces else None
