import time
import random
from pusher import Pusher

app_id = "2157962"
key = "beea5dbbca4da25458e6"
secret = "139a4800fdeaa57b660d"
cluster = "ap3"

# 1. 填入你的 Pusher Keys
pusher_client = Pusher(
    app_id=app_id,
    key=key,
    secret=secret,
    cluster=cluster,
    ssl=True
)

print("🚀 電商即時金流監控數據源已啟動...（每 200ms 推播一次）")

tick = 0
is_disaster = False
disaster_countdown = 0

while True:
    tick += 1
    timestamp = int(time.time() * 1000)
    active_users = int(5000 + random.uniform(-200, 200))
    
    # 2. 模擬隨機商業災難：每 60 秒左右（約 300 次 tick）引爆一次金流危機
    if not is_disaster and tick % 300 == 0:
        is_disaster = True
        disaster_countdown = 50 # 災難持續 50 次 tick (約 10 秒)
        print("\n🚨 [ALERT] 商業事件引爆：第三方金流 API 回應延遲，結帳失敗率開始狂飆！")

    if is_disaster:
        # 災難期間：結帳失敗率飆升至 30% ~ 45%
        checkout_failure_rate = round(random.uniform(30.0, 45.0), 2)
        disaster_countdown -= 1
        if disaster_countdown <= 0:
            is_disaster = False
            print("\n✅ [RESOLVED] 金流備援系統觸發，指標逐漸恢復正常。")
    else:
        # 正常期間：結帳失敗率在 0.5% ~ 1.5% 之間健康波動
        checkout_failure_rate = round(random.uniform(0.5, 1.5), 2)

    # 3. 計算大廠主管最懂的商業指標：風險營業額 (假設平均客單價 50 美元)
    # 公式：在線人數 * 失敗率 * 50
    revenue_at_risk = round(active_users * (checkout_failure_rate / 100.0) * 50, 2)

    data = {
        "timestamp": timestamp,
        "checkout_failure_rate": checkout_failure_rate,
        "active_users": active_users,
        "revenue_at_risk": revenue_at_risk
    }

    # 4. 透過 WebSocket 頻道推播至雲端
    pusher_client.trigger('realtime-analytics', 'metrics-update', data)
    
    # 在終端機列印，方便肉眼 Debug
    status_tag = "[🚨 DANGER]" if is_disaster else "[🍏 NORMAL]"
    print(f"{status_tag} 失敗率: {checkout_failure_rate}% | 在線: {active_users}人 | 風險營業額: ${revenue_at_risk}")

    time.sleep(0.2) # 每 200 毫秒打一筆資料