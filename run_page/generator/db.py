import datetime
import random
import string
import time

import geopy
from geopy.geocoders import Nominatim
from sqlalchemy import (
    Column,
    Float,
    Integer,
    Interval,
    String,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


# random user name 8 letters
def randomword():
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(4))


geopy.geocoders.options.default_user_agent = "my-application"
# reverse the location (lan, lon) -> location detail
g = Nominatim(user_agent=randomword())


ACTIVITY_KEYS = [
    "run_id",
    "name",
    "distance",
    "moving_time",
    "type",
    "subtype",
    "start_date",
    "start_date_local",
    "location_country",
    "summary_polyline",
    "average_heartrate",
    "average_speed",
    "elevation_gain",
    "elevation_loss",
    "max_heartrate",
    "avg_cadence",
    "avg_power",
    "calories",
    "avg_temperature",
    "hr_zone_time",
    "laps",
]


class Activity(Base):
    __tablename__ = "activities"

    run_id = Column(Integer, primary_key=True)
    name = Column(String)
    distance = Column(Float)
    moving_time = Column(Interval)
    elapsed_time = Column(Interval)
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
    streak = None

    def to_dict(self):
        out = {}
        for key in ACTIVITY_KEYS:
            attr = getattr(self, key)
            if isinstance(attr, (datetime.timedelta, datetime.datetime)):
                out[key] = str(attr)
            else:
                out[key] = attr

        if self.streak:
            out["streak"] = self.streak

        return out


def update_or_create_activity(session, run_activity):
    created = False
    try:
        activity = (
            session.query(Activity).filter_by(run_id=int(run_activity.id)).first()
        )
        if not activity:
            start_point = run_activity.start_latlng
            location_country = getattr(run_activity, "location_country", "")
            # or China for #176 to fix
            if not location_country and start_point or location_country == "China":
                try:
                    location_country = str(
                        g.reverse(
                            f"{start_point.lat}, {start_point.lon}", language="zh-CN"
                        )
                    )
                # limit (only for the first time)
                except Exception as e:
                    try:
                        location_country = str(
                            g.reverse(
                                f"{start_point.lat}, {start_point.lon}",
                                language="zh-CN",
                            )
                        )
                    except Exception as e:
                        pass

            activity = Activity(
                run_id=run_activity.id,
                name=run_activity.name,
                distance=run_activity.distance,
                moving_time=run_activity.moving_time,
                elapsed_time=run_activity.elapsed_time,
                type=run_activity.type,
                subtype=run_activity.subtype,
                start_date=run_activity.start_date,
                start_date_local=run_activity.start_date_local,
                location_country=location_country,
                average_heartrate=run_activity.average_heartrate,
                average_speed=float(run_activity.average_speed),
                summary_polyline=(
                    run_activity.map and run_activity.map.summary_polyline or ""
                ),
                elevation_gain=getattr(run_activity, "elevation_gain", None),
                elevation_loss=getattr(run_activity, "elevation_loss", None),
                max_heartrate=getattr(run_activity, "max_heartrate", None),
                avg_cadence=getattr(run_activity, "avg_cadence", None),
                avg_power=getattr(run_activity, "avg_power", None),
                calories=getattr(run_activity, "calories", None),
                avg_temperature=getattr(run_activity, "avg_temperature", None),
                hr_zone_time=getattr(run_activity, "hr_zone_time", None),
                laps=getattr(run_activity, "laps", None),
            )
            session.add(activity)
            created = True
        else:
            activity.name = run_activity.name
            activity.distance = float(run_activity.distance)
            activity.moving_time = run_activity.moving_time
            activity.elapsed_time = run_activity.elapsed_time
            activity.type = run_activity.type
            activity.subtype = run_activity.subtype
            activity.average_heartrate = run_activity.average_heartrate
            activity.average_speed = float(run_activity.average_speed)
            activity.summary_polyline = (
                run_activity.map and run_activity.map.summary_polyline or ""
            )
            activity.elevation_gain = getattr(run_activity, "elevation_gain", None)
            activity.elevation_loss = getattr(run_activity, "elevation_loss", None)
            activity.max_heartrate = getattr(run_activity, "max_heartrate", None)
            activity.avg_cadence = getattr(run_activity, "avg_cadence", None)
            activity.avg_power = getattr(run_activity, "avg_power", None)
            activity.calories = getattr(run_activity, "calories", None)
            activity.avg_temperature = getattr(run_activity, "avg_temperature", None)
            activity.hr_zone_time = getattr(run_activity, "hr_zone_time", None)
            activity.laps = getattr(run_activity, "laps", None)
    except Exception as e:
        print(f"something wrong with {run_activity.id}")
        print(str(e))

    return created


def add_missing_columns(engine, model):
    inspector = inspect(engine)
    table_name = model.__tablename__
    columns = {col["name"] for col in inspector.get_columns(table_name)}
    missing_columns = []

    for column in model.__table__.columns:
        if column.name not in columns:
            missing_columns.append(column)
    if missing_columns:
        with engine.connect() as conn:
            for column in missing_columns:
                column_type = str(column.type)
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column.name} {column_type}"
                    )
                )


def init_db(db_path):
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)

    # check missing columns
    add_missing_columns(engine, Activity)

    sm = sessionmaker(bind=engine)
    session = sm()
    # apply the changes
    session.commit()
    return session
