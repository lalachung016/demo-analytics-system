import type {
  KpiCategory,
  KpiData,
  PieChartData,
  YearlyStackedAreaData,
} from '../types/dashboard'

const OVERVIEW_API = '/api/dashboard/overview'

export type DashboardOverview = {
  year: number
  pieData: PieChartData[]
  trendData: YearlyStackedAreaData
  kpiByCategory: Record<KpiCategory, KpiData[]>
}

const overviewCache = new Map<number, DashboardOverview>()
const overviewInflight = new Map<number, Promise<DashboardOverview>>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

/** 同步讀取已快取之 KPI（切換 A/B 時無需再請求） */
export const peekKpiFromCache = (
  year: number,
  category: KpiCategory,
): KpiData[] | undefined => overviewCache.get(year)?.kpiByCategory[category]

/** 取得儀表板總覽（Pie + Trend + KPI A/B） */
export const fetchDashboardOverview = async (
  year: number,
  options: { forceRefresh?: boolean } = {},
): Promise<DashboardOverview> => {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = overviewCache.get(year)
    if (cached) return cached

    const inflight = overviewInflight.get(year)
    if (inflight) return inflight
  }

  const params = new URLSearchParams({ year: String(year) })
  const request = fetchJson<DashboardOverview>(`${OVERVIEW_API}?${params}`)
    .then((data) => {
      overviewCache.set(year, data)
      return data
    })
    .finally(() => {
      overviewInflight.delete(year)
    })

  overviewInflight.set(year, request)
  return request
}
