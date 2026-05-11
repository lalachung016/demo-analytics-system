import { faker } from '@faker-js/faker';
import type { CategoryData } from '../types/dashboard';

export interface YearlyCategoryGroup {
  year: number;
  categories: CategoryData[];
}

const CATEGORY_NAMES = ['數據 A', '數據 B', '數據 C', '其他'] as const;

const createYearGroup = (year: number): YearlyCategoryGroup => ({
  year,
  categories: CATEGORY_NAMES.map((name) => ({
    name,
    value: faker.number.float({ min: 200, max: 9500, fractionDigits: 1 }),
    unit: '萬元',
  })),
});

export const getCategoryMockData = (query: { year: number }): YearlyCategoryGroup => {
  return createYearGroup(query.year);
};