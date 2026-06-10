"""
COROS Health Data Sync — RHR, HRV, Fatigue (Web API) + Sleep (Mobile API)

Usage:
    python3 run_page/coros_health_sync.py [--days 90]

Reads credentials from config.yaml (sync.coros.account / password).
Writes to daily_health table via SQLAlchemy.
"""

import argparse
import asyncio
import base64
import hashlib
import json
import os
import random
import sys

import httpx

# ── path setup ──────────────────────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
server_dir = os.path.join(project_root, "server")

from datetime import datetime, timedelta
import importlib.util
import yaml

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load run_page config.yaml directly (avoid sys.path conflicts with server/config.py)
_config_path = os.path.join(project_root, "config.yaml")
try:
    with open(_config_path) as f:
        _yaml_config = yaml.safe_load(f)
except Exception:
    _yaml_config = {}

def _config(*keys):
    d = _yaml_config
    for k in keys:
        try:
            d = d[k]
        except (KeyError, TypeError):
            return None
    return d

SQL_FILE = os.path.join(current_dir, "data.db")

# Import server db modules
sys.path.insert(0, server_dir)
from db.models import DailyHealth, init_coach_tables
from db.repositories import DailyHealthRepository

TIME_OUT = httpx.Timeout(60.0, connect=30.0)
USER_ID = "default"

# ── COROS Web API (RHR / HRV / Fatigue / Training Load) ────────────────

WEB_BASE = "https://teamcnapi.coros.com"
WEB_HEADERS = {
    "authority": "teamcnapi.coros.com",
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
    "origin": "https://t.coros.com",
    "referer": "https://t.coros.com/",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
}


async def web_login(client: httpx.AsyncClient, account: str, password_md5: str) -> str:
    resp = await client.post(
        f"{WEB_BASE}/account/login",
        json={"account": account, "accountType": 2, "pwd": password_md5},
        headers=WEB_HEADERS,
    )
    data = resp.json()
    token = data.get("data", {}).get("accessToken")
    if not token:
        raise Exception(f"Web API login failed: {data}")
    return token


async def fetch_day_details(
    client: httpx.AsyncClient, start: str, end: str
) -> list[dict]:
    """GET /analyse/dayDetail/query  — returns per-day RHR, HRV, fatigue, load."""
    resp = await client.get(
        f"{WEB_BASE}/analyse/dayDetail/query",
        params={"startDay": start, "endDay": end},
    )
    data = resp.json()
    return data.get("data", {}).get("dayList", [])


async def fetch_hrv_baseline(client: httpx.AsyncClient) -> float | None:
    """GET /dashboard/query — HRV baseline from sleepHrvData."""
    resp = await client.get(f"{WEB_BASE}/dashboard/query")
    data = resp.json()
    hrv_data = data.get("data", {}).get("summaryInfo", {}).get("sleepHrvData", {})
    base = hrv_data.get("sleepHrvBase")
    return float(base) if base else None


# ── COROS Mobile API (Sleep) ────────────────────────────────────────────

MOBILE_BASE = "https://apicn.coros.com"
MOBILE_HEADERS = {
    "user-agent": "okhttp/4.12.0",
    "content-type": "application/json; charset=utf-8",
}

AES_IV = b"weloop3_2015_03#"


def _mobile_encrypt(password: str, app_key: str) -> str:
    """AES-128-CBC encryption for COROS Mobile API login.
    1. XOR password bytes with appKey cyclically
    2. PKCS7 pad to 16-byte boundary
    3. AES-CBC encrypt with key=appKey, IV=AES_IV
    4. base64 encode
    """
    try:
        from Crypto.Cipher import AES
    except ImportError:
        raise ImportError(
            "pycryptodome is required for sleep data sync.\n"
            "Install: pip3 install pycryptodome"
        )

    pwd_bytes = password.encode("utf-8")
    key_bytes = app_key.encode("utf-8")

    xored = bytes(pwd_bytes[i] ^ key_bytes[i % len(key_bytes)] for i in range(len(pwd_bytes)))

    pad_len = 16 - (len(xored) % 16)
    xored_padded = xored + bytes([pad_len] * pad_len)

    cipher = AES.new(key_bytes, AES.MODE_CBC, AES_IV)
    encrypted = cipher.encrypt(xored_padded)
    return base64.b64encode(encrypted).decode("utf-8")


async def mobile_login(
    client: httpx.AsyncClient, account: str, password: str
) -> str:
    """Login to COROS Mobile API, returns access token.
    Note: this will kick the phone app session.
    """
    import time as _time

    app_key = str(random.randint(10**15, 10**16 - 1))
    password_md5 = hashlib.md5(password.encode()).hexdigest()

    yfheader = json.dumps({
        "appVersion": 1125917087236096,
        "clientType": 1,
        "language": "zh-CN",
        "mobileName": "sdk_gphone64_arm64,google,Google",
        "releaseType": 1,
        "systemVersion": "13",
        "timezone": 32,
        "versionCode": "404080400",
    }, separators=(",", ":"))

    headers = {
        "content-type": "application/json",
        "accept-encoding": "gzip",
        "user-agent": "okhttp/4.12.0",
        "request-time": str(int(_time.time() * 1000)),
        "yfheader": yfheader,
    }

    resp = await client.post(
        f"{MOBILE_BASE}/coros/user/login",
        json={
            "account": _mobile_encrypt(account, app_key) + "\n",
            "accountType": 2,
            "appKey": app_key,
            "clientType": 1,
            "hasHrCalibrated": 0,
            "kbValidity": 0,
            "pwd": _mobile_encrypt(password_md5, app_key) + "\n",
            "region": "310|Asia/Shanghai|CN",
            "skipValidation": False,
        },
        headers=headers,
    )
    data = resp.json()
    if data.get("result") != "0000":
        raise Exception(f"Mobile API login failed: {data}")
    return data["data"]["accessToken"]


async def fetch_sleep_data(
    client: httpx.AsyncClient, token: str, start: str, end: str
) -> list[dict]:
    """POST /coros/data/statistic/daily — sleep data for date range.
    Dates are YYYYMMDD integers.
    """
    resp = await client.post(
        f"{MOBILE_BASE}/coros/data/statistic/daily",
        params={"token": token},
        json={
            "allDeviceSleep": 1,
            "dataType": [5],
            "dataVersion": 0,
            "startTime": int(start),
            "endTime": int(end),
            "statisticType": 1,
        },
        headers={**MOBILE_HEADERS, "accesstoken": token},
    )
    data = resp.json()
    if data.get("result") != "0000":
        print(f"  Sleep API error: {data.get('message', data.get('result'))}")
        return []
    return data.get("data", {}).get("statisticData", {}).get("dayDataList", [])


# ── Main sync logic ────────────────────────────────────────────────────


def date_to_coros(dt: datetime) -> str:
    return dt.strftime("%Y%m%d")


def coros_date_to_iso(coros_date: str | int) -> str:
    s = str(coros_date)
    return f"{s[:4]}-{s[4:6]}-{s[6:8]}"


async def sync_health(days: int = 90):
    account = _config("sync", "coros", "account")
    password = _config("sync", "coros", "password")

    if not account or not password:
        print("No COROS credentials in config.yaml — skipping health sync.")
        print("Add sync.coros.account and sync.coros.password to config.yaml")
        return

    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=days)
    start_str = date_to_coros(start_dt)
    end_str = date_to_coros(end_dt)

    print(f"Syncing COROS health data: {start_str} → {end_str} ({days} days)")

    engine = create_engine(f"sqlite:///{SQL_FILE}")
    init_coach_tables(engine)
    session = sessionmaker(bind=engine)()
    repo = DailyHealthRepository(session)

    password_md5 = hashlib.md5(password.encode()).hexdigest()

    # ── Phase A: Web API (RHR / HRV / Fatigue / Load) ──────────────
    web_data: dict[str, dict] = {}
    hrv_baseline: float | None = None

    async with httpx.AsyncClient(timeout=TIME_OUT) as client:
        print("  [Web API] Logging in...")
        token = await web_login(client, account, password_md5)
        client.headers.update({
            "accesstoken": token,
            "cookie": f"CPL-coros-region=2; CPL-coros-token={token}",
        })

        print("  [Web API] Fetching day details...")
        day_list = await fetch_day_details(client, start_str, end_str)
        print(f"  [Web API] Got {len(day_list)} days")

        for day in day_list:
            date_key = str(day.get("happenDay", ""))
            if len(date_key) != 8:
                continue
            iso_date = coros_date_to_iso(date_key)
            web_data[iso_date] = {
                "resting_heart_rate": day.get("rhr"),
                "hrv_rmssd": day.get("avgSleepHrv"),
                "fatigue_rate": day.get("tiredRateNew"),
                "training_load": day.get("t7d"),
                "raw_web": day,
            }

        print("  [Web API] Fetching HRV baseline...")
        hrv_baseline = await fetch_hrv_baseline(client)
        if hrv_baseline:
            print(f"  [Web API] HRV baseline: {hrv_baseline}")

    # ── Phase B: Mobile API (Sleep) ─────────────────────────────────
    sleep_data: dict[str, dict] = {}

    try:
        async with httpx.AsyncClient(timeout=TIME_OUT) as client:
            print("  [Mobile API] Logging in (will kick phone app)...")
            mobile_token = await mobile_login(client, account, password)

            print("  [Mobile API] Fetching sleep data...")
            sleep_list = await fetch_sleep_data(client, mobile_token, start_str, end_str)
            print(f"  [Mobile API] Got {len(sleep_list)} days")

            for day in sleep_list:
                date_key = str(day.get("happenDay", ""))
                if len(date_key) != 8:
                    continue
                iso_date = coros_date_to_iso(date_key)
                sd = day.get("sleepData", {})
                if not sd:
                    continue
                sleep_data[iso_date] = {
                    "sleep_duration_min": sd.get("totalSleepTime", 0),
                    "deep_sleep_min": sd.get("deepTime", 0),
                    "light_sleep_min": sd.get("lightTime", 0),
                    "rem_sleep_min": sd.get("eyeTime", 0),
                    "raw_sleep": sd,
                }
    except ImportError as e:
        print(f"  [Mobile API] Skipped: {e}")
    except Exception as e:
        print(f"  [Mobile API] Failed: {e}")
        print("  Sleep data will be missing. Web API data will still be saved.")

    # ── Phase C: Merge & Write to DB ────────────────────────────────
    all_dates = sorted(set(list(web_data.keys()) + list(sleep_data.keys())))
    written = 0

    for iso_date in all_dates:
        web = web_data.get(iso_date, {})
        sleep = sleep_data.get(iso_date, {})

        raw_json_parts = {}
        if "raw_web" in web:
            raw_json_parts["web"] = web.pop("raw_web")
        if "raw_sleep" in sleep:
            raw_json_parts["sleep"] = sleep.pop("raw_sleep")

        fields = {**web, **sleep}

        rhr = fields.get("resting_heart_rate")
        if rhr and (rhr < 20 or rhr > 200):
            continue

        if hrv_baseline:
            fields["hrv_baseline"] = hrv_baseline

        fields["source"] = "coros"
        fields["raw_json"] = json.dumps(raw_json_parts, ensure_ascii=False)

        repo.upsert(USER_ID, iso_date, **fields)
        written += 1

    session.close()
    print(f"\nDone! Wrote {written} records to daily_health table.")
    print(f"  Web API days: {len(web_data)}")
    print(f"  Sleep days: {len(sleep_data)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync COROS health data")
    parser.add_argument("--days", type=int, default=90, help="Number of days to sync (default: 90)")
    args = parser.parse_args()

    asyncio.run(sync_health(args.days))
