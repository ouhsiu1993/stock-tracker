// server.js - 使用 yahoo-finance2 正確的 API 方法
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default; // 使用 .default 導入
const path = require('path');
const connectDB = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 連接 MongoDB
connectDB();

// 啟用 CORS
app.use(cors());
app.use(express.json({ extended: false }));

// 靜態文件服務
app.use(express.static(path.join(__dirname, 'build')));

// 定義路由
app.use('/api/portfolios', require('./routes/portfolios'));

// 默認匯率（當無法獲取實時匯率時使用）
let USD_TO_TWD_RATE = 31.5;

// 獲取最新美元對台幣匯率
async function getLatestExchangeRate() {
  try {
    // 使用標準的 quote 方法獲取匯率
    const result = await yahooFinance.quote('USDTWD=X');
    
    if (result && result.regularMarketPrice) {
      USD_TO_TWD_RATE = result.regularMarketPrice;
      console.log(`已更新 USD/TWD 匯率: ${USD_TO_TWD_RATE}`);
    } else {
      console.warn('無法從 Yahoo Finance 獲取匯率，使用默認匯率');
    }
  } catch (error) {
    console.error('獲取匯率時出錯:', error);
    console.warn('使用默認匯率');
  }
  
  return USD_TO_TWD_RATE;
}

// 啟動時先獲取一次匯率
getLatestExchangeRate();

// 每小時更新一次匯率
setInterval(getLatestExchangeRate, 3600000);

// API 端點 - 獲取美元對台幣匯率
app.get('/api/exchange-rate', async (req, res) => {
  try {
    // 確保我們有最新的匯率
    const rate = await getLatestExchangeRate();
    
    res.json({
      rate,
      from: 'USD',
      to: 'TWD',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('處理匯率請求時出錯:', error);
    res.status(500).json({ error: '獲取匯率時出錯' });
  }
});

// API 端點 - 獲取股票的 CAGR (複合年增長率)
app.post('/api/stock-cagr', async (req, res) => {
  try {
    const { symbols, years = 5 } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: '無效的股票代碼列表' });
    }
    
    // 計算開始日期 (預設5年)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);
    
    // 格式化日期為 YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`獲取歷史數據，期間: ${startDateStr} 至 ${endDateStr}`);
    
    // 處理每個股票的請求
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          let formattedSymbol = symbol;
          let isTWStock = /^\d+$/.test(symbol);
          
          // 處理台灣股票
          if (isTWStock) {
            formattedSymbol = `${symbol}.TW`;
          }
          
          console.log(`查詢 ${formattedSymbol} 的歷史價格...`);
          
          // 使用 historical 方法獲取歷史數據
          const result = await yahooFinance.historical(formattedSymbol, {
            period1: startDateStr,
            period2: endDateStr,
          });
          
          // 檢查是否有足夠的歷史數據
          if (!result || result.length < 2) {
            throw new Error(`無法獲取 ${symbol} 的足夠歷史數據`);
          }
          
          // 獲取開始和結束價格
          const startPrice = result[0].close;
          const endPrice = result[result.length - 1].close;
          
          // 計算 CAGR
          const cagr = Math.pow(endPrice / startPrice, 1 / years) - 1;
          
          return { 
            symbol, 
            startPrice,
            endPrice,
            cagr,
            cagrPercent: (cagr * 100).toFixed(2),
            years,
            dataPoints: result.length,
            error: null 
          };
          
        } catch (error) {
          console.error(`查詢 ${symbol} 的 CAGR 失敗:`, error);
          return { 
            symbol, 
            cagr: null,
            cagrPercent: null,
            error: error.message 
          };
        }
      })
    );
    
    res.json({
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('處理 CAGR 請求時出錯:', error);
    res.status(500).json({ error: '處理請求時出錯' });
  }
});

// API 端點 - 獲取股票價格
app.post('/api/stock-prices', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: '無效的股票代碼列表' });
    }
    
    // 獲取最新的匯率
    let exchangeRate = USD_TO_TWD_RATE; // 使用全局變量或重新獲取
    
    // 處理每個股票的請求
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          let formattedSymbol = symbol;
          let isTWStock = /^\d+$/.test(symbol);
          
          // 處理台灣股票
          if (isTWStock) {
            formattedSymbol = `${symbol}.TW`;
          }
          
          console.log(`查詢 ${formattedSymbol} 的價格...`);
          
          // 使用標準的 quote 方法獲取股票價格
          const result = await yahooFinance.quote(formattedSymbol);
          
          // 獲取原始價格
          let originalPrice = null;
          if (result && result.regularMarketPrice) {
            originalPrice = result.regularMarketPrice;
          }
          
          if (originalPrice === null) {
            throw new Error(`無法獲取 ${symbol} 的價格`);
          }
          
          // 美股價格轉換為台幣
          let price = originalPrice;
          if (!isTWStock) {
            price = originalPrice * exchangeRate;
            console.log(`轉換 ${symbol} 價格: $${originalPrice} USD → NT$${price.toFixed(2)} TWD (匯率: ${exchangeRate})`);
          }
          
          return { 
            symbol, 
            price,
            originalPrice,
            currency: isTWStock ? 'TWD' : 'USD',
            exchangeRate: isTWStock ? 1 : exchangeRate,
            error: null 
          };
          
        } catch (error) {
          console.error(`查詢 ${symbol} 失敗:`, error);
          return { 
            symbol, 
            price: null,
            originalPrice: null,
            currency: null,
            error: error.message 
          };
        }
      })
    );
    
    res.json({ 
      results,
      exchangeRate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('處理股票價格請求時出錯:', error);
    res.status(500).json({ error: '處理請求時出錯' });
  }
});

// API 端點 - 獲取股票詳細信息
app.get('/api/stock-info/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: '無效的股票代碼' });
    }
    
    let formattedSymbol = symbol;
    let isTWStock = /^\d+$/.test(symbol);
    
    // 處理台灣股票
    if (isTWStock) {
      formattedSymbol = `${symbol}.TW`;
    }
    
    console.log(`查詢 ${formattedSymbol} 的詳細信息...`);
    
    try {
      // 使用 yahooFinance 獲取詳細信息
      const result = await yahooFinance.quoteSummary(formattedSymbol, {
        modules: ['price', 'summaryProfile']
      });
      
      if (!result || !result.price) {
        throw new Error(`無法獲取 ${symbol} 的信息`);
      }
      
      // 提取所需的信息
      const stockInfo = {
        symbol,
        name: result.price.shortName || result.price.longName || symbol,
        currency: result.price.currency,
        // 提供更多詳細資訊
        sector: result.summaryProfile?.sector || null,
        industry: result.summaryProfile?.industry || null,
        country: result.summaryProfile?.country || null,
        website: result.summaryProfile?.website || null,
        longBusinessSummary: result.summaryProfile?.longBusinessSummary || null
      };
      
      res.json(stockInfo);
    } catch (error) {
      // 如果無法使用 quoteSummary，嘗試使用普通 quote 方法
      console.log(`嘗試使用 quote 方法獲取 ${formattedSymbol} 的信息...`);
      
      const quote = await yahooFinance.quote(formattedSymbol);
      
      if (!quote || !quote.shortName) {
        throw new Error(`無法獲取 ${symbol} 的信息`);
      }
      
      // 提取基本信息
      const stockInfo = {
        symbol,
        name: quote.shortName || quote.longName || symbol,
        currency: quote.currency || null
      };
      
      res.json(stockInfo);
    }
  } catch (error) {
    console.error('處理股票詳細信息請求時出錯:', error);
    res.status(500).json({ error: '獲取股票詳細信息時出錯', message: error.message });
  }
});

// 添加一個調試端點，用於檢查 API 是否正常工作
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API 服務正常運行',
    endpoints: [
      '/api/portfolios',
      '/api/portfolios/:id',
      '/api/exchange-rate',
      '/api/stock-prices',
      '/api/stock-cagr'
    ]
  });
});

console.log('投資組合 API 路由已設置');

// 處理所有其他請求 - 用於 SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
  console.log(`可用的 API 端點：http://localhost:${PORT}/api/portfolios`);
  console.log(`健康檢查端點：http://localhost:${PORT}/api/health`);
});