import React, { useEffect, useState, useMemo } from 'react'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import Button from '@mui/material/Button'
import type { KpiCategory, KpiData, PieChartData, YearlyStackedAreaData } from '../types/dashboard'
import {
  fetchDashboardOverview,
  peekKpiFromCache,
} from '../services/dashboardService'
import { useExcelExport } from '../hooks/useExcelExport'
import CategoryPieChart from '../components/CategoryPieChart'
import KpiPanel from '../components/KpiPanel'
import StackedAreaChart from '../components/StackedAreaChart'
import YearSelector from '../components/YearSelector'
import AiAnalysisPanel from '../components/AiAnalysisPanel'
import { useAIStreaming } from '../hooks/useAIStreaming'

const Dashboard: React.FC = () => {
  const [year, setYear] = useState<number>(2025)
  const [kpiCategory, setKpiCategory] = useState<KpiCategory>('A')
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(true)
  const [pieData, setPieData] = useState<PieChartData[]>([])
  const [trendData, setTrendData] = useState<YearlyStackedAreaData | null>(null)
  const [kpiData, setKpiData] = useState<KpiData[]>([])
  const { isExporting, exportExcel } = useExcelExport()
  const {
    text: aiAnalysisText,
    analysis: aiAnalysis,
    isLoading: isAiStreaming,
    streamAnalysis,
  } = useAIStreaming()

  const handleYearChange = (nextYear: number) => {
    if (nextYear < 2017 || nextYear > 2026) return
    setIsOverviewLoading(true)
    setKpiCategory('A')
    setYear(nextYear)
  }

  const handleKpiCategoryChange = (category: KpiCategory) => {
    const cached = peekKpiFromCache(year, category)
    if (cached) {
      setKpiData(cached)
    }
    setKpiCategory(category)
  }

  const handleExport = async () => {
    await exportExcel(pieData, trendData, kpiData, `dashboard-${year}`)
  }

  useEffect(() => {
    let cancelled = false
    setIsOverviewLoading(true)

    fetchDashboardOverview(year)
      .then((overview) => {
        if (cancelled) return
        setPieData(overview.pieData)
        setTrendData(overview.trendData)
        setKpiData(overview.kpiByCategory.A)
      })
      .catch((error) => {
        console.error('儀表板總覽載入失敗', error)
      })
      .finally(() => {
        if (!cancelled) setIsOverviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year])

  useEffect(() => {
    const cached = peekKpiFromCache(year, kpiCategory)
    if (cached) setKpiData(cached)
  }, [year, kpiCategory])

  const dashboardData = useMemo(() => ({
    pieData,
    trendData,
    kpiData,
  }), [pieData, trendData, kpiData])

  const isDashboardDataReady =
    !isOverviewLoading &&
    pieData.length > 0 &&
    trendData !== null &&
    kpiData.length > 0

  const aiCacheKey = `${year}-${kpiCategory}`

  const handleAIAnalysis = () => {
    void streamAnalysis(dashboardData, { cacheKey: aiCacheKey, forceRefresh: true })
  }

  useEffect(() => {
    if (!isDashboardDataReady) return
    void streamAnalysis(dashboardData, { cacheKey: aiCacheKey })
  }, [isDashboardDataReady, dashboardData, streamAnalysis, aiCacheKey])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            多維度指標監控面板 (Metrics Dashboard)
          </h1>
          <p className="text-slate-500 text-sm mt-1">年度數據回顧與即時模擬分析</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <YearSelector year={year} minYear={2017} maxYear={2026} onYearChange={handleYearChange} />
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadOutlinedIcon />}
            disabled={isExporting}
            onClick={handleExport}
            sx={{
              bgcolor: '#0284c7',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '0.5rem',
              px: 1.5,
              py: 0.8,
              '&:hover': { bgcolor: '#0ea5e9' },
              '&.Mui-disabled': {
                opacity: 1,
                bgcolor: '#475569',
                color: 'rgba(248, 250, 252, 0.92)',
                border: '1px solid #94a3b8',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              },
            }}
          >
            {isExporting ? '下載中...' : '匯出數據 (Excel)'}
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">資料結構組成佔比 (Category Pie Chart)</h2>
            </div>
            <div className="min-h-[300px] bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-600 text-sm gap-1">
              {!isOverviewLoading && pieData.length > 0 ? (
                <CategoryPieChart data={pieData} title="資料結構組成佔比" />
              ) : (
                <span className="text-slate-500 font-mono text-xs">載入中…</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-300">趨勢分析與時間序列 (Stacked Area Chart)</h2>
            </div>
            <div className="flex-1 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
              {!isOverviewLoading && trendData ? (
                <StackedAreaChart data={trendData} title="趨勢分析與時間序列" />
              ) : (
                <span className="text-slate-500 font-mono text-xs">載入中…</span>
              )}
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 space-y-6">
          <KpiPanel
            kpiCategory={kpiCategory}
            isLoading={isOverviewLoading}
            kpiData={kpiData}
            onCategoryChange={handleKpiCategoryChange}
          />

          <AiAnalysisPanel
            analysisText={aiAnalysisText}
            analysis={aiAnalysis}
            isStreaming={isAiStreaming}
            isDataReady={isDashboardDataReady}
            onRefresh={handleAIAnalysis}
          />
        </section>
      </main>
    </div>
  )
}

export default Dashboard
