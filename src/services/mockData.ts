import { faker } from '@faker-js/faker';
import type { KpiCategory, KpiData, PieChartData, YearlyStackedAreaData } from '../types/dashboard';

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