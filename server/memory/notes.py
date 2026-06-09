from __future__ import annotations

import json
from datetime import datetime
from sqlalchemy.orm import Session

from db.models import Activity
from db.repositories import ActivityRepository, TrainingNotesRepository


class TrainingNotesGenerator:

    def __init__(self, db: Session, user_id: str = "default"):
        self.db = db
        self.user_id = user_id
        self.activity_repo = ActivityRepository(db)
        self.notes_repo = TrainingNotesRepository(db)

    def generate_for_activity(self, activity: Activity) -> tuple[str, list[str]]:
        observations = []
        tags = []

        distance_km = (activity.distance or 0) / 1000
        duration_min = _parse_moving_minutes(activity.moving_time)

        if distance_km > 0 and duration_min > 0:
            pace_sec_per_km = (duration_min * 60) / distance_km
            pace_min = int(pace_sec_per_km // 60)
            pace_s = int(pace_sec_per_km % 60)
            observations.append(f"距离 {distance_km:.1f}km，配速 {pace_min}'{pace_s:02d}\"/km")

        if activity.elevation_gain and activity.elevation_gain > 100:
            tags.append("爬升")
            observations.append(f"爬升 {activity.elevation_gain:.0f}m")
            if activity.elevation_gain > 500:
                observations.append("大爬升训练，注意赛后恢复")
            if duration_min > 0:
                climb_rate = activity.elevation_gain / (duration_min / 60)
                observations.append(f"爬升速率 {climb_rate:.0f}m/h")

        if activity.average_heartrate:
            hr = activity.average_heartrate
            if hr > 170:
                tags.append("高强度")
                observations.append(f"均心率 {hr:.0f}，强度偏高，注意恢复")
            elif hr > 155:
                tags.append("中高强度")
                observations.append(f"均心率 {hr:.0f}，中高强度")
            elif hr < 140:
                tags.append("低强度")
                observations.append(f"均心率 {hr:.0f}，轻松跑节奏")

        if activity.max_heartrate and activity.average_heartrate:
            hr_spread = activity.max_heartrate - activity.average_heartrate
            if hr_spread > 30:
                tags.append("心率波动")
                observations.append("最大心率与均心率差距大，配速节奏不够均匀")

        if duration_min > 120:
            tags.append("长距离")
            observations.append(f"训练时长 {duration_min:.0f}分钟，长距离训练")
        elif duration_min > 60:
            tags.append("中距离")

        if activity.avg_cadence and activity.avg_cadence > 0:
            cad = activity.avg_cadence
            if cad < 160:
                tags.append("步频偏低")
                observations.append(f"步频 {cad:.0f}spm，偏低，可尝试提高步频降低冲击")
            elif cad >= 180:
                tags.append("高步频")

        if _is_trail(activity):
            tags.append("越野")
        else:
            tags.append("公路")

        if not observations:
            observations.append(f"常规训练，距离 {distance_km:.1f}km")

        note_text = "；".join(observations) + "。"
        return note_text, tags

    def generate_batch(self, activity_ids: list[int] | None = None) -> list[dict]:
        if activity_ids:
            activities = [self.activity_repo.get(rid) for rid in activity_ids]
            activities = [a for a in activities if a is not None]
        else:
            existing = self.notes_repo.get_by_user(self.user_id, limit=9999)
            existing_ids = {n.activity_id for n in existing}
            all_activities = self.activity_repo.recent(50)
            activities = [a for a in all_activities if a.run_id not in existing_ids]

        results = []
        for activity in activities:
            note_text, tags = self.generate_for_activity(activity)
            self.notes_repo.create(
                user_id=self.user_id,
                activity_id=activity.run_id,
                coach_note=note_text,
                tags=json.dumps(tags, ensure_ascii=False),
            )
            results.append({
                "run_id": activity.run_id,
                "note": note_text,
                "tags": tags,
            })

        return results


def _parse_moving_minutes(moving_time) -> float:
    if moving_time is None:
        return 0
    s = str(moving_time).replace("1970-01-01 ", "")
    parts = s.split(":")
    try:
        return int(parts[0]) * 60 + int(parts[1]) + float(parts[2]) / 60
    except (ValueError, IndexError):
        return 0


def _is_trail(a: Activity) -> bool:
    subtype = (a.subtype or "").lower()
    name = (a.name or "").lower()
    return (
        subtype in ("trail", "trail_run")
        or "trail" in name
        or "越野" in name
        or (a.elevation_gain and a.elevation_gain > 200 and a.distance and a.distance > 5000)
    )
