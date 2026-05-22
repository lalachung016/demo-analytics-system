import { useCallback, useRef, useState } from 'react';
import { createDashboardAnalysisStream } from '../services/aiService';
import type { DashboardAnalysis } from '../types/analysis';
import { parseStreamingDashboardAnalysis } from '../utils/parseStreamingAnalysis';

export type StreamAnalysisOptions = {
  cacheKey: string;
  /** 手動重新分析時略過 AI 快取 */
  forceRefresh?: boolean;
};

function applyParsedFromRaw(
  raw: string,
  setText: (value: string) => void,
  setAnalysis: (value: DashboardAnalysis | null) => void,
) {
  const parsed = parseStreamingDashboardAnalysis(raw);
  if (!parsed) return;

  setAnalysis(parsed);
  setText(parsed.live_analysis);
}

export const useAIStreaming = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<DashboardAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const runIdRef = useRef(0);
  const analysisCacheRef = useRef<Map<string, string>>(new Map());

  const streamAnalysis = useCallback(
    async (dashboardData: unknown, options: StreamAnalysisOptions) => {
      const { cacheKey, forceRefresh = false } = options;

      if (!forceRefresh) {
        const cached = analysisCacheRef.current.get(cacheKey);
        if (cached !== undefined) {
          runIdRef.current += 1;
          applyParsedFromRaw(cached, setText, setAnalysis);
          setIsLoading(false);
          return;
        }
      }

      const runId = ++runIdRef.current;
      setIsLoading(true);
      setText('');
      setAnalysis(null);

      let accumulated = '';

      try {
        const stream = await createDashboardAnalysisStream(dashboardData);

        for await (const content of stream) {
          if (runId !== runIdRef.current) break;
          if (!content) continue;

          accumulated += content;
          applyParsedFromRaw(accumulated, setText, setAnalysis);
        }

        if (runId === runIdRef.current && accumulated.length > 0) {
          analysisCacheRef.current.set(cacheKey, accumulated);
          applyParsedFromRaw(accumulated, setText, setAnalysis);
        }
      } catch (error) {
        console.error('AI 串流呼叫失敗', error);
      } finally {
        if (runId === runIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  return { text, analysis, isLoading, streamAnalysis };
};
