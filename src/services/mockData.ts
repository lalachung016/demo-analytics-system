import { faker } from '@faker-js/faker';
import type { PieChartData } from '../types/dashboard';

export interface YearlyPieChartData {
  year: number;
  categories: PieChartData[];
}

const CATEGORY_NAMES = ['數據 A', '數據 B', '數據 C', '其他'] as const;
const pieChartCache = new Map<number, YearlyPieChartData>();
const API_DELAY_MS = 600;

const createYearGroup = (year: number): YearlyPieChartData => ({
  year,
  categories: CATEGORY_NAMES.map((name) => ({
    name,
    value: faker.number.float({ min: 200, max: 9500, fractionDigits: 1 }),
    unit: '萬元',
  })),
});

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const getPieChartMockData = async (query: { year: number }): Promise<YearlyPieChartData> => {
  const cached = pieChartCache.get(query.year);
  if (cached) return cached;

  await sleep(API_DELAY_MS);
  const generated = createYearGroup(query.year);
  pieChartCache.set(query.year, generated);
  return generated;
};