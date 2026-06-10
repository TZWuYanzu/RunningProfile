from sqlalchemy import Column, Integer, Float, String, Text, create_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Activity(Base):
    __tablename__ = "activities"

    run_id = Column(Integer, primary_key=True)
    name = Column(String)
    distance = Column(Float)
    moving_time = Column(String)
    elapsed_time = Column(String)
    type = Column(String)
    subtype = Column(String)
    start_date = Column(String)
    start_date_local = Column(String)
    location_country = Column(String)
    summary_polyline = Column(String)
    average_heartrate = Column(Float)
    average_speed = Column(Float)
    elevation_gain = Column(Float)
    elevation_loss = Column(Float)
    max_heartrate = Column(Float)
    avg_cadence = Column(Float)
    avg_power = Column(Float)
    calories = Column(Float)
    avg_temperature = Column(Float)
    hr_zone_time = Column(String)
    laps = Column(String)


class AthleteProfile(Base):
    __tablename__ = "athlete_profile"

    user_id = Column(String, primary_key=True)
    aerobic_base_score = Column(Float)
    climbing_ability_score = Column(Float)
    descent_ability_score = Column(Float)
    trail_efficiency_score = Column(Float)
    endurance_score = Column(Float)
    load_risk_score = Column(Float)
    current_mode = Column(String, default="trail")
    primary_goal = Column(Text)
    target_race = Column(Text)
    injury_history = Column(Text)
    running_experience_years = Column(Integer)
    preferred_training_time = Column(String)
    personality_notes = Column(Text)
    updated_at = Column(String)


class TrainingNote(Base):
    __tablename__ = "training_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    activity_id = Column(Integer)
    coach_note = Column(Text)
    tags = Column(String)
    created_at = Column(String, nullable=False)


class DialogueMessage(Base):
    __tablename__ = "dialogue_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_archived = Column(Integer, default=0)
    archived_summary = Column(Text)
    created_at = Column(String, nullable=False)


class ProfileStaging(Base):
    __tablename__ = "profile_staging"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    op = Column(String, nullable=False)
    field_name = Column(String)
    old_value = Column(Text)
    new_value = Column(Text)
    reason = Column(Text)
    source_dialogue_id = Column(Integer)
    status = Column(String, default="pending")
    reviewed_at = Column(String)
    created_at = Column(String, nullable=False)


class TrainingPlan(Base):
    """Legacy table — kept for backward compatibility. New code uses RacePlan + DailyPlan."""
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    plan_date = Column(String, nullable=False)
    plan_type = Column(String)
    title = Column(String)
    description = Column(Text)
    target_distance_km = Column(Float)
    target_duration_min = Column(Float)
    target_elevation_m = Column(Float)
    target_hr_zone = Column(String)
    target_pace = Column(String)
    intensity = Column(String)
    actual_activity_id = Column(Integer)
    completion_status = Column(String, default="pending")
    coach_feedback = Column(Text)
    source = Column(String, default="ai_generated")
    created_at = Column(String)
    updated_at = Column(String)


class RacePlan(Base):
    __tablename__ = "race_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    race_name = Column(String, nullable=False)
    race_type = Column(String, nullable=False)  # "road" | "trail"
    race_date = Column(String, nullable=False)
    race_distance_km = Column(Float, nullable=False)
    race_elevation_m = Column(Float, default=0)
    target_time = Column(String)
    target_itra_pi = Column(Integer)
    plan_start_date = Column(String, nullable=False)
    plan_end_date = Column(String, nullable=False)
    total_weeks = Column(Integer, nullable=False)
    current_phase = Column(String)
    phase_config = Column(Text)  # JSON
    weekly_available_days = Column(Integer, default=5)
    long_run_day = Column(String, default="周六")
    rest_days = Column(String)  # JSON array
    status = Column(String, default="active")  # "active"|"completed"|"abandoned"
    created_at = Column(String)
    updated_at = Column(String)


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(Integer, nullable=False)  # FK → race_plans.id
    user_id = Column(String, nullable=False)
    plan_date = Column(String, nullable=False)
    day_of_week = Column(String)
    workout_type = Column(String, nullable=False)
    title = Column(String)
    description = Column(Text)
    target_duration_min = Column(Float)
    target_distance_km = Column(Float)
    target_elevation_m = Column(Float)
    target_hr_zone = Column(String)
    target_pace = Column(String)
    intensity = Column(String)  # "easy"|"moderate"|"hard"|"rest"
    coach_notes = Column(Text)
    matched_activity_id = Column(Integer)  # FK → activities.run_id
    completion_status = Column(String, default="pending")
    completion_pct = Column(Float)
    coach_feedback = Column(Text)
    deviation_notes = Column(Text)
    source = Column(String, default="ai_generated")
    created_at = Column(String)
    updated_at = Column(String)


class Shoe(Base):
    __tablename__ = "shoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String)
    usage = Column(String, default="trail")
    traits = Column(Text)
    initial_km = Column(Float, default=0)
    total_km = Column(Float, default=0)
    total_runs = Column(Integer, default=0)
    status = Column(String, default="active")
    created_at = Column(String)


class ShoeLog(Base):
    __tablename__ = "shoe_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    shoe_id = Column(Integer, nullable=False)
    activity_run_id = Column(Integer)
    terrain = Column(String)
    grip = Column(String)
    cushion = Column(String)
    stability = Column(String)
    overall = Column(String)
    notes = Column(Text)
    logged_at = Column(String)


class DailyHealth(Base):
    __tablename__ = "daily_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    date = Column(String, nullable=False)
    resting_heart_rate = Column(Integer)
    hrv_rmssd = Column(Float)
    hrv_baseline = Column(Float)
    fatigue_rate = Column(Integer)
    training_load = Column(Float)
    sleep_score = Column(Integer)
    sleep_duration_min = Column(Float)
    deep_sleep_min = Column(Float)
    light_sleep_min = Column(Float)
    rem_sleep_min = Column(Float)
    source = Column(String, default="coros")
    raw_json = Column(Text)
    created_at = Column(String)


def init_coach_tables(engine):
    for model in [AthleteProfile, TrainingNote, DialogueMessage, ProfileStaging,
                  TrainingPlan, RacePlan, DailyPlan, Shoe, ShoeLog, DailyHealth]:
        model.__table__.create(engine, checkfirst=True)
