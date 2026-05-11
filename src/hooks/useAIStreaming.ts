import { useCallback, useRef, useState } from 'react';
import { createDashboardAnalysisStream } from '../services/aiService';

export const useAIStreaming = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const runIdRef = useRef(0);

  const streamAnalysis = useCallback(async (dashboardData: unknown) => {
    const runId = ++runIdRef.current;
    setIsLoading(true);
    setText('');

    try {
      const stream = await createDashboardAnalysisStream(dashboardData);

      for await (const chunk of stream) {
        if (runId !== runIdRef.current) break;

        const content = chunk.choices[0]?.delta?.content ?? '';
        if (!content) continue;

        for (const ch of content) {
          console.log(ch);
        }
        setText((prev) => prev + content);
      }
    } catch (error) {
      console.error('AI 串流呼叫失敗', error);
    } finally {
      if (runId === runIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return { text, isLoading, streamAnalysis };
};
