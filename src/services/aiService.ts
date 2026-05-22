const ANALYZE_API_PATH = '/api/analyze';

async function* readTextStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.length) {
        yield decoder.decode(value, { stream: true });
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** 透過 Vercel Serverless Function 建立儀表板分析的文字串流。 */
export async function createDashboardAnalysisStream(
  dashboardData: unknown,
): Promise<AsyncIterable<string>> {
  const response = await fetch(ANALYZE_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboardData }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Analyze API failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Analyze API returned empty body');
  }

  return readTextStream(response.body);
}
