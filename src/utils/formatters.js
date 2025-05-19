// src/utils/formatters.js

// 數字格式化函數
export const formatNumber = (num) => {
  return num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

// 取得分類標籤的樣式
export const getCategoryStyle = (category) => {
  switch (category) {
    case '核心ETF':
      return {
        bg: 'blue.100',
        color: 'blue.700',
      };
    case '高成長股':
      return {
        bg: 'purple.100',
        color: 'purple.700',
      };
    case '波段操作':
      return {
        bg: 'yellow.100',
        color: 'yellow.700',
      };
    case '主題型ETF':
      return {
        bg: 'orange.100',
        color: 'orange.700',
      };
    case '高股息ETF':
      return {
        bg: 'green.100',
        color: 'green.700',
      };
    case '待轉出資產':
      return {
        bg: 'red.100',
        color: 'red.700',
      };
    default:
      return {
        bg: 'gray.100',
        color: 'gray.700',
      };
  }
};

// 判斷是否為美股
export const getMarketInfo = (symbol) => {
  // 簡單判斷：台股通常是純數字代碼
  const isUSMarket = !/^\d+$/.test(symbol);
  
  return {
    isUSMarket,
    marketBadgeProps: {} // 不再需要，但保留接口兼容性
  };
};