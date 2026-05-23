# ESG Carbon Dashboard

React + TypeScript + Vite 儀表板，API 依**場景**分層部署於 Vercel Serverless；OpenAI Key 僅在伺服器端。

## API 地圖

```
api/
├── dashboard/             # 儀表板頁（按月聚合）
│   ├── overview.js        # GET 整合 KPI、Pie、Area
│   └── analyze.js         # POST AI 分析（OpenAI 串流）
│
└── monitor/               # 即時監控頁（秒級高頻）
    └── live-history.js    # GET 10,000 筆初始序列
```

| 方法 | 路徑 |
|------|------|
| GET | `/api/dashboard/overview?year=2025` |
| POST | `/api/dashboard/analyze` |
| GET | `/api/monitor/live-history` |

## 環境變數

在專案根目錄建立 `.env`（本機 `vercel dev` 會讀取；部署到 Vercel 請在專案設定加入同名變數）：

```bash
OPENAI_API_KEY=sk-...
```

前端**不需要** `VITE_OPENAI_API_KEY`。

## 本機開發（二選一）

兩種方式擇一即可，**不要同時用兩個網址開前端**（例如又開 3000 又開 5173）。

### 方式 A：只用 Vercel Dev（建議）

```bash
npm install
npm run dev:vercel
```

瀏覽器開啟：**http://localhost:3000**

### 方式 B：Vite + Vercel Dev

**終端 1：** `npm run dev:vercel`  
**終端 2：** `npm run dev` → **http://localhost:5173**

前端 `/api/*` 由 `vite.config.ts` 代理至 `http://127.0.0.1:3000`。

## Live Metrics 推播模擬

```bash
cd simulation && pip install -r requirements.txt && python mock_data.py
```

推播至 Pusher `live-metrics` / `point`；前端以 `pusher-js` 訂閱並 `appendData`。

可選 `.env`（與 Python 使用同一 Pusher App 的**公開** key）：

```bash
VITE_PUSHER_KEY=your_public_key
VITE_PUSHER_CLUSTER=ap3
```

## 建置與部署

```bash
npm run build
npm run lint
```

部署到 [Vercel](https://vercel.com) 時設定 `OPENAI_API_KEY` 並 Redeploy。

代理與架構細節見 [AGENTS.md](./AGENTS.md)。
