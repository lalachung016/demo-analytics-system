import type { LivePoint } from '../types/dashboard';

const HISTORY_API_PATH = '/api/history';

/** 與 api/history.js、simulation/mock_data.py 一致 */
export const LIVE_INTERVAL_MS = 200;
export const LIVE_INITIAL_COUNT = 10_000;

/** 前端是否已串接即時推播（Pusher）；目前為 false，圖表僅顯示初始化歷史 */
export const LIVE_STREAM_ENABLED = false;

/** 未來 Pusher 訂閱用：頻道與事件名稱（見 simulation/mock_data.py） */
export const LIVE_METRICS_PUSHER_CHANNEL = 'live-metrics';
export const LIVE_METRICS_PUSHER_EVENT = 'point';

export type Unsubscribe = () => void;

type HistoryResponse = {
  points: LivePoint[];
  meta?: { count: number; intervalMs: number };
};

/** 從 Serverless API 取得 Live Metrics 初始化歷史資料（固定筆數，不含即時新點） */
export async function fetchLiveMetricsHistory(): Promise<LivePoint[]> {
  const response = await fetch(HISTORY_API_PATH);

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `History API failed (${response.status})`);
  }

  const data = (await response.json()) as HistoryResponse;
  if (!Array.isArray(data.points)) {
    throw new Error('History API returned invalid payload');
  }

  return data.points;
}

/**
 * 訂閱即時推送（每 intervalMs 一筆）。
 * 實際推播由 simulation/mock_data.py → Pusher 負責；前端串接尚未實作，先回傳 no-op。
 */
export function subscribeLiveMetrics(
  _onPoint: (point: LivePoint) => void,
  _intervalMs: number = LIVE_INTERVAL_MS,
): Unsubscribe {
  // TODO: 以 Pusher 訂閱 LIVE_METRICS_PUSHER_CHANNEL / LIVE_METRICS_PUSHER_EVENT
  return () => {};
}
