import React from 'react';
import Button from '@mui/material/Button';
import type { DashboardAnalysis } from '../types/analysis';

interface Props {
  analysisText: string;
  analysis: DashboardAnalysis | null;
  isStreaming: boolean;
  isDataReady: boolean;
  onRefresh: () => void;
}

const STATUS_LABEL: Record<NonNullable<DashboardAnalysis['status']>, string> = {
  danger: '異常',
  warning: '警告',
  normal: '正常',
};

const STATUS_CLASS: Record<NonNullable<DashboardAnalysis['status']>, string> = {
  danger: 'bg-red-500/20 text-red-300',
  warning: 'bg-amber-500/20 text-amber-300',
  normal: 'bg-emerald-500/20 text-emerald-300',
};

const AiAnalysisPanel: React.FC<Props> = ({
  analysisText,
  analysis,
  isStreaming,
  isDataReady,
  onRefresh,
}) => {
  const hasSuggestions = (analysis?.suggestions.length ?? 0) > 0;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col min-h-[410px] max-h-[520px]">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="w-1 h-4 bg-amber-500 rounded-full" />
        <h2 className="font-semibold text-slate-300">AI 分析</h2>
      </div>

      <div className="flex-1 min-h-0 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 flex flex-col gap-3 p-4 text-slate-300">
        <Button
          variant="contained"
          color="primary"
          disabled={isStreaming || !isDataReady}
          onClick={onRefresh}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '0.5rem',
            flexShrink: 0,
            bgcolor: '#0284c7',
            color: '#fff',
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
          {isStreaming ? '分析中…' : '重新取得 AI 分析'}
        </Button>

        <div className="flex-1 min-h-0 flex flex-col rounded-md bg-slate-950/50 border border-slate-800 overflow-hidden">
          {/* 狀態 */}
          <div className="shrink-0 px-3 py-2 border-b border-slate-800 min-h-[2.25rem] flex items-center gap-2">
            {analysis?.status ? (
              <>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold font-sans ${STATUS_CLASS[analysis.status]}`}
                >
                  {STATUS_LABEL[analysis.status]}
                </span>
                {analysis.metric_id ? (
                  <span className="font-mono text-xs text-slate-500 truncate">
                    {analysis.metric_id}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-slate-600 font-sans">狀態</span>
            )}
          </div>

          {/* 文字述敘 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 border-b border-slate-800">
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-slate-400 break-words">
              {isStreaming && !analysisText ? (
                <span className="text-slate-500">等待模型回應…</span>
              ) : analysisText ? (
                <>
                  {analysisText}
                  {isStreaming ? (
                    <span className="inline-block w-2 ml-0.5 h-3.5 bg-cyan-400/80 animate-pulse align-text-bottom" />
                  ) : null}
                </>
              ) : (
                <span className="text-slate-500 font-sans">
                  載入儀表板資料後將自動開始分析。
                </span>
              )}
            </p>
          </div>

          {/* 建議要點 */}
          <div
            className={`shrink-0 overflow-y-auto px-3 py-2 ${hasSuggestions ? 'max-h-[7.5rem]' : 'min-h-[2.25rem]'}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-sans mb-1.5">
              建議要點
            </p>
            {hasSuggestions ? (
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-sans">
                {analysis!.suggestions.map((item) => (
                  <li key={item.suggestion_id || item.suggestion} className="break-words">
                    <span className="text-slate-300">{item.suggestion}</span>
                    {item.suggestion_id ? (
                      <span className="ml-1 font-mono text-slate-600">
                        ({item.suggestion_id})
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600 font-sans">尚無建議</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisPanel;
