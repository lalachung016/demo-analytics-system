/**
 * 僅提供 Live Metrics 圖表初始化用的歷史序列（固定筆數、時間戳落在過去～現在）。
 * 即時新資料由 simulation/mock_data.py 推播，不在此 API 產生。
 */

const LIVE_INTERVAL_MS = 200;
const LIVE_INITIAL_COUNT = 10_000;
const LIVE_VALUE_MIN = 0;
const LIVE_VALUE_MAX = 100;
const LIVE_VALUE_MEAN = (LIVE_VALUE_MIN + LIVE_VALUE_MAX) / 2;
const LIVE_STEP_RANGE = 3;
const LIVE_REVERSION = 0.02;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const randomInRange = (min, max) => min + Math.random() * (max - min);

/** 單步取值，僅用於回填歷史序列 */
const stepSeedValue = (prev) => {
  const delta = randomInRange(-LIVE_STEP_RANGE, LIVE_STEP_RANGE);
  const reversion = (LIVE_VALUE_MEAN - prev) * LIVE_REVERSION;
  return clamp(prev + delta + reversion, LIVE_VALUE_MIN, LIVE_VALUE_MAX);
};

/** 產生固定筆數的初始化歷史點（時間由過去依 interval 推至現在，不含未來新點） */
function buildInitialHistory() {
  const now = Date.now();
  const points = new Array(LIVE_INITIAL_COUNT);
  let value = LIVE_VALUE_MEAN;

  for (let i = 0; i < LIVE_INITIAL_COUNT; i += 1) {
    value = stepSeedValue(value);
    const ts = now - (LIVE_INITIAL_COUNT - 1 - i) * LIVE_INTERVAL_MS;
    points[i] = { timestamp: ts, value: Number(value.toFixed(2)) };
  }

  return points;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const points = buildInitialHistory();

  return res.status(200).json({
    points,
    meta: {
      count: points.length,
      intervalMs: LIVE_INTERVAL_MS,
      purpose: 'initial',
    },
  });
}
