import Pusher from 'pusher-js'
import type { Channel } from 'pusher-js'
import type { LivePoint } from '../types/dashboard'

const HISTORY_API_PATH = '/api/monitor/live-history'

/** 與 api/monitor/live-history.js、simulation/mock_data.py 一致 */
export const LIVE_INTERVAL_MS = 200
export const LIVE_INITIAL_COUNT = 10_000

export const LIVE_METRICS_PUSHER_CHANNEL = 'live-metrics'
export const LIVE_METRICS_PUSHER_EVENT = 'point'

/** 由根目錄 .env 的 VITE_PUSHER_* 提供（與 simulation/.env 的 PUSHER_KEY 應一致） */
const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER

export const LIVE_STREAM_ENABLED = Boolean(PUSHER_KEY && PUSHER_CLUSTER)

export type Unsubscribe = () => void

export type SubscribeLiveMetricsOptions = {
  onConnectionChange?: (connected: boolean) => void
}

type HistoryResponse = {
  points: LivePoint[]
  meta?: { count: number; intervalMs: number }
}

let historyCache: LivePoint[] | null = null
let historyInflight: Promise<LivePoint[]> | null = null
let pusherClient: Pusher | null = null

function parseLivePoint(payload: unknown): LivePoint | null {
  if (!payload || typeof payload !== 'object') return null

  const { timestamp, value } = payload as Record<string, unknown>
  if (typeof timestamp !== 'number' || typeof value !== 'number') return null
  if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return null

  return { timestamp, value }
}

function getPusherClient(key: string, cluster: string): Pusher {
  if (!pusherClient) {
    pusherClient = new Pusher(key, { cluster })
  }
  return pusherClient
}

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

/** 訂閱 Pusher 即時推播（simulation/mock_data.py → live-metrics / point） */
export function subscribeLiveMetrics(
  onPoint: (point: LivePoint) => void,
  options: SubscribeLiveMetricsOptions = {},
): Unsubscribe {
  const { onConnectionChange } = options

  if (!LIVE_STREAM_ENABLED || !PUSHER_KEY || !PUSHER_CLUSTER) {
    return () => {}
  }

  const pusher = getPusherClient(PUSHER_KEY, PUSHER_CLUSTER)
  const channel: Channel = pusher.subscribe(LIVE_METRICS_PUSHER_CHANNEL)

  const handlePoint = (payload: unknown) => {
    const point = parseLivePoint(payload)
    if (point) onPoint(point)
  }

  const handleConnected = () => onConnectionChange?.(true)
  const handleDisconnected = () => onConnectionChange?.(false)

  channel.bind(LIVE_METRICS_PUSHER_EVENT, handlePoint)
  pusher.connection.bind('connected', handleConnected)
  pusher.connection.bind('disconnected', handleDisconnected)
  pusher.connection.bind('unavailable', handleDisconnected)

  if (pusher.connection.state === 'connected') {
    onConnectionChange?.(true)
  }

  return () => {
    channel.unbind(LIVE_METRICS_PUSHER_EVENT, handlePoint)
    pusher.connection.unbind('connected', handleConnected)
    pusher.connection.unbind('disconnected', handleDisconnected)
    pusher.connection.unbind('unavailable', handleDisconnected)
    pusher.unsubscribe(LIVE_METRICS_PUSHER_CHANNEL)
    onConnectionChange?.(false)
  }
}
