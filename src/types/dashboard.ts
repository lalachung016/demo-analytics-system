// pie chart data type
export interface PieChartData {
  name: string;   // 數據分類名稱 (如：數據 A)
  value: number;  // 數值 (如：7829.3)
  unit: string;   // 單位
}

// stacked area chart data type
export interface StackedAreaSeries {
  name: string;
  values: number[];
  unit: string;
}

export interface YearlyStackedAreaData {
  year: number;
  months: string[];
  series: StackedAreaSeries[];
}

// kpi data type
export interface KpiData {
  name: string;
  value: number; // 當年度
  previousValue: number; // 去年度
  description: string; // 指標說明（隨機產生後固定）
  unit: string;
}

export type KpiCategory = 'A' | 'B';

// simulator data type
export interface SimulatorData {
  name: string;
  value: number;
  unit: string;
}

// live metrics data type
export interface LivePoint {
  timestamp: number; // epoch ms
  value: number;
}