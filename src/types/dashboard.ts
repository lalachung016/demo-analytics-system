// pie chart data type
export interface PieChartData {
  name: string;   // 數據分類名稱 (如：數據 A)
  value: number;  // 數值 (如：7829.3)
  unit: string;   // 單位
}

// stacked area chart data type
export interface StackedAreaData {
  year: number;
  value: number;
  unit: string;
}

// kpi data type
export interface KpiData {
  name: string;
  value: number;
  unit: string;
}

// simulator data type
export interface SimulatorData {
  name: string;
  value: number;
  unit: string;
}