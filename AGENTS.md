# AGENTS.md — demo-analytics-system

本文件供 AI 編碼代理快速理解專案架構、慣例與修改邊界。人類開發者請參考 [README.md](./README.md)。

## 專案概要

**ESG / 指標監控儀表板 Demo**（`esg-carbon-dashboard`）：React 19 + TypeScript + Vite 8 前端，部署於 Vercel；圖表用 ECharts，UI 混用 Tailwind CSS 4 與 MUI 9。

兩個主要頁面：

| 路由 | 頁面 | 資料來源 |
|------|------|----------|
| `/dashboard` | 年度指標監控（圓餅、堆疊面積、KPI） | `GET /api/dashboard/overview`；AI：`POST /api/dashboard/analyze` |
| `/live-metrics` | 即時大數據折線圖 | 初始：`GET /api/monitor/live-history`；即時：Pusher（Python，前端待串接） |

## 目錄結構

```
api/                    # Vercel Serverless（依「場景」分層，非 REST 資源樹）
  dashboard/            # 📊 儀表板頁（按月聚合）
    overview.js         # GET 整合 pieData、trendData、kpiByCategory
    analyze.js          # POST OpenAI 串流分析
  monitor/              # ⏱️ 即時監控頁（秒級高頻）
    live-history.js     # GET 10,000 筆初始序列
lib/
  dashboardMock.js      # Dashboard mock + 伺服器快取
  monitorLiveHistory.js # Live 初始序列演算法
simulation/
  mock_data.py          # 每 200ms 推 Pusher（live-metrics / point）
src/
  pages/                # Dashboard.tsx、LiveMetrics.tsx
  components/           # 圖表與 AiAnalysisPanel 等
  hooks/                # useAIStreaming、useChartAutoResize、useExcelExport
  services/
    dashboardService.ts # Dashboard API 客戶端 + 快取
    liveMetricsService.ts
    aiService.ts
  types/                # dashboard.ts、analysis.ts
  utils/                # parseStreamingAnalysis.ts（partial-json）
```

## 本機開發

**建議單一流程（最接近正式環境）：**

```bash
npm install
npm run dev:vercel   # http://localhost:3000，同時提供 Vite + /api
```

- 根目錄 `.env` 需有 `OPENAI_API_KEY`（`.env*` 已 gitignore，不會部署）。
- **勿**同時用 3000 與 5173 當「前端」；若用 `npm run dev`（5173），必須另開 `dev:vercel` 並依賴 `vite.config.ts` 的 `/api` proxy。

```bash
npm run build   # tsc -b && vite build → dist/
npm run lint
```

## 架構與資料流

### Dashboard（`/dashboard`）

- `dashboardService.fetchDashboardOverview(year)` → `GET /api/dashboard/overview?year=`（一次取得 Pie + Trend + KPI A/B）；切換 KPI 用 `peekKpiFromCache`。
- `useAIStreaming` → `aiService` → `POST /api/dashboard/analyze`（`text/plain` 串流）。
- 串流回應為 JSON；`parseStreamingAnalysis.ts` 用 `partial-json` 解析未閉合 JSON，UI 只顯示 `live_analysis`（打印機效果）。
- `AiAnalysisPanel`：狀態 | 文字述敘 | 建議要點（三区排版，`min-h-0` + 獨立 scroll）。

**修改 Dashboard 時不要動 `api/monitor/*` 或 `liveMetricsService.ts`。**

### Live Metrics（`/live-metrics`）

| 階段 | 負責 | 說明 |
|------|------|------|
| 初始化 | `api/monitor/live-history.js` | 固定 10,000 點；**不產生即時新點** |
| 即時推播 | `simulation/mock_data.py` | 每 200ms → Pusher `live-metrics` / `point`，payload `{ timestamp, value }` |
| 前端 | `liveMetricsService.ts` | `fetchLiveMetricsHistory()` 有模組級 cache + inflight 去重（避免 StrictMode 雙重請求） |
| 訂閱 | `subscribeLiveMetrics()` | 目前 **no-op**；`LIVE_STREAM_ENABLED = false`；`pusher-js` 已安裝待串接 |

`LiveMetrics.tsx`：ECharts 大數據折線、`appendData`、rolling window（3 分鐘）、暫停時 dataZoom 探索歷史。

## API 合約

### `GET /api/dashboard/overview?year=2025`

- 回應：`{ year, pieData, trendData, kpiByCategory: { A, B } }`
- `year` 查詢參數：2017–2026

### `POST /api/dashboard/analyze`

- Body：`{ dashboardData: { pieData, trendData, kpiData } }`
- 需環境變數：`OPENAI_API_KEY`（Vercel 專案設定，非 `VITE_*`）
- 回應：`text/plain` 串流，內容為單一 JSON 物件（`response_format: json_object`）

### `GET /api/monitor/live-history`

- 回應：`{ points: LivePoint[], meta: { count, intervalMs, purpose: 'initial' } }`
- `LivePoint`: `{ timestamp: number, value: number }`（value ∈ [0, 100]）

## Code style

適用於 `src/**/*.{ts,tsx}` 新增與修改（既有檔案逐步對齊即可，勿為風格大規模重構未相關檔案）。

- **TypeScript strict mode**：`tsconfig.app.json` 應啟用 `"strict": true`；避免 `any`、非空斷言濫用；共用型別放 `src/types/`。
- **引號與分號**：單引號 `'`、**不寫分號**；`eslint.config.js` 已設 `semi: never`、`quotes: single`。
- **函式式風格**：優先 `const`、箭頭函式、純函式與 custom hooks；React 用 function component + hooks，避免 class component；副作用集中在 `useEffect` 或 service 層。

```typescript
// ✅ 偏好
export const normalizeStatus = (value: unknown): AnalysisStatus | undefined => {
  if (typeof value !== 'string') return undefined
  return VALID_STATUSES.has(value as AnalysisStatus)
    ? (value as AnalysisStatus)
    : undefined
}

// ❌ 避免（除非必要）
function normalizeStatus(value: any) {
  return value;
}
```

`api/*.js` 為 Vercel Serverless，維持現有 ESM 風格即可，不強制套用上述分號規則。

## 編碼慣例

- **語言**：UI 與 AI prompt 使用**繁體中文**；程式識別子、API 欄位用英文（如 `live_analysis`、`metric_id`）。
- **樣式**：版面以 Tailwind 為主；按鈕、Select 等用 MUI `sx`，色票對齊 slate/cyan 深色主題（參考既有 `Dashboard.tsx`、`KpiPanel.tsx`）。
- **圖表**：ECharts 設 `animation: false`；大數據用 `large: true`、`appendData`；容器尺寸變動用 `useChartAutoResize`。
- **Serverless**：`api/*.js` 為 ESM，`export default async function handler(req, res)`；敏感金鑰僅 `process.env`，禁止 commit `.env*`。
- **範圍控制**：只改任務相關檔案；不重構未要求的 Dashboard mock 或無關頁面。
- **React**：`main.tsx` 使用 `StrictMode`；會觸發 effect 雙掛載——對昂貴請求用 service 層 dedupe/cache，勿僅靠 component ref 防雙呼叫。

## 環境變數

| 變數 | 用途 | 位置 |
|------|------|------|
| `OPENAI_API_KEY` | `/api/analyze` | `.env` 本機、Vercel 專案設定 |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` | Python 推播（可選，有預設） | `simulation/mock_data.py` |

`.env.local` 為 Vercel CLI 產生的 OIDC，與應用邏輯無關，可刪除。

## 常見任務指引

### 串接 Live Metrics Pusher

1. 在 Vercel / `.env` 設定前端可讀的 Pusher key（若用 `VITE_PUSHER_KEY`，僅限公開 key）。
2. 實作 `subscribeLiveMetrics`（`pusher-js`），訂閱 `LIVE_METRICS_PUSHER_CHANNEL` / `LIVE_METRICS_PUSHER_EVENT`。
3. 將 `LIVE_STREAM_ENABLED` 改為 `true`；`LiveMetrics.tsx` 內訂閱分支才會 `appendData`。
4. 確認 `mock_data.py` 與前端使用相同 channel/event。

### 調整 AI 分析輸出

- Prompt / 模型：`api/analyze.js`
- 串流解析：`src/utils/parseStreamingAnalysis.ts`
- 型別：`src/types/analysis.ts`
- UI：`AiAnalysisPanel.tsx`、`useAIStreaming.ts`

### 新增 Dashboard 圖表或 KPI

- Mock 產生與伺服器快取：`lib/dashboardMock.js`；前端：`dashboardService.ts`、`src/types/dashboard.ts`
- 頁面組裝：`Dashboard.tsx`；可抽 component 至 `src/components/`

## 部署

- 平台：Vercel；`vercel.json` 設定 `buildCommand`、`outputDirectory: dist`、SPA rewrite（排除 `/api/*`）。
- 部署後若 AI 回 500 `OPENAI_API_KEY is not configured`：在 Vercel 設定變數並 **Redeploy**。
- `npm run preview` 僅靜態檔，**不含** `/api`。

## 勿做的事

- 不要把 `OPENAI_API_KEY` 暴露為 `VITE_*` 或寫進前端 bundle。
- 不要在 `api/monitor/live-history.js` 產生即時新點（初始化專用）。
- 不要把 Dashboard 資料邏輯加回前端或與 Live Metrics API 混用。
- 不要提交 `.env`、Pusher secret、或 `.env.local` 內容。
- 未要求時不要建立 git commit。

## 相關檔案速查

| 需求 | 檔案 |
|------|------|
| 路由 / 導覽 | `src/router/routes.tsx` |
| AI 串流 hook | `src/hooks/useAIStreaming.ts` |
| 即時歷史 API | `api/history.js` |
| 推播模擬 | `simulation/mock_data.py` |
| SPA + API 路由 | `vercel.json` |
| Vite API proxy | `vite.config.ts` |
