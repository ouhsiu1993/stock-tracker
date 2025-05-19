import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box } from '@chakra-ui/react';

// 定義更鮮明的顏色
const CATEGORY_COLORS = {
  '核心ETF': '#3182CE',       // 更亮的藍色
  '高成長股': '#9F7AEA',      // 更亮的紫色
  '波段操作': '#ECC94B',      // 更亮的黃色
  '主題型ETF': '#ED8936',     // 更亮的橘色
  '高股息ETF': '#48BB78',     // 更亮的綠色
  '待轉出資產': '#F56565',    // 更亮的紅色
};

// 定義對應的淺色背景和文字顏色
const CATEGORY_BG_COLORS = {
  '核心ETF': '#EBF8FF',       // 淺藍色背景
  '高成長股': '#F3E8FF',      // 淺紫色背景
  '波段操作': '#FEFCBF',      // 淺黃色背景
  '主題型ETF': '#FEEBDE',     // 淺橘色背景
  '高股息ETF': '#E6FFFA',     // 淺綠色背景
  '待轉出資產': '#FFF5F5',    // 淺紅色背景
};

const CATEGORY_TEXT_COLORS = {
  '核心ETF': '#2C5282',       // 深藍色文字
  '高成長股': '#553C9A',      // 深紫色文字
  '波段操作': '#975A16',      // 深黃色文字
  '主題型ETF': '#9C4221',     // 深橘色文字
  '高股息ETF': '#276749',     // 深綠色文字
  '待轉出資產': '#9B2C2C',    // 深紅色文字
};

// 硬編碼標的數據 - 確保至少有東西顯示
const FALLBACK_STOCKS = {
  '核心ETF': ['0050（元大台灣50）'],
  '高成長股': ['NVDA（輝達）'],
  '波段操作': ['2480（敦陽科）'],
  '待轉出資產': ['6214（精誠）'],
  '主題型ETF': ['00893（國泰智能電動車）'],
  '高股息ETF': ['00878（國泰永續高股息）']
};

// 自定義工具提示
const CustomizedTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    
    // 獲取股票列表
    const stocks = data.stocks && data.stocks.length > 0 
      ? data.stocks 
      : FALLBACK_STOCKS[data.name] || [];
    
    // 判斷是否使用了後備數據
    const usingFallback = !(data.stocks && data.stocks.length > 0);
    
    return (
      <Box
        bg="gray.600"
        color="white"
        p={3}
        borderRadius="md"
        boxShadow="md"
        maxW="300px"
      >
        <Box fontWeight="bold" mb={2}>
          {data.name} - NT${data.value.toLocaleString()} ({(data.percent * 100).toFixed(1)}%)
        </Box>
        <Box fontSize="sm">
          <Box fontWeight="semibold" mb={1} display="flex" alignItems="center">
            包含標的:
            {usingFallback && (
              <Box 
                ml={2} 
                px={1} 
                py={0.5} 
                fontSize="xs" 
                bg="red.600" 
                color="white" 
                borderRadius="sm"
              >
                後備數據
              </Box>
            )}
            {!usingFallback && (
              <Box 
                ml={2} 
                px={1} 
                py={0.5} 
                fontSize="xs" 
                bg="green.600" 
                color="white" 
                borderRadius="sm"
              >
                動態數據
              </Box>
            )}
          </Box>
          {stocks.map((stock, idx) => (
            <Box key={idx} ml={2} mb={1}>• {stock}</Box>
          ))}
        </Box>
      </Box>
    );
  }
  return null;
};

const CategoryPieChart = ({ data, stocksData }) => {
  // 手動將類別與股票關聯起來
  const getCategoryStocks = (category) => {
    if (!stocksData || !Array.isArray(stocksData)) {
      console.warn("stocksData is invalid");
      return FALLBACK_STOCKS[category] || [];
    }
    
    // 嘗試從 stocksData 中找到屬於該類別的股票
    const matches = stocksData.filter(stock => 
      stock && stock.category === category
    );
    
    if (matches.length === 0) {
      return FALLBACK_STOCKS[category] || [];
    }
    
    return matches.map(stock => `${stock.symbol}（${stock.name}）`);
  };
  
  // 創建餅圖數據
  const pieData = Object.entries(data || {}).map(([category, value]) => {
    const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0);
    const percent = total > 0 ? (value / total) : 0;
    
    // 獲取該類別的股票
    const stocks = getCategoryStocks(category);
    
    return {
      name: category,
      value,
      percent,
      stocks
    };
  });

  return (
    <Box height="250px" width="100%">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            // 標籤僅顯示百分比，確保不顯示金額
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.name] || '#A0AEC0'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomizedTooltip />} />
          <Legend formatter={(value) => <span style={{ color: 'white' }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CategoryPieChart;