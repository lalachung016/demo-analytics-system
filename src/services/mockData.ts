import type { CategoryData } from '../types/dashboard';

export const getCategoryMockData = (): CategoryData[] => {
    return [
      { name: '數據 A', value: 7829.3, unit: '萬元' },
      { name: '數據 B', value: 8313.7, unit: '萬元' },
      { name: '數據 C', value: 697.2, unit: '萬元' },
      { name: '其他', value: 484.4, unit: '萬元' },
    ];
  };