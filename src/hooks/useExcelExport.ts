import { useCallback, useState } from 'react'
import type { KpiData, PieChartData, YearlyStackedAreaData } from '../types/dashboard'
import { exportMultiSheetExcel } from '../utils/exportExcel'

const DEMO_EXPORT_DELAY_MS = 2000

export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = useCallback(
    async (
      pieData: PieChartData[],
      trendData: YearlyStackedAreaData | null,
      kpiData: KpiData[],
      fileName: string,
    ) => {
      if (isExporting) return

      setIsExporting(true)
      try {
        // Demo：強制延遲 2 秒，讓 UI 能穩定顯示「下載中」狀態
        await new Promise<void>((resolve) => {
          setTimeout(resolve, DEMO_EXPORT_DELAY_MS)
        })
        exportMultiSheetExcel(pieData, trendData, kpiData, fileName)
      } finally {
        setIsExporting(false)
      }
    },
    [isExporting],
  )

  return { isExporting, exportExcel }
}
