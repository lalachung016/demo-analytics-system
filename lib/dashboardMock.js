import { faker } from '@faker-js/faker'

const MIN_YEAR = 2017
const MAX_YEAR = 2026
const API_DELAY_MS = 600

const CATEGORY_NAMES = ['數據 A', '數據 B', '數據 C', '其他']
const TREND_SERIES_NAMES = ['數據 A', '數據 B', '數據 C']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const KPI_NAMES = {
  A: ['指標 X', '指標 Y', '指標 Z'],
  B: ["指標 X'", "指標 Y'", "指標 Z'"],
}

const pieChartCache = new Map()
const stackedAreaCache = new Map()
const kpiCache = new Map()
const kpiDescriptionCache = new Map()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const randomFloat = (min, max, fractionDigits = 1) =>
  Number(faker.number.float({ min, max, fractionDigits }))

export function parseYearParam(value) {
  const year = Number(value)
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return null
  }
  return year
}

export function parseKpiCategory(value) {
  if (value === 'A' || value === 'B') return value
  return null
}

function createYearPieChart(year) {
  return {
    year,
    categories: CATEGORY_NAMES.map((name) => ({
      name,
      value: randomFloat(200, 9500, 1),
      unit: '萬元',
    })),
  }
}

function createYearTrend(year) {
  return {
    year,
    months: [...MONTH_LABELS],
    series: TREND_SERIES_NAMES.map((name) => ({
      name,
      values: MONTH_LABELS.map(() => randomFloat(80, 1500, 1)),
      unit: '萬元',
    })),
  }
}

function createKpiGroup(category) {
  return KPI_NAMES[category].map((name) => {
    const previousValue = randomFloat(50, 3000, 2)
    const changeRate = randomFloat(-0.25, 0.25, 4)
    const value = Number((previousValue * (1 + changeRate)).toFixed(2))
    const description =
      kpiDescriptionCache.get(name) ??
      `${faker.lorem.sentence({ min: 8, max: 14 })} ${faker.lorem.sentence({ min: 8, max: 14 })}`
    kpiDescriptionCache.set(name, description)

    return {
      name,
      value,
      previousValue,
      description,
      unit: '萬元',
    }
  })
}

export async function getPieChartForYear(year) {
  const cached = pieChartCache.get(year)
  if (cached) return cached

  await sleep(API_DELAY_MS)
  const generated = createYearPieChart(year)
  pieChartCache.set(year, generated)
  return generated
}

export async function getTrendForYear(year) {
  const cached = stackedAreaCache.get(year)
  if (cached) return cached

  await sleep(API_DELAY_MS)
  const generated = createYearTrend(year)
  stackedAreaCache.set(year, generated)
  return generated
}

export async function getKpiForYear(year, category) {
  const key = `${year}-${category}`
  const cached = kpiCache.get(key)
  if (cached) return cached

  await sleep(API_DELAY_MS)
  const generated = createKpiGroup(category)
  kpiCache.set(key, generated)
  return generated
}

/** 儀表板總覽：Pie + Trend + KPI（A/B） */
export async function getDashboardOverview(year) {
  const [pieChart, trendData, kpiA, kpiB] = await Promise.all([
    getPieChartForYear(year),
    getTrendForYear(year),
    getKpiForYear(year, 'A'),
    getKpiForYear(year, 'B'),
  ])

  return {
    year,
    pieData: pieChart.categories,
    trendData,
    kpiByCategory: {
      A: kpiA,
      B: kpiB,
    },
  }
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed)
  return res.status(405).json({ error: 'Method not allowed' })
}
