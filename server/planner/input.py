from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass
class PlanInput:
    race_type: str  # "road" | "trail"
    race_name: str
    race_date: date
    race_distance_km: float
    race_elevation_m: float = 0
    target_time: str | None = None  # "3:30:00"
    target_itra_pi: int | None = None
    weekly_available_days: int = 5
    long_run_day: str = "周六"
    rest_days: list[str] = field(default_factory=lambda: ["周一"])
    has_hills_access: bool = True
    user_id: str = "default"

    @property
    def km_effort(self) -> float:
        return self.race_distance_km + self.race_elevation_m / 100
