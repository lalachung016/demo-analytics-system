"""
Live Metrics 即時推播模擬器（每 200ms 一筆）。
憑證：simulation/.env；PUSHER_KEY / PUSHER_CLUSTER 缺省時改讀專案根目錄 .env 的 VITE_*。
"""

import os
import time
import random
from pathlib import Path

from pusher import Pusher

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

SIMULATION_DIR = Path(__file__).resolve().parent
ROOT_DIR = SIMULATION_DIR.parent

if load_dotenv:
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(SIMULATION_DIR / ".env", override=True)

LIVE_INTERVAL_SEC = 0.2
LIVE_VALUE_MIN = 0.0
LIVE_VALUE_MAX = 100.0
LIVE_VALUE_MEAN = 50.0
LIVE_STEP_RANGE = 3.0
LIVE_REVERSION = 0.02

PUSHER_CHANNEL = "live-metrics"
PUSHER_EVENT = "point"


def env_or_fallback(name: str, fallback_name: str | None = None) -> str:
    value = os.environ.get(name)
    if value:
        return value
    if fallback_name:
        fallback = os.environ.get(fallback_name)
        if fallback:
            return fallback
    raise RuntimeError(
        f"Missing {name}"
        + (f" or {fallback_name}" if fallback_name else "")
        + " in simulation/.env or project root .env"
    )


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def next_live_value(prev: float) -> float:
    delta = random.uniform(-LIVE_STEP_RANGE, LIVE_STEP_RANGE)
    reversion = (LIVE_VALUE_MEAN - prev) * LIVE_REVERSION
    return round(clamp(prev + delta + reversion, LIVE_VALUE_MIN, LIVE_VALUE_MAX), 2)


def create_pusher_client() -> Pusher:
    return Pusher(
        app_id=env_or_fallback("PUSHER_APP_ID"),
        key=env_or_fallback("PUSHER_KEY", "VITE_PUSHER_KEY"),
        secret=env_or_fallback("PUSHER_SECRET"),
        cluster=env_or_fallback("PUSHER_CLUSTER", "VITE_PUSHER_CLUSTER"),
        ssl=True,
    )


def main() -> None:
    pusher_client = create_pusher_client()
    live_last_value = LIVE_VALUE_MEAN
    live_last_timestamp = int(time.time() * 1000)

    print(
        f"🚀 Live Metrics 推播已啟動（每 {int(LIVE_INTERVAL_SEC * 1000)}ms → "
        f"{PUSHER_CHANNEL}/{PUSHER_EVENT}）"
    )

    while True:
        live_last_value = next_live_value(live_last_value)
        live_last_timestamp += int(LIVE_INTERVAL_SEC * 1000)

        now = int(time.time() * 1000)
        if live_last_timestamp < now - int(LIVE_INTERVAL_SEC * 1000) * 2:
            live_last_timestamp = now

        point = {"timestamp": live_last_timestamp, "value": live_last_value}
        pusher_client.trigger(PUSHER_CHANNEL, PUSHER_EVENT, point)

        print(f"[LIVE] ts={live_last_timestamp} value={live_last_value}")
        time.sleep(LIVE_INTERVAL_SEC)


if __name__ == "__main__":
    main()
