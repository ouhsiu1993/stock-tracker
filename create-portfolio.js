// create-portfolio.js - 改進版，確保衍生值正確計算並存儲
const axios = require('axios');

// API 基礎 URL
const API_BASE_URL = 'http://localhost:3001';

// 獲取當前股票價格
async function getStockPrices(symbols) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/stock-prices`, { symbols });
    return response.data.results;
  } catch (error) {
    console.error('獲取股票價格失敗:', error.message);
    return null;
  }
}

// 獲取股票的CAGR數據
async function getStockCAGR(symbols) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/stock-cagr`, { symbols, years: 5 });
    return response.data.results;
  } catch (error) {
    console.error('獲取CAGR數據失敗:', error.message);
    return null;
  }
}

// 創建新的投資組合
async function createPortfolio(name, description, stocks) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/portfolios`, {
      name,
      description,
      stocks
    });
    return response.data;
  } catch (error) {
    console.error('創建投資組合失敗:', error.message);
    if (error.response && error.response.data) {
      console.error('服務器回應:', error.response.data);
    }
    return null;
  }
}

// 計算衍生值
function calculateDerivedValues(stocks) {
  if (!stocks || stocks.length === 0) {
    return [];
  }
  
  // 計算現況總額
  const currentTotal = stocks.reduce((sum, stock) => {
    return sum + Math.round(stock.price * stock.currentQuantity);
  }, 0);
  
  // 計算目標總額
  const targetTotal = stocks.reduce((sum, stock) => {
    return sum + Math.round(stock.price * stock.targetQuantity);
  }, 0);
  
  // 為每支股票計算衍生值
  return stocks.map(stock => {
    // 計算金額
    const currentAmount = Math.round(stock.price * stock.currentQuantity);
    const targetAmount = Math.round(stock.price * stock.targetQuantity);
    
    // 計算配置比例
    const currentAllocation = currentTotal > 0 ? (currentAmount / currentTotal) * 100 : 0;
    const targetAllocation = targetTotal > 0 ? (targetAmount / targetTotal) * 100 : 0;
    
    // 計算年貢獻 (配置比例 × 年報酬率)
    const currentYearContribution = stock.cagr !== undefined && stock.cagr !== null 
      ? ((currentAllocation/100) * stock.cagr) 
      : 0;
      
    const yearContribution = stock.cagr !== undefined && stock.cagr !== null 
      ? ((targetAllocation/100) * stock.cagr) 
      : 0;
    
    // 計算達成率
    const progress = stock.targetQuantity > 0 ? (stock.currentQuantity / stock.targetQuantity) * 100 : 0;
    
    return {
      ...stock,
      // 添加所有計算好的衍生數值
      currentAmount,
      targetAmount,
      currentAllocation,
      targetAllocation,
      currentYearContribution,
      currentYearContributionPercent: currentYearContribution.toFixed(2),
      yearContribution,
      yearContributionPercent: yearContribution.toFixed(2),
      progress
    };
  });
}

// 主函數
async function main() {
  // 定義股票數據
  const stockData = [
    { id: '0050', symbol: '0050', name: '元大台灣50', category: '核心ETF', currentQuantity: 288, targetQuantity: 2000 },
    { id: 'NVDA', symbol: 'NVDA', name: '輝達', category: '高成長股', currentQuantity: 71, targetQuantity: 94 },
    { id: '2480', symbol: '2480', name: '敦陽科', category: '波段操作', currentQuantity: 3000, targetQuantity: 1000 },
    { id: '6214', symbol: '6214', name: '精誠', category: '待轉出資產', currentQuantity: 2000, targetQuantity: 0 },
    { id: '00893', symbol: '00893', name: '國泰智能電動車', category: '主題型ETF', currentQuantity: 0, targetQuantity: 7000 },
    { id: '00878', symbol: '00878', name: '國泰永續高股息', category: '高股息ETF', currentQuantity: 0, targetQuantity: 5000 }
  ];

  // 獲取所有股票的符號
  const symbols = stockData.map(stock => stock.symbol);

  console.log('開始獲取股票價格...');
  const priceResults = await getStockPrices(symbols);
  
  if (!priceResults) {
    console.error('無法獲取股票價格，中止創建投資組合');
    return;
  }

  console.log('開始獲取CAGR數據...');
  const cagrResults = await getStockCAGR(symbols);
  
  if (!cagrResults) {
    console.warn('無法獲取CAGR數據，將繼續創建投資組合但沒有CAGR數據');
  }

  // 合併價格和CAGR數據到股票數據中
  const enrichedStocks = stockData.map(stock => {
    // 查找價格數據
    const priceData = priceResults.find(result => result.symbol === stock.symbol);
    
    // 查找CAGR數據
    const cagrData = cagrResults ? cagrResults.find(result => result.symbol === stock.symbol) : null;
    
    return {
      ...stock,
      price: priceData ? priceData.price : 0,
      originalPrice: priceData ? priceData.originalPrice : null,
      exchangeRate: priceData ? priceData.exchangeRate : null,
      cagr: cagrData && cagrData.cagr !== null ? cagrData.cagr : null,
      cagrPercent: cagrData && cagrData.cagrPercent ? cagrData.cagrPercent : null
    };
  });

  // 關鍵改進: 計算所有衍生值
  const stocksWithDerivedValues = calculateDerivedValues(enrichedStocks);

  // 顯示將要創建的投資組合數據
  console.log('\n將創建包含以下股票的投資組合:');
  stocksWithDerivedValues.forEach(stock => {
    console.log(`${stock.symbol} (${stock.name}) - 價格: ${stock.price ? `NT$${stock.price.toFixed(2)}` : '未知'}, CAGR: ${stock.cagrPercent ? `${stock.cagrPercent}%` : '未知'}`);
    console.log(`  現況數量: ${stock.currentQuantity} 股, 目標數量: ${stock.targetQuantity} 股`);
    console.log(`  現況配置: ${stock.currentAllocation.toFixed(2)}%, 目標配置: ${stock.targetAllocation.toFixed(2)}%`);
    console.log(`  現況年貢獻: ${stock.currentYearContributionPercent}%, 目標年貢獻: ${stock.yearContributionPercent}%`);
    console.log(`  達成率: ${stock.progress.toFixed(1)}%`);
  });

  // 創建投資組合
  console.log('\n正在創建新的投資組合...');
  const portfolioName = `投資組合 ${new Date().toLocaleDateString('zh-TW')}`;
  const portfolioDescription = '自動建立的初始投資組合 (含衍生值)';
  
  const createdPortfolio = await createPortfolio(portfolioName, portfolioDescription, stocksWithDerivedValues);
  
  if (createdPortfolio) {
    console.log(`\n✅ 投資組合 "${createdPortfolio.name}" 創建成功!`);
    console.log(`📊 包含 ${createdPortfolio.stocks.length} 支股票`);
    console.log(`🆔 投資組合ID: ${createdPortfolio._id}`);
    
    // 驗證衍生值是否成功儲存
    console.log('\n驗證衍生值是否成功儲存:');
    
    let allDerivedValuesStored = true;
    
    createdPortfolio.stocks.forEach(stock => {
      // 檢查關鍵衍生值是否存在
      const missingFields = [];
      
      if (stock.currentYearContribution === undefined) missingFields.push('currentYearContribution');
      if (stock.currentYearContributionPercent === undefined) missingFields.push('currentYearContributionPercent');
      if (stock.yearContribution === undefined) missingFields.push('yearContribution');
      if (stock.yearContributionPercent === undefined) missingFields.push('yearContributionPercent');
      
      if (missingFields.length > 0) {
        console.log(`❌ ${stock.symbol}: 缺少衍生值欄位: ${missingFields.join(', ')}`);
        allDerivedValuesStored = false;
      } else {
        console.log(`✅ ${stock.symbol}: 所有衍生值欄位存在`);
        console.log(`   現況年貢獻: ${stock.currentYearContributionPercent}%, 目標年貢獻: ${stock.yearContributionPercent}%`);
      }
    });
    
    if (allDerivedValuesStored) {
      console.log('\n🎉 所有衍生值都已成功儲存!');
    } else {
      console.log('\n⚠️ 部分衍生值未成功儲存，請檢查程式碼');
    }
    
  } else {
    console.error('❌ 投資組合創建失敗');
  }
}

// 執行主函數
main().catch(error => {
  console.error('腳本執行出錯:', error);
});