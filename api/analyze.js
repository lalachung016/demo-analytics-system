import OpenAI from 'openai';

const DASHBOARD_STREAM_MODEL = 'gpt-4o-mini';
const DASHBOARD_STREAM_TEMPERATURE = 0.7;

const SYSTEM_PROMPT = `你是一位數據分析顧問。請根據使用者提供的儀表板 JSON 資料（pieData、trendData、kpiData）進行分析。

你必須只輸出一個 JSON 物件，不要輸出 markdown 程式碼區塊或其它說明文字。JSON 結構如下：
{
  "live_analysis": "繁體中文分析敘述，簡潔可執行，約 80~150 字",
  "status": "normal | warning | danger",
  "metric_id": "大寫蛇形命名的主要指標代碼，例如 KPI_CATEGORY_A、TREND_ANOMALY",
  "suggestions": [
    { "suggestion": "建議內容", "suggestion_id": "大寫蛇形命名代碼" }
  ]
}

欄位說明：
- live_analysis：分析結果（正常／異常／警告的具體觀察）
- status：normal=正常、warning=警告、danger=異常
- metric_id：本次分析最關注的指標代碼
- suggestions：1~3 筆建議要點，每筆含 suggestion 與 suggestion_id`;

function buildUserPrompt(dashboardData) {
  return `請針對以下儀表板資料進行分析，並依系統指示輸出 JSON：\n${JSON.stringify(dashboardData)}`;
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { dashboardData } = req.body ?? {};
  if (dashboardData === undefined) {
    return res.status(400).json({ error: 'dashboardData is required' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = await openai.chat.completions.create({
      model: DASHBOARD_STREAM_MODEL,
      temperature: DASHBOARD_STREAM_TEMPERATURE,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(dashboardData) },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) res.write(content);
    }

    res.end();
  } catch (error) {
    console.error('OpenAI stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'AI analysis failed' });
    }
    res.end();
  }
}
