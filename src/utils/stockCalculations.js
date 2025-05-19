// src/utils/stockCalculations.js - 新增用於計算年報酬和年貢獻的通用函數

/**
 * 計算股票數據的所有衍生值，如金額、配置比例、年貢獻率等
 * @param {Array} stocksData 股票數據陣列
 * @returns {Array} 計算後的股票數據陣列
 */
export const enrichStocksWithCalculatedValues = (stocksData) => {
  if (!stocksData || !Array.isArray(stocksData) || stocksData.length === 0) {
    return [];
  }
  
  // 計算總額（所有現有股票數量 × 價格）
  const currentTotal = stocksData.reduce((sum, stock) => {
    return sum + (stock.price !== undefined ? Math.round(stock.price * stock.currentQuantity) : 0);
  }, 0);
  
  // 計算總額（所有目標股票數量 × 價格）
  const targetTotal = stocksData.reduce((sum, stock) => {
    return sum + (stock.price !== undefined ? Math.round(stock.price * stock.targetQuantity) : 0);
  }, 0);
  
  // 為每支股票計算衍生數值
  return stocksData.map(stock => {
    // 計算金額
    const currentAmount = stock.price !== undefined ? Math.round(stock.price * stock.currentQuantity) : 0;
    const targetAmount = stock.price !== undefined ? Math.round(stock.price * stock.targetQuantity) : 0;
    
    // 計算配置比例
    const currentAllocation = currentTotal > 0 ? (currentAmount / currentTotal) * 100 : 0;
    const targetAllocation = targetTotal > 0 ? (targetAmount / targetTotal) * 100 : 0;
    
    // 計算年貢獻 (配置比例 × 年報酬率)
    // 修正: 將比例換算為小數點(百分比除以100)再乘以年報酬率
    const currentYearContribution = stock.cagr !== undefined ? (currentAllocation / 100 * stock.cagr) : null;
    const yearContribution = stock.cagr !== undefined ? (targetAllocation / 100 * stock.cagr) : null;
    
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
      currentYearContributionPercent: currentYearContribution !== null ? currentYearContribution.toFixed(2) : undefined,
      yearContribution,
      yearContributionPercent: yearContribution !== null ? yearContribution.toFixed(2) : undefined,
      progress
    };
  });
};

/**
 * 計算投資組合的類別報酬率貢獻
 * @param {Object} categories 類別金額數據
 * @param {Number} totalAmount 總金額
 * @param {Array} stocks 股票數據陣列
 * @param {String} quantityType 計算的數量類型 ('current' 或 'target')
 * @returns {Object} 包含各類別貢獻率和總貢獻率的物件
 */
export const calculateCategoryContributions = (categories, totalAmount, stocks, quantityType = 'current') => {
  let categoriesContributions = {};
  let totalYearContribution = 0;
  
  Object.entries(categories).forEach(([category, amount]) => {
    // 找出屬於該類別的所有股票
    const categoryStocks = stocks.filter(s => {
      if (quantityType === 'current') {
        return s.category === category && s.currentQuantity > 0 && s.cagr !== undefined;
      } else {
        return s.category === category && s.targetQuantity > 0 && s.cagr !== undefined;
      }
    });
    
    // 計算該類別的加權平均 CAGR
    let totalWeightedCAGR = 0;
    let totalAllocation = 0;
    
    categoryStocks.forEach(stock => {
      const quantity = quantityType === 'current' ? stock.currentQuantity : stock.targetQuantity;
      const stockAmount = stock.price * quantity;
      const allocation = amount > 0 ? (stockAmount / amount) : 0;
      
      if (stock.cagr && allocation > 0) {
        totalWeightedCAGR += stock.cagr * allocation;
        totalAllocation += allocation;
      }
    });
    
    const categoryCAGR = totalAllocation > 0 
      ? (totalWeightedCAGR / totalAllocation) 
      : 0;
    
    // 該類別對整體的貢獻
    const categoryAllocation = totalAmount > 0 
      ? (amount / totalAmount) 
      : 0;
    
    // 修正: 類別年貢獻 = 類別配置比例(換算為小數) × 類別平均年報酬率
    const yearContribution = (categoryAllocation / 100) * categoryCAGR;
    totalYearContribution += yearContribution;
    
    categoriesContributions[category] = {
      contribution: yearContribution,
      contributionPercent: (yearContribution * 100).toFixed(2),
      cagr: categoryCAGR,
      cagrPercent: (categoryCAGR).toFixed(2),
      allocation: categoryAllocation,
      allocationPercent: (categoryAllocation * 100).toFixed(1)
    };
  });
  
  return {
    categoriesContributions,
    totalYearContribution,
    totalYearContributionPercent: (totalYearContribution * 100).toFixed(2)
  };
};

/**
 * 根據報酬率確定風險屬性
 * @param {String|Number} returnRate 年報酬率百分比
 * @returns {Object} 風險屬性資訊
 */
export const getRiskProfile = (returnRate) => {
  const rate = parseFloat(returnRate);
  if (rate < 2) return { name: "超保守型", risk: "極低風險", color: "blue.300" };
  if (rate >= 2 && rate < 4) return { name: "保守型", risk: "低風險", color: "blue.500" };
  if (rate >= 4 && rate < 7) return { name: "穩健型", risk: "中低風險", color: "green.400" };
  if (rate >= 7 && rate < 10) return { name: "平衡型", risk: "中風險", color: "yellow.400" };
  if (rate >= 10 && rate < 15) return { name: "積極型", risk: "中高風險", color: "orange.400" };
  return { name: "進取型", risk: "高風險", color: "red.400" };
};

/**
 * 獲取投資組合的加權平均年報酬率和總貢獻率
 * @param {Array} stocks 股票數據陣列 
 * @param {Object} portfolioData 投資組合數據
 * @returns {Object} 報酬率信息物件
 */
export const getPortfolioCAGR = (stocks, portfolioData) => {
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0 || !portfolioData) {
    return { 
      averageCAGR: 0, 
      totalContribution: 0, 
      averageCAGRPercent: "0.00", 
      totalContributionPercent: "0.00" 
    };
  }
  
  // 初始化總貢獻
  let totalContribution = 0;
  
  // 過濾出有效股票
  const filteredStocks = stocks.filter(stock => 
    (stock.targetQuantity > 0 || stock.currentQuantity > 0) && 
    stock.cagr !== undefined && stock.cagr !== null
  );
  
  // 計算各股票的貢獻
  filteredStocks.forEach(stock => {
    // 根據當前計算的是目標還是現況來選擇數量
    const quantity = stock.targetQuantity > 0 ? stock.targetQuantity : stock.currentQuantity;
    
    // 計算金額和配置比例
    const amount = stock.price * quantity;
    const allocation = portfolioData.totalAmount > 0 ? (amount / portfolioData.totalAmount) * 100 : 0;
    
    // 修正: 計算年貢獻率並累加 (配置比例換算為小數後乘以年報酬率)
    const yearContribution = (allocation / 100) * stock.cagr;
    totalContribution += yearContribution;
  });
  
  // 計算加權平均CAGR（用於展示）
  let totalWeightedCAGR = 0;
  let totalValidAllocations = 0;
  
  filteredStocks.forEach(stock => {
    const quantity = stock.targetQuantity > 0 ? stock.targetQuantity : stock.currentQuantity;
    const amount = stock.price * quantity;
    const allocation = portfolioData.totalAmount > 0 ? (amount / portfolioData.totalAmount) * 100 : 0;
    
    totalWeightedCAGR += stock.cagr * allocation;
    totalValidAllocations += allocation;
  });
  
  // 計算加權平均（避免除以0）
  const averageCAGR = totalValidAllocations > 0 ? (totalWeightedCAGR / totalValidAllocations) : 0;
  
  return {
    averageCAGR,
    averageCAGRPercent: (averageCAGR).toFixed(2),
    totalContribution,
    totalContributionPercent: (totalContribution * 100).toFixed(2)
  };
};