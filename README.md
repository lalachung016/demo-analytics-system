# ESG Carbon Dashboard

React + TypeScript + Vite 儀表板，AI 分析透過 Vercel Serverless Function（`/api/analyze`）呼叫 OpenAI，API Key 僅存在伺服器端。

## 環境變數

在專案根目錄建立 `.env`（本機 `vercel dev` 會讀取；部署到 Vercel 請在專案設定加入同名變數）：

```bash
OPENAI_API_KEY=sk-...
```

前端**不需要** `VITE_OPENAI_API_KEY`。

## 本機開發（二選一）

兩種方式擇一即可，**不要同時用兩個網址開前端**（例如又開 3000 又開 5173）。

### 方式 A：只用 Vercel Dev（建議）

一個指令同時跑 Vite 前端與 `/api` Serverless Function，最接近正式環境。

**需求：** 已安裝 [Vercel CLI](https://vercel.com/docs/cli)（`npm i -g vercel`）

```bash
npm install
npm run dev:vercel
```

瀏覽器開啟：**http://localhost:3000**

- `vercel.json` 的 SPA rewrite 在此模式會生效
- `vite.config.ts` 的 `/api` proxy **不會用到**（可忽略）

---

### 方式 B：Vite + Vercel Dev（前後端分離）

適合只想用 Vite 的 HMR 介面、API 另開的情況。需要**兩個終端**。

**終端 1 — API（port 3000）：**

```bash
npm run dev:vercel
```

**終端 2 — 前端（port 5173）：**

```bash
npm run dev
```

瀏覽器開啟：**http://localhost:5173**（不要開 3000 當前端）

- 前端對 `/api/analyze` 的請求，由 `vite.config.ts` 代理到 `http://127.0.0.1:3000`
- 若只跑 `npm run dev`、沒開 `dev:vercel`，AI 分析會失敗

---

### 對照

| | 方式 A | 方式 B |
|--|--------|--------|
| 指令 | `npm run dev:vercel` | `dev:vercel` + `npm run dev` |
| 前端網址 | http://localhost:3000 | http://localhost:5173 |
| `/api` | Vercel 直接處理 | Vite proxy → 3000 |
| 設定檔 | `vercel.json` | `vite.config.ts` proxy |

## Live Metrics 資料流

| 階段 | 來源 |
|------|------|
| 初始 10,000 筆 | `GET /api/history`（`api/history.js`） |
| 即時推送（200ms） | `simulation/mock_data.py` → Pusher `live-metrics` / `point` |

本機執行推播模擬器：

```bash
cd simulation && pip install -r requirements.txt && python mock_data.py
```

前端 `subscribeLiveMetrics`（`src/services/liveMetricsService.ts`）已保留接口，Pusher 串接待實作。

## 建置與部署

```bash
npm run build    # 輸出至 dist/
npm run preview  # 預覽靜態 build（不含 /api，AI 不會運作）
```

部署到 [Vercel](https://vercel.com) 時，在專案環境變數設定 `OPENAI_API_KEY`。`vercel.json` 已設定 build 輸出與 SPA 路由。

## 其他指令

```bash
npm run lint
```
