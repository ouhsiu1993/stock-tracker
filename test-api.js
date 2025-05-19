// test-api.js - 用於測試股票追蹤器 API 的 Node.js 腳本
const axios = require('axios');

// API 基礎 URL - 本地開發環境
const API_BASE_URL = 'http://localhost:3001';

// 格式化紀錄
const formatLog = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // 青色
    success: '\x1b[32m%s\x1b[0m',  // 綠色
    warning: '\x1b[33m%s\x1b[0m',  // 黃色
    error: '\x1b[31m%s\x1b[0m'     // 紅色
  };
  
  console.log(colors[type], message);
};

// 測試股票價格 API
const testStockPrices = async () => {
  formatLog('====== 測試股票價格 API ======', 'info');
  
  try {
    // 測試常見股票代碼
    const symbols = ['0050', 'NVDA', '2330', 'AAPL', 'MSFT'];
    
    formatLog(`請求股票價格: ${symbols.join(', ')}`, 'info');
    
    const response = await axios.post(`${API_BASE_URL}/api/stock-prices`, { symbols });
    
    formatLog('API回傳成功!', 'success');
    formatLog(`獲取匯率: USD 1 = TWD ${response.data.exchangeRate.toFixed(2)}`, 'success');
    
    // 檢查每支股票的數據
    response.data.results.forEach(stock => {
      if (stock.price !== null && stock.price !== undefined) {
        formatLog(`${stock.symbol}: NT$${stock.price.toFixed(2)}`, 'success');
        
        // 如果是美股，檢查匯率轉換
        if (stock.currency === 'USD') {
          formatLog(`  - 原始價格: $${stock.originalPrice.toFixed(2)} USD`, 'info');
          formatLog(`  - 使用匯率: ${stock.exchangeRate.toFixed(2)}`, 'info');
        }
      } else {
        formatLog(`${stock.symbol}: 未獲取價格 ${stock.error ? `(錯誤: ${stock.error})` : ''}`, 'error');
      }
    });
    
    // 檢查是否有未定義值
    const hasUndefinedValues = response.data.results.some(stock => 
      stock.price === undefined || stock.price === null
    );
    
    if (hasUndefinedValues) {
      formatLog('警告: 有股票價格為undefined或null', 'warning');
    }
    
    return response.data;
  } catch (error) {
    formatLog(`錯誤: ${error.message}`, 'error');
    
    if (error.response) {
      formatLog(`HTTP狀態碼: ${error.response.status}`, 'error');
      formatLog(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'error');
    }
    
    return null;
  }
};

// 測試CAGR API
const testCagrApi = async () => {
  formatLog('\n====== 測試CAGR API ======', 'info');
  
  try {
    // 測試常見股票代碼
    const symbols = ['0050', 'NVDA', '2330', 'AAPL', 'MSFT'];
    
    formatLog(`請求CAGR數據: ${symbols.join(', ')}`, 'info');
    
    const response = await axios.post(`${API_BASE_URL}/api/stock-cagr`, { 
      symbols,
      years: 5
    });
    
    formatLog('CAGR API回傳成功!', 'success');
    
    // 檢查每支股票的數據
    response.data.results.forEach(stock => {
      if (stock.cagr !== null && stock.cagr !== undefined) {
        formatLog(`${stock.symbol}: ${stock.cagrPercent}%`, 'success');
        
        if (stock.startPrice && stock.endPrice) {
          formatLog(`  - 開始價格: ${stock.startPrice.toFixed(2)}`, 'info');
          formatLog(`  - 結束價格: ${stock.endPrice.toFixed(2)}`, 'info');
          formatLog(`  - 成長倍數: ${(stock.endPrice/stock.startPrice).toFixed(2)}x`, 'info');
        }
      } else {
        formatLog(`${stock.symbol}: 未獲取CAGR ${stock.error ? `(錯誤: ${stock.error})` : ''}`, 'error');
      }
    });
    
    // 檢查是否有未定義值
    const hasUndefinedValues = response.data.results.some(stock => 
      stock.cagr === undefined || stock.cagr === null
    );
    
    if (hasUndefinedValues) {
      formatLog('警告: 有股票CAGR為undefined或null', 'warning');
    }
    
    return response.data;
  } catch (error) {
    formatLog(`錯誤: ${error.message}`, 'error');
    
    if (error.response) {
      formatLog(`HTTP狀態碼: ${error.response.status}`, 'error');
      formatLog(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'error');
    }
    
    return null;
  }
};

// 測試匯率API
const testExchangeRate = async () => {
  formatLog('\n====== 測試匯率API ======', 'info');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`);
    
    formatLog('匯率API回傳成功!', 'success');
    formatLog(`獲取匯率: 1 ${response.data.from} = ${response.data.rate.toFixed(2)} ${response.data.to}`, 'success');
    formatLog(`時間戳: ${response.data.timestamp}`, 'info');
    
    return response.data;
  } catch (error) {
    formatLog(`錯誤: ${error.message}`, 'error');
    
    if (error.response) {
      formatLog(`HTTP狀態碼: ${error.response.status}`, 'error');
      formatLog(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'error');
    }
    
    return null;
  }
};

// 測試達成率計算
const testProgressCalculation = () => {
  formatLog('\n====== 測試達成率計算 ======', 'info');
  
  // 測試案例
  const testCases = [
    { currentQuantity: 288, targetQuantity: 100 },
    { currentQuantity: 288, targetQuantity: 2000 },
    { currentQuantity: 71, targetQuantity: 94 },
    { currentQuantity: 3000, targetQuantity: 5 },
    { currentQuantity: 0, targetQuantity: 100 },
    { currentQuantity: 100, targetQuantity: 0 },
  ];
  
  testCases.forEach(({ currentQuantity, targetQuantity }) => {
    try {
      // 避免除以零
      if (targetQuantity <= 0) {
        formatLog(`達成率計算: 現有${currentQuantity}股 / 目標${targetQuantity}股 = 無法計算(目標為零)`, 'warning');
        return;
      }
      
      const progress = (currentQuantity / targetQuantity) * 100;
      formatLog(`達成率計算: 現有${currentQuantity}股 / 目標${targetQuantity}股 = ${progress.toFixed(1)}%`, 'success');
    } catch (error) {
      formatLog(`達成率計算錯誤: ${error.message}`, 'error');
    }
  });
};

// 測試投資組合功能
const testPortfolios = async () => {
  formatLog('\n====== 測試投資組合API ======', 'info');
  
  try {
    // 獲取所有投資組合
    formatLog('獲取所有投資組合列表...', 'info');
    const response = await axios.get(`${API_BASE_URL}/api/portfolios`);
    
    if (response.data && Array.isArray(response.data)) {
      formatLog(`成功獲取 ${response.data.length} 個投資組合`, 'success');
      
      // 顯示投資組合列表
      response.data.forEach((portfolio, index) => {
        formatLog(`${index + 1}. ${portfolio.name} (最後更新: ${new Date(portfolio.updatedAt).toLocaleString()})`, 'info');
      });
      
      // 如果有投資組合，獲取第一個的詳細信息
      if (response.data.length > 0) {
        const portfolioId = response.data[0]._id;
        formatLog(`\n獲取投資組合詳細信息 (ID: ${portfolioId})...`, 'info');
        
        const detailResponse = await axios.get(`${API_BASE_URL}/api/portfolios/${portfolioId}`);
        
        if (detailResponse.data) {
          const portfolio = detailResponse.data;
          formatLog(`投資組合名稱: ${portfolio.name}`, 'success');
          formatLog(`描述: ${portfolio.description || '無描述'}`, 'info');
          formatLog(`共有 ${portfolio.stocks.length} 支股票`, 'info');
          
          // 顯示部分股票信息
          if (portfolio.stocks.length > 0) {
            formatLog('\n股票資訊抽樣:', 'info');
            for (let i = 0; i < Math.min(3, portfolio.stocks.length); i++) {
              const stock = portfolio.stocks[i];
              formatLog(`- ${stock.symbol} (${stock.name}): 現有 ${stock.currentQuantity} 股, 目標 ${stock.targetQuantity} 股`, 'info');
              
              // 檢查CAGR和股價是否為undefined
              if (stock.cagr === undefined || stock.cagr === null) {
                formatLog(`  警告: ${stock.symbol} 的CAGR為undefined`, 'warning');
              }
              
              if (stock.price === undefined || stock.price === null) {
                formatLog(`  警告: ${stock.symbol} 的股價為undefined`, 'warning');
              }
            }
          }
        } else {
          formatLog('無法獲取投資組合詳細信息', 'error');
        }
      }
    } else {
      formatLog('無投資組合數據或數據格式不正確', 'warning');
    }
    
    return response.data;
  } catch (error) {
    formatLog(`錯誤: ${error.message}`, 'error');
    
    if (error.response) {
      formatLog(`HTTP狀態碼: ${error.response.status}`, 'error');
      formatLog(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'error');
    }
    
    return null;
  }
};

// 測試API服務健康狀態
const testApiHealth = async () => {
  formatLog('\n====== 測試API服務健康狀態 ======', 'info');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    
    formatLog('API健康狀態回傳成功!', 'success');
    formatLog(`狀態: ${response.data.status}`, 'success');
    formatLog(`訊息: ${response.data.message}`, 'info');
    
    if (response.data.endpoints && Array.isArray(response.data.endpoints)) {
      formatLog('可用的API端點:', 'info');
      response.data.endpoints.forEach(endpoint => {
        formatLog(`- ${endpoint}`, 'info');
      });
    }
    
    return response.data;
  } catch (error) {
    formatLog(`錯誤: ${error.message}`, 'error');
    
    if (error.response) {
      formatLog(`HTTP狀態碼: ${error.response.status}`, 'error');
      formatLog(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'error');
    } else {
      formatLog('API服務可能未啟動或無法連接', 'error');
    }
    
    return null;
  }
};

// 執行所有測試
const runAllTests = async () => {
  formatLog('\n******** 開始API測試 ********\n', 'info');
  
  try {
    // 首先檢查API是否可用
    await testApiHealth();
    
    // 測試股票價格API
    await testStockPrices();
    
    // 測試CAGR API
    await testCagrApi();
    
    // 測試匯率API
    await testExchangeRate();
    
    // 測試達成率計算
    testProgressCalculation();
    
    // 測試投資組合API
    await testPortfolios();
    
    formatLog('\n******** 測試完成 ********\n', 'success');
  } catch (error) {
    formatLog(`測試過程中發生嚴重錯誤: ${error.message}`, 'error');
  }
};

// 執行指定的測試 (如果有傳入命令行參數)
const runSpecificTest = async () => {
  const testName = process.argv[2];
  
  if (!testName) {
    return runAllTests();
  }
  
  formatLog(`\n******** 執行指定測試: ${testName} ********\n`, 'info');
  
  switch (testName) {
    case 'health':
      await testApiHealth();
      break;
    case 'prices':
      await testStockPrices();
      break;
    case 'cagr':
      await testCagrApi();
      break;
    case 'exchange':
      await testExchangeRate();
      break;
    case 'progress':
      testProgressCalculation();
      break;
    case 'portfolios':
      await testPortfolios();
      break;
    default:
      formatLog(`未知的測試: ${testName}`, 'error');
      formatLog('可用的測試: health, prices, cagr, exchange, progress, portfolios', 'info');
  }
  
  formatLog('\n******** 測試完成 ********\n', 'success');
};

// 啟動測試
runSpecificTest();