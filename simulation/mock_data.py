"""
Live Metrics 即時推播模擬器（每 200ms 一筆）。
演算法與 api/history.js 初始序列的 nextLiveValue 一致（mean-reversion 隨機漫步）。
推播至 Pusher，前端 subscribeLiveMetrics 尚未串接。
"""

import os
import time
import random
from pusher import Pusher

LIVE_INTERVAL_SEC = 0.2
LIVE_VALUE_MIN = 0.0
LIVE_VALUE_MAX = 100.0
LIVE_VALUE_MEAN = 50.0
LIVE_STEP_RANGE = 3.0
LIVE_REVERSION = 0.02

PUSHER_CHANNEL = "live-metrics"
PUSHER_EVENT = "point"


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def next_live_value(prev: float) -> float:
    delta = random.uniform(-LIVE_STEP_RANGE, LIVE_STEP_RANGE)
    reversion = (LIVE_VALUE_MEAN - prev) * LIVE_REVERSION
    return round(clamp(prev + delta + reversion, LIVE_VALUE_MIN, LIVE_VALUE_MAX), 2)


def create_pusher_client() -> Pusher:
    return Pusher(
        app_id=os.environ.get("PUSHER_APP_ID", "2157962"),
        key=os.environ.get("PUSHER_KEY", "beea5dbbca4da25458e6"),
        secret=os.environ.get("PUSHER_SECRET", "139a4800fdeaa57b660d"),
        cluster=os.environ.get("PUSHER_CLUSTER", "ap3"),
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
