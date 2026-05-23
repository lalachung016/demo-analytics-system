/**
 * Live Metrics 圖表初始化歷史序列（固定筆數）。
 * 即時新資料由 simulation/mock_data.py 推播，不在此模組產生。
 */

const LIVE_INTERVAL_MS = 200
const LIVE_INITIAL_COUNT = 10_000
const LIVE_VALUE_MIN = 0
const LIVE_VALUE_MAX = 100
const LIVE_VALUE_MEAN = (LIVE_VALUE_MIN + LIVE_VALUE_MAX) / 2
const LIVE_STEP_RANGE = 3
const LIVE_REVERSION = 0.02

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const randomInRange = (min, max) => min + Math.random() * (max - min)

const stepSeedValue = (prev) => {
  const delta = randomInRange(-LIVE_STEP_RANGE, LIVE_STEP_RANGE)
  const reversion = (LIVE_VALUE_MEAN - prev) * LIVE_REVERSION
  return clamp(prev + delta + reversion, LIVE_VALUE_MIN, LIVE_VALUE_MAX)
}

export function buildInitialLiveHistory() {
  const now = Date.now()
  const points = new Array(LIVE_INITIAL_COUNT)
  let value = LIVE_VALUE_MEAN

  for (let i = 0; i < LIVE_INITIAL_COUNT; i += 1) {
    value = stepSeedValue(value)
    const ts = now - (LIVE_INITIAL_COUNT - 1 - i) * LIVE_INTERVAL_MS
    points[i] = { timestamp: ts, value: Number(value.toFixed(2)) }
  }

  return {
    points,
    meta: {
      count: points.length,
      intervalMs: LIVE_INTERVAL_MS,
      purpose: 'initial',
    },
  }
}

export { LIVE_INTERVAL_MS, LIVE_INITIAL_COUNT }
