import * as XLSX from 'xlsx'
import type { KpiData, PieChartData, YearlyStackedAreaData } from '../types/dashboard'

export const exportMultiSheetExcel = (
  pieData: PieChartData[],
  trendData: YearlyStackedAreaData | null,
  kpiData: KpiData[],
  fileName: string,
) => {
  const workbook = XLSX.utils.book_new()

  const kpiRows = kpiData.map((item) => ({
    指標: item.name,
    當年度: item.value,
    去年度: item.previousValue,
    變化百分比: Number((((item.value - item.previousValue) / item.previousValue) * 100).toFixed(2)),
    單位: item.unit,
    說明: item.description,
  }))

  const pieRows = pieData.map((item) => ({
    分類: item.name,
    數值: item.value,
    單位: item.unit,
  }))

  const trendRows =
    trendData?.months.map((month, idx) => {
      const row: Record<string, number | string> = { 年度: trendData.year, 月份: month }
      trendData.series.forEach((series) => {
        row[series.name] = series.values[idx]
      })
      return row
    }) ?? []

  const ws1 = XLSX.utils.json_to_sheet(kpiRows)
  const ws2 = XLSX.utils.json_to_sheet(pieRows)
  const ws3 = XLSX.utils.json_to_sheet(trendRows)

  XLSX.utils.book_append_sheet(workbook, ws1, '指標總覽 (KPI)')
  XLSX.utils.book_append_sheet(workbook, ws2, '組成佔比 (Category)')
  XLSX.utils.book_append_sheet(workbook, ws3, '趨勢分析 (Trend)')

  const outputName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  XLSX.writeFile(workbook, outputName)
}
