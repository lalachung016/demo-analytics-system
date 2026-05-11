import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const DASHBOARD_STREAM_MODEL = 'gpt-4o-mini';
const DASHBOARD_STREAM_TEMPERATURE = 0.7;

const SYSTEM_PROMPT =
  '你是一位數據分析顧問，請根據使用者提供的儀表板 JSON 資料，提供簡短、可執行的觀察與建議。這是一個 demo，請簡單回答，字數不要超過 100 字。';

function buildUserPrompt(dashboardData: unknown): string {
  return `請針對以下儀表板資料（pieData、trendData、kpiData）進行分析並給出建議：\n${JSON.stringify(dashboardData)}`;
}

/** 建立儀表板分析的串流 completion；模型與訊息模板皆封裝於此。 */
export async function createDashboardAnalysisStream(dashboardData: unknown) {
  return openai.chat.completions.create({
    model: DASHBOARD_STREAM_MODEL,
    temperature: DASHBOARD_STREAM_TEMPERATURE,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(dashboardData) },
    ],
    stream: true,
  });
}
