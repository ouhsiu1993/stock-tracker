# 股票投資組合追蹤器

一個功能完善的投資組合追蹤和管理工具，幫助投資者監控、分析和優化其股票投資。

![投資組合追蹤器預覽](screenshots/stock-tracker.gif)

## 功能特色

- **現況與目標管理**：追蹤當前持有股票和設定目標配置
- **即時價格更新**：使用 Yahoo Finance API 自動獲取最新股價
- **報酬率計算**：根據歷史數據計算 CAGR (年複合增長率)
- **投資組合分析**：自動計算配置比例、達成率、年貢獻率
- **分類視覺化**：直觀的圓餅圖顯示類別配置
- **風險評估**：基於報酬率顯示投資組合風險屬性
- **資料儲存**：投資組合可儲存至 MongoDB 數據庫
- **本地及雲端部署**：支援本地開發環境和 Render 雲端部署

## 技術棧

### 前端
- **React 18**：使用最新的 React 框架
- **Chakra UI**：現代化、美觀的 UI 組件庫
- **recharts**：實現互動式圖表
- **axios**：處理 HTTP 請求

### 後端
- **Express.js**：輕量級 Node.js Web 應用框架
- **MongoDB**：使用 Mongoose ODM 的 NoSQL 數據庫
- **yahoo-finance2**：獲取股票價格和歷史數據
- **cors**：跨源資源共享中間件

## 安裝與設定

### 前提條件
- Node.js (>=14.x)
- npm 或 yarn
- MongoDB 資料庫 (本地或雲端如 MongoDB Atlas)

### 安裝步驟

1. 複製專案
```bash
git clone https://github.com/yourusername/stock-portfolio-tracker.git
cd stock-portfolio-tracker
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
建立 `.env` 檔案，參考 `.env.example` 檔案內容

```
REACT_APP_API_URL=http://localhost:3001
MONGODB_URI=your_mongodb_connection_string
```

4. 啟動應用
```bash
# 開發模式 (同時啟動前端和後端)
npm run dev

# 僅啟動前端
npm start

# 僅啟動後端
npm run server
```

## 使用指南

### 新增投資標的
1. 點擊「新增標的」按鈕
2. 輸入股票代號和其他必要資訊
3. 系統將自動獲取該股票的價格和報酬率資料

### 載入與儲存投資組合
- 使用「儲存」按鈕將當前投資組合保存到數據庫
- 使用「載入」按鈕從數據庫中載入已保存的投資組合

### 更新數據
- 點擊「更新數據」按鈕獲取所有股票的最新價格和報酬率
- 點擊「更新比例」按鈕重新計算投資組合的配置比例和年貢獻率

### 投資組合分析
- 在底部的「投資組合總覽」區域查看詳細的投資分析
- 透過圓餅圖直觀了解各類別的配置
- 查看各類別的年貢獻率和整體組合的預估報酬率

## 部署指南

### Render 部署
1. 在 Render 上創建一個新的 Web Service
2. 連接您的 GitHub 存儲庫
3. 設定環境變數 (MONGODB_URI)
4. 設定構建命令: `npm install && npm run build`
5. 設定啟動命令: `npm run render-start`

## 目錄結構

```
/
├── public/               # 靜態檔案
├── src/                  # 前端 React 程式碼
│   ├── components/       # React 元件
│   ├── utils/            # 工具函數
│   ├── App.js            # 應用程式主元件
│   └── index.js          # 程式進入點
├── models/               # MongoDB 模型定義
├── routes/               # API 路由處理
├── server.js             # Express 後端伺服器
├── db.js                 # 數據庫連接設定
└── package.json          # 專案依賴
```

## 開發者說明

- 使用 ESLint 和 Prettier 確保代碼質量
- 添加新功能時，請確保同時更新相關的單元測試
- 定期運行 `npm run test` 確保功能正常
- 分支命名規範：`feature/feature-name` 或 `bugfix/bug-name`

## API 端點

| 端點 | 方法 | 描述 |
|------|------|------|
| `/api/portfolios` | GET | 獲取所有投資組合 |
| `/api/portfolios/:id` | GET | 獲取特定投資組合詳情 |
| `/api/portfolios` | POST | 創建新投資組合 |
| `/api/portfolios/:id` | PUT | 更新特定投資組合 |
| `/api/portfolios/:id` | DELETE | 刪除特定投資組合 |
| `/api/stock-prices` | POST | 獲取股票價格 |
| `/api/stock-cagr` | POST | 獲取股票複合年增長率 |
| `/api/exchange-rate` | GET | 獲取美元對台幣匯率 |
| `/api/health` | GET | API 健康狀態檢查 |

## 貢獻指南

1. Fork 此存儲庫
2. 創建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建新的 Pull Request

## 許可證

本專案使用 MIT 許可證 - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡方式

GitHub Issues: https://github.com/ouhsiu1993/stock-tracker/issues
Email: ouhsiu1993@gmail.com