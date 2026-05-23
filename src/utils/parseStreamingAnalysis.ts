import { Allow, MalformedJSON, parse, PartialJSON } from 'partial-json'
import type {
  AnalysisStatus,
  AnalysisSuggestion,
  DashboardAnalysis,
} from '../types/analysis'

const PARTIAL_ALLOW = Allow.STR | Allow.ARR | Allow.OBJ

const VALID_STATUSES = new Set<AnalysisStatus>(['normal', 'warning', 'danger'])

function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)(?:```)?$/i)
  return (fenced?.[1] ?? trimmed).trim()
}

function normalizeStatus(value: unknown): AnalysisStatus | undefined {
  if (typeof value === 'string' && VALID_STATUSES.has(value as AnalysisStatus)) {
    return value as AnalysisStatus
  }
  return undefined
}

function normalizeSuggestions(value: unknown): AnalysisSuggestion[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      suggestion: typeof item.suggestion === 'string' ? item.suggestion : '',
      suggestion_id: typeof item.suggestion_id === 'string' ? item.suggestion_id : '',
    }))
    .filter((item) => item.suggestion.length > 0)
    .slice(0, 3)
}

function normalizeParsed(parsed: unknown): DashboardAnalysis | null {
  if (!parsed || typeof parsed !== 'object') return null

  const record = parsed as Record<string, unknown>
  const live_analysis =
    typeof record.live_analysis === 'string' ? record.live_analysis : ''

  const status = normalizeStatus(record.status)

  return {
    live_analysis,
    ...(status !== undefined ? { status } : {}),
    metric_id: typeof record.metric_id === 'string' ? record.metric_id : '',
    suggestions: normalizeSuggestions(record.suggestions),
  }
}

/** 從串流中的不完整 JSON 解析儀表板分析結果（允許未閉合字串與陣列）。 */
export function parseStreamingDashboardAnalysis(
  raw: string,
): DashboardAnalysis | null {
  const jsonText = stripMarkdownFence(raw)
  if (!jsonText.startsWith('{')) return null

  try {
    return normalizeParsed(parse(jsonText, PARTIAL_ALLOW))
  } catch (error) {
    if (error instanceof PartialJSON || error instanceof MalformedJSON) {
      return null
    }
    return null
  }
}
