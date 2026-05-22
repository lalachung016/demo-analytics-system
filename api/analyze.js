import OpenAI from 'openai';

const DASHBOARD_STREAM_MODEL = 'gpt-4o-mini';
const DASHBOARD_STREAM_TEMPERATURE = 0.7;

const SYSTEM_PROMPT =
  '你是一位數據分析顧問，請根據使用者提供的儀表板 JSON 資料，提供簡短、可執行的觀察與建議。這是一個 demo，請簡單回答，字數不要超過 100 字。';

function buildUserPrompt(dashboardData) {
  return `請針對以下儀表板資料（pieData、trendData、kpiData）進行分析並給出建議：\n${JSON.stringify(dashboardData)}`;
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
