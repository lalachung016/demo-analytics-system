import type { LivePoint } from '../types/dashboard'

const HISTORY_API_PATH = '/api/history'

/** 與 api/history.js、simulation/mock_data.py 一致 */
export const LIVE_INTERVAL_MS = 200
export const LIVE_INITIAL_COUNT = 10_000

/** 前端是否已串接即時推播（Pusher）；目前為 false，圖表僅顯示初始化歷史 */
export const LIVE_STREAM_ENABLED = false

/** 未來 Pusher 訂閱用：頻道與事件名稱（見 simulation/mock_data.py） */
export const LIVE_METRICS_PUSHER_CHANNEL = 'live-metrics'
export const LIVE_METRICS_PUSHER_EVENT = 'point'

export type Unsubscribe = () => void;

type HistoryResponse = {
  points: LivePoint[];
  meta?: { count: number; intervalMs: number };
};

let historyCache: LivePoint[] | null = null
let historyInflight: Promise<LivePoint[]> | null = null

async function requestLiveMetricsHistory(): Promise<LivePoint[]> {
  const response = await fetch(HISTORY_API_PATH)

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `History API failed (${response.status})`)
  }

  const data = (await response.json()) as HistoryResponse
  if (!Array.isArray(data.points)) {
    throw new Error('History API returned invalid payload')
  }

  return data.points
}

/** 從 Serverless API 取得 Live Metrics 初始化歷史資料（併發請求會共用同一 Promise，避免 Strict Mode 重複呼叫） */
export async function fetchLiveMetricsHistory(
  options: { forceRefresh?: boolean } = {},
): Promise<LivePoint[]> {
  const { forceRefresh = false } = options

  if (!forceRefresh && historyCache) {
    return historyCache
  }

  if (!forceRefresh && historyInflight) {
    return historyInflight
  }

  historyInflight = requestLiveMetricsHistory()
    .then((points) => {
      historyCache = points
      return points
    })
    .finally(() => {
      historyInflight = null
    })

  return historyInflight
}

/**
 * 訂閱即時推送（每 intervalMs 一筆）。
 * 實際推播由 simulation/mock_data.py → Pusher 負責；前端串接尚未實作，先回傳 no-op。
 */
export function subscribeLiveMetrics(
  _onPoint: (point: LivePoint) => void,
  intervalMs: number = LIVE_INTERVAL_MS,
): Unsubscribe {
  void intervalMs
  // TODO: 以 Pusher 訂閱 LIVE_METRICS_PUSHER_CHANNEL / LIVE_METRICS_PUSHER_EVENT
  return () => {}
}
