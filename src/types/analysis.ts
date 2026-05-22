export type AnalysisStatus = 'normal' | 'warning' | 'danger';

export type AnalysisSuggestion = {
  suggestion: string;
  suggestion_id: string;
};

export type DashboardAnalysis = {
  live_analysis: string;
  /** 僅在 JSON 中 status 已完整時才有值 */
  status?: AnalysisStatus;
  metric_id: string;
  suggestions: AnalysisSuggestion[];
};
