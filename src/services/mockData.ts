import { faker } from '@faker-js/faker';
import type {
  KpiCategory,
  KpiData,
  LivePoint,
  PieChartData,
  YearlyStackedAreaData,
} from '../types/dashboard';

export interface YearlyPieChartData {
  year: number;
  categories: PieChartData[];
}

const CATEGORY_NAMES = ['數據 A', '數據 B', '數據 C', '其他'] as const;
const TREND_SERIES_NAMES = ['數據 A', '數據 B', '數據 C'] as const;
const KPI_NAMES: Record<KpiCategory, readonly string[]> = {
  A: ['指標 X', '指標 Y', '指標 Z'],
  B: ["指標 X'", "指標 Y'", "指標 Z'"],
};
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] as const;
const pieChartCache = new Map<number, YearlyPieChartData>();
const stackedAreaCache = new Map<number, YearlyStackedAreaData>();
const kpiCache = new Map<string, KpiData[]>();
const kpiDescriptionCache = new Map<string, string>();
const API_DELAY_MS = 600;

const createYearGroup = (year: number): YearlyPieChartData => ({
  year,
  categories: CATEGORY_NAMES.map((name) => ({
    name,
    value: faker.number.float({ min: 200, max: 9500, fractionDigits: 1 }),
    unit: '萬元',
  })),
});

const createStackedAreaYearGroup = (year: number): YearlyStackedAreaData => ({
  year,
  months: [...MONTH_LABELS],
  series: TREND_SERIES_NAMES.map((name) => ({
    name,
    values: MONTH_LABELS.map(() =>
      faker.number.float({ min: 80, max: 1500, fractionDigits: 1 }),
    ),
    unit: '萬元',
  })),
});

const createKpiGroup = (category: KpiCategory): KpiData[] =>
  KPI_NAMES[category].map((name) => {
    const previousValue = faker.number.float({ min: 50, max: 3000, fractionDigits: 2 });
    const changeRate = faker.number.float({ min: -0.25, max: 0.25, fractionDigits: 4 });
    const value = Number((previousValue * (1 + changeRate)).toFixed(2));
    const description =
      kpiDescriptionCache.get(name) ??
      `${faker.lorem.sentence({ min: 8, max: 14 })} ${faker.lorem.sentence({ min: 8, max: 14 })}`;
    kpiDescriptionCache.set(name, description);

    return {
      name,
      value,
      previousValue,
      description,
      unit: '萬元',
    };
  });

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** 該年度圓餅與趨勢圖是否已存在於 mock 快取（本次載入前即命中）。 */
export const isMockPieAndTrendCached = (year: number): boolean =>
  pieChartCache.has(year) && stackedAreaCache.has(year);

/** 該年度＋KPI 分類是否已存在於 mock 快取。 */
export const isMockKpiCached = (year: number, category: KpiCategory): boolean =>
  kpiCache.has(`${year}-${category}`);

/** 同步讀取已快取之 KPI（切換選項時可立即顯示，無需等待 async）。 */
export const peekKpiFromCache = (year: number, category: KpiCategory): KpiData[] | undefined =>
  kpiCache.get(`${year}-${category}`);

export const getPieChartMockData = async (query: { year: number }): Promise<YearlyPieChartData> => {
  const cached = pieChartCache.get(query.year);
  if (cached) return cached;

  await sleep(API_DELAY_MS);
  const generated = createYearGroup(query.year);
  pieChartCache.set(query.year, generated);
  return generated;
};

export const getStackedAreaMockData = async (
  query: { year: number },
): Promise<YearlyStackedAreaData> => {
  const cached = stackedAreaCache.get(query.year);
  if (cached) return cached;

  await sleep(API_DELAY_MS);
  const generated = createStackedAreaYearGroup(query.year);
  stackedAreaCache.set(query.year, generated);
  return generated;
};

export const getKpiMockData = async (
  query: { year: number; category: KpiCategory },
): Promise<KpiData[]> => {
  const key = `${query.year}-${query.category}`;
  const cached = kpiCache.get(key);
  if (cached) return cached;

  await sleep(API_DELAY_MS);
  const generated = createKpiGroup(query.category);
  kpiCache.set(key, generated);
  return generated;
};

// ---------------- Live metrics（即時動態大數據折線圖） ----------------

const LIVE_INTERVAL_MS = 200;
const LIVE_INITIAL_COUNT = 10_000;
const LIVE_VALUE_MIN = 0;
const LIVE_VALUE_MAX = 100;
const LIVE_VALUE_MEAN = (LIVE_VALUE_MIN + LIVE_VALUE_MAX) / 2; // 50
const LIVE_STEP_RANGE = 3; // 隨機漫步單步上下限
const LIVE_REVERSION = 0.02; // 每步往中心 (50) 拉的強度

let liveLastValue = LIVE_VALUE_MEAN;
let liveLastTimestamp = 0;

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * 帶 mean-reversion 的隨機漫步：
 *   next = prev + Uniform(-step, +step) + (mean - prev) * reversion
 * 統計上會把值穩定在 50 附近（約 ±20 區間自然擺盪），最後 clamp 保證 [0, 100]。
 */
const nextLiveValue = (prev: number): number => {
  const delta = faker.number.float({
    min: -LIVE_STEP_RANGE,
    max: LIVE_STEP_RANGE,
    fractionDigits: 2,
  });
  const reversion = (LIVE_VALUE_MEAN - prev) * LIVE_REVERSION;
  return clamp(prev + delta + reversion, LIVE_VALUE_MIN, LIVE_VALUE_MAX);
};

/**
 * 產生初始 N 筆即時資料（隨機漫步，時間戳由過去推到現在）。
 * 預設 10,000 筆，間距 200ms，剛好對應「最近約 33 分鐘」的歷史資料。
 */
export const getLiveMetricsSeed = (
  count: number = LIVE_INITIAL_COUNT,
  intervalMs: number = LIVE_INTERVAL_MS,
): LivePoint[] => {
  const now = Date.now();
  const points: LivePoint[] = new Array(count);
  let value = LIVE_VALUE_MEAN;
  for (let i = 0; i < count; i += 1) {
    value = nextLiveValue(value);
    const ts = now - (count - 1 - i) * intervalMs;
    points[i] = { timestamp: ts, value: Number(value.toFixed(2)) };
  }
  liveLastValue = points[count - 1].value;
  liveLastTimestamp = points[count - 1].timestamp;
  return points;
};

export type Unsubscribe = () => void;

/**
 * 訂閱即時資料流；每 intervalMs 推送一個新點，串接在最後一次 seed/推送之後。
 * 回傳 unsubscribe 用於清理 timer（請在元件卸載時呼叫）。
 */
export const subscribeLiveMetrics = (
  onPoint: (point: LivePoint) => void,
  intervalMs: number = LIVE_INTERVAL_MS,
): Unsubscribe => {
  const timer = setInterval(() => {
    liveLastValue = nextLiveValue(liveLastValue);
    liveLastTimestamp += intervalMs;
    // tab 切走再回來時，時間戳可能落後實際牆鐘很多，做一次校正
    const now = Date.now();
    if (liveLastTimestamp < now - intervalMs * 2) {
      liveLastTimestamp = now;
    }
    onPoint({
      timestamp: liveLastTimestamp,
      value: Number(liveLastValue.toFixed(2)),
    });
  }, intervalMs);

  return () => clearInterval(timer);
};