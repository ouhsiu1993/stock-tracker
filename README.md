# 股票追蹤器

一個用於追蹤和管理股票投資組合的 React 應用。

## 功能

- 追蹤現有股票和目標股票
- 即時更新股票價格（透過 Yahoo Finance API）
- 顯示每支股票的配置百分比
- 自動計算總金額和配置比例
- 直觀的圓餅圖視覺化
- 價格變動視覺指示

## 技術

- 前端：React 18 + Chakra UI
- 後端：Express.js
- 圖表：recharts 圖表庫
- 股價資料：Yahoo Finance API (通過 yahoo-finance2 套件)

## 安裝與運行

```bash
# 安裝依賴
bash setup.sh
# 或手動執行
npm install

# 開發模式運行（前端+後端）
npm run dev

# 僅運行前端
npm start

# 僅運行後端
npm run server

# 構建應用
npm run build
```

## 開發說明

- 前端開發服務器運行在 http://localhost:3000
- API 後端服務器運行在 http://localhost:3001
- API 端點：
  - POST /api/stock-prices - 獲取股票價格

## 部署

應用已配置為可在 Render 上部署。使用以下命令：

```bash
npm run render-start
```

## 環境變量

在開發環境中，應用使用 .env 文件中的配置：

- REACT_APP_API_URL - API 基礎 URL (默認為 http://localhost:3001)