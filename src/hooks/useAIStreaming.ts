import { useCallback, useRef, useState } from 'react';
import { createDashboardAnalysisStream } from '../services/aiService';

export type StreamAnalysisOptions = {
  cacheKey: string;
  /** 手動重新分析時略過 AI 快取 */
  forceRefresh?: boolean;
};

export const useAIStreaming = () => {
  const [text, setText] = useState('');
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
          setText(cached);
          setIsLoading(false);
          return;
        }
      }

      const runId = ++runIdRef.current;
      setIsLoading(true);
      setText('');

      let accumulated = '';

      try {
        const stream = await createDashboardAnalysisStream(dashboardData);

        for await (const chunk of stream) {
          if (runId !== runIdRef.current) break;

          const content = chunk.choices[0]?.delta?.content ?? '';
          if (!content) continue;

          accumulated += content;
          setText(accumulated);
        }

        if (runId === runIdRef.current && accumulated.length > 0) {
          analysisCacheRef.current.set(cacheKey, accumulated);
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

  return { text, isLoading, streamAnalysis };
};
