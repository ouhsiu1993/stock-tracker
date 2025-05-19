// src/components/SummarySection.js - 修正數據顯示問題
import React, { useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  Flex,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Tooltip,
} from '@chakra-ui/react';
import { formatNumber } from '../utils/formatters';
import CategoryPieChart from './CategoryPieChart';

// 獲取匯率信息
const getExchangeRateInfo = (stocks) => {
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    return null;
  }
  
  // 查找美股，獲取匯率信息
  const usStock = stocks.find(stock => !/^\d+$/.test(stock.symbol) && stock.exchangeRate);
  
  if (usStock && usStock.exchangeRate) {
    return {
      rate: usStock.exchangeRate,
      timestamp: usStock.rateTimestamp || new Date().toISOString()
    };
  }
  
  return null;
};

// 計算類別報酬率貢獻 - 修正計算
const calculateCategoryContributions = (categories, totalAmount, stocks, quantityType) => {
  let categoriesContributions = {};
  let totalYearContribution = 0;
  
  Object.entries(categories).forEach(([category, amount]) => {
    // 找出屬於該類別的所有股票
    const categoryStocks = stocks.filter(s => {
      if (quantityType === 'current') {
        return s.category === category && s.currentQuantity > 0;
      } else {
        return s.category === category && s.targetQuantity > 0;
      }
    });
    
    // 計算該類別的加權平均 CAGR
    let totalWeightedCAGR = 0;
    let totalAllocation = 0;
    
    categoryStocks.forEach(stock => {
      if (!stock.cagr) return;
      
      const quantity = quantityType === 'current' ? stock.currentQuantity : stock.targetQuantity;
      const stockAmount = stock.price * quantity;
      const allocation = amount > 0 ? (stockAmount / amount) : 0;
      
      totalWeightedCAGR += stock.cagr * allocation;
      totalAllocation += allocation;
    });
    
    const categoryCAGR = totalAllocation > 0 
      ? (totalWeightedCAGR / totalAllocation) 
      : 0;
    
    // 該類別對整體的貢獻
    const categoryAllocation = totalAmount > 0 
      ? (amount / totalAmount) 
      : 0;
    
    // 修正: 年貢獻計算
    const yearContribution = categoryAllocation * categoryCAGR;
    totalYearContribution += yearContribution;
    
    categoriesContributions[category] = {
      contribution: yearContribution,
      contributionPercent: (yearContribution * 100).toFixed(2),
      cagr: categoryCAGR,
      cagrPercent: (categoryCAGR * 100).toFixed(2),
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

// 根據報酬率確定風險屬性
const getRiskProfile = (returnRate) => {
  const rate = parseFloat(returnRate);
  if (rate < 2) return { name: "超保守型", risk: "極低風險", color: "blue.300" };
  if (rate >= 2 && rate < 4) return { name: "保守型", risk: "低風險", color: "blue.500" };
  if (rate >= 4 && rate < 7) return { name: "穩健型", risk: "中低風險", color: "green.400" };
  if (rate >= 7 && rate < 10) return { name: "平衡型", risk: "中風險", color: "yellow.400" };
  if (rate >= 10 && rate < 15) return { name: "積極型", risk: "中高風險", color: "orange.400" };
  return { name: "進取型", risk: "高風險", color: "red.400" };
};

// 摘要卡片組件 - 用於顯示報酬率信息
const ReturnsSummaryCard = ({ title, returns, helpText }) => {
  return (
    <Box 
      bg="#1E2A3B" 
      borderRadius="md" 
      p={4} 
      boxShadow="sm"
      borderWidth="1px"
      borderColor="#304261"
    >
      <Stat>
        <StatLabel color="gray.400">{title}</StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold" color="green.400">
          +{returns}%
        </StatNumber>
        {helpText && (
          <StatHelpText fontSize="xs" color="gray.400">
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

// 風險屬性卡片組件
const RiskProfileCard = ({ returnRate }) => {
  const riskProfile = getRiskProfile(returnRate);
  
  return (
    <Box 
      bg="#1E2A3B" 
      borderRadius="md" 
      p={4} 
      boxShadow="sm"
      borderWidth="1px"
      borderColor="#304261"
    >
      <Stat>
        <StatLabel color="gray.400">風險屬性</StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold" color={riskProfile.color}>
          {riskProfile.name}
        </StatNumber>
        <StatHelpText fontSize="xs" color="gray.400">
          {riskProfile.risk} ({returnRate}% 年報酬率)
        </StatHelpText>
      </Stat>
    </Box>
  );
};

// SummarySection 組件
const SummarySection = (props) => {
  // 解構屬性
  const { currentData, targetData, stocks, isLoading } = props;

  // 獲取匯率信息
  const exchangeRateInfo = getExchangeRateInfo(stocks);
  
  // 計算現況和目標的類別報酬率貢獻
  const currentCategoryContributions = calculateCategoryContributions(
    currentData.categories || {},
    currentData.totalAmount || 0,
    stocks || [],
    'current'
  );
  
  const targetCategoryContributions = calculateCategoryContributions(
    targetData.categories || {},
    targetData.totalAmount || 0,
    stocks || [],
    'target'
  );
  
  return (
    <Box
      bg="#2D3748"
      color="white"
      borderRadius="lg"
      p={6}
      mt={8}
      mx="auto"
      maxW="container.xl"
      opacity={isLoading ? 0.7 : 1}
      transition="opacity 0.2s"
      position="relative"
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
    >
      {/* Loading 遮罩 */}
      {isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex="1"
          borderRadius="lg"
          bg="rgba(0, 0, 0, 0.2)"
        >
          <Box
            width="40px"
            height="40px"
            borderRadius="full"
            border="4px solid"
            borderColor="gray.600"
            borderTopColor="blue.400"
            animation="spin 1s infinite linear"
            sx={{
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" }
              }
            }}
          />
        </Box>
      )}

      {/* 修改: 將匯率資訊移到同一行，並移除預設值 */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={4}
      >
        <Heading size="lg" color="white">
          投資組合總覽
        </Heading>
        
        {/* 匯率資訊 */}
        {exchangeRateInfo ? (
          <Box 
            px={3}
            py={1}
            bg="#3A4A63"
            borderRadius="md"
            fontSize="sm"
          >
            <Text>
              匯率：1 USD = {exchangeRateInfo.rate.toFixed(2)} TWD
              <Box as="span" ml={2} fontSize="xs" color="gray.400">
                美股金額已轉換為台幣
              </Box>
            </Text>
          </Box>
        ) : (
          <Box 
            px={3}
            py={1}
            bg="#3A4A63"
            borderRadius="md"
            fontSize="sm"
            color="gray.400"
          >
            <Text>
              匯率：未知
              <Box as="span" ml={2} fontSize="xs" color="gray.400">
                無法取得匯率資訊
              </Box>
            </Text>
          </Box>
        )}
      </Flex>
      
      {/* 數據狀態指示器 */}
      <Box mb={4} bg="#4A5568" p={2} borderRadius="md" fontSize="sm" boxShadow="md">
        <Flex justify="space-between">
          <Text>股票數據狀態: </Text>
          <Text 
            color={stocks && Array.isArray(stocks) && stocks.length > 0 
                  ? "#68D391" 
                  : "#FC8181"
            }
          >
            {stocks && Array.isArray(stocks) && stocks.length > 0 
              ? `已載入 ${stocks.length} 支股票` 
              : "未載入股票數據"
            }
          </Text>
        </Flex>
      </Box>
      
      {/* 投資組合報酬率摘要 - 分為現況和目標 */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        {/* 現況報酬率摘要 */}
        <Box>
          <Heading size="sm" color="gray.400" mb={3}>
            現況投資組合報酬率預估
          </Heading>
          
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            {/* 修改: 使用總年貢獻作為總報酬率 */}
            <ReturnsSummaryCard 
              title="預估年報酬率（總貢獻）" 
              returns={currentCategoryContributions.totalYearContributionPercent}
              helpText="各股票年貢獻總和"
            />
            
            {/* 風險屬性 - 使用總年貢獻 */}
            <RiskProfileCard returnRate={currentCategoryContributions.totalYearContributionPercent} />
          </SimpleGrid>
        </Box>
        
        {/* 目標報酬率摘要 */}
        <Box>
          <Heading size="sm" color="gray.400" mb={3}>
            目標投資組合報酬率預估
          </Heading>
          
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            {/* 修改: 使用總年貢獻作為總報酬率 */}
            <ReturnsSummaryCard 
              title="預估年報酬率（總貢獻）" 
              returns={targetCategoryContributions.totalYearContributionPercent}
              helpText="各股票年貢獻總和"
            />
            
            {/* 風險屬性 - 使用總年貢獻 */}
            <RiskProfileCard returnRate={targetCategoryContributions.totalYearContributionPercent} />
          </SimpleGrid>
        </Box>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* 現況統計 */}
        <Box>
          <Heading size="sm" color="gray.400" mb={4}>
            現況統計
          </Heading>
          
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            總持股金額：<Text as="span">NT${formatNumber(currentData.totalAmount || 0)}</Text>
          </Text>
          
          {/* 加入圓餅圖 */}
          <Box mb={4} bg="gray.700" p={4} borderRadius="md">
            <CategoryPieChart 
              data={currentData.categories || {}} 
              stocksData={stocks || []}
            />
          </Box>
          
          <Box mb={4}>
            {Object.entries(currentData.categories || {})
              .sort(([, amountA], [, amountB]) => amountB - amountA)
              .map(([category, amount], index) => (
                <Flex justify="space-between" mb={2} key={index}>
                  <Text>{category}：</Text>
                  <Text>
                    NT${formatNumber(amount)} 
                    ({((amount / (currentData.totalAmount || 1)) * 100).toFixed(1)}%)
                  </Text>
                </Flex>
              ))}
            
            {/* 新增總金額及比例行 */}
            <Divider my={2} opacity={0.3} />
            <Flex justify="space-between" fontWeight="bold">
              <Text>總金額及比例：</Text>
              <Text>
                NT${formatNumber(currentData.totalAmount || 0)} (100.0%)
              </Text>
            </Flex>
          </Box>
          
          {/* 現況類別報酬率貢獻 */}
          {Object.keys(currentData.categories || {}).length > 0 && (
            <>
              <Divider my={4} opacity={0.3} />
              
              <Box>
                <Text fontWeight="bold" mb={2} color="green.300">類別報酬率貢獻：</Text>
                
                {Object.entries(currentCategoryContributions.categoriesContributions)
                  .sort(([, dataA], [, dataB]) => Number(dataB.contributionPercent) - Number(dataA.contributionPercent))
                  .map(([category, data], index) => (
                    <Flex justify="space-between" mb={2} key={index}>
                      <Text>{category}：</Text>
                      <Tooltip
                        hasArrow
                        label={`類別配置 ${data.allocationPercent}% × 加權報酬率 ${data.cagrPercent}%`}
                        placement="top"
                        bg="gray.600"
                        color="white"
                      >
                        <Text fontWeight="bold" color="green.400">
                          +{data.contributionPercent}%
                        </Text>
                      </Tooltip>
                    </Flex>
                  ))}
                
                {/* 新增總報酬率行 */}
                <Divider my={2} opacity={0.3} />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>總報酬率：</Text>
                  <Text color="green.400">
                    +{currentCategoryContributions.totalYearContributionPercent}%
                  </Text>
                </Flex>
              </Box>
            </>
          )}
        </Box>
        
        {/* 目標統計 */}
        <Box>
          <Heading size="sm" color="gray.400" mb={4}>
            目標統計
          </Heading>
          
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            總目標金額：<Text as="span">NT${formatNumber(targetData.totalAmount || 0)}</Text>
          </Text>
          
          {/* 加入圓餅圖 */}
          <Box mb={4} bg="gray.700" p={4} borderRadius="md">
            <CategoryPieChart 
              data={targetData.categories || {}} 
              stocksData={stocks || []}
            />
          </Box>
          
          <Box mb={4}>
            {Object.entries(targetData.categories || {})
              .sort(([, amountA], [, amountB]) => amountB - amountA)
              .map(([category, amount], index) => (
                <Flex justify="space-between" mb={2} key={index}>
                  <Text>{category}：</Text>
                  <Text>
                    NT${formatNumber(amount)} 
                    ({((amount / (targetData.totalAmount || 1)) * 100).toFixed(1)}%)
                  </Text>
                </Flex>
              ))}
            
            {/* 新增總金額及比例行 */}
            <Divider my={2} opacity={0.3} />
            <Flex justify="space-between" fontWeight="bold">
              <Text>總金額及比例：</Text>
              <Text>
                NT${formatNumber(targetData.totalAmount || 0)} (100.0%)
              </Text>
            </Flex>
          </Box>
          
          {/* 目標類別報酬率貢獻 */}
          {Object.keys(targetData.categories || {}).length > 0 && (
            <>
              <Divider my={4} opacity={0.3} />
              
              <Box>
                <Text fontWeight="bold" mb={2} color="green.300">類別報酬率貢獻：</Text>
                
                {Object.entries(targetCategoryContributions.categoriesContributions)
                  .sort(([, dataA], [, dataB]) => Number(dataB.contributionPercent) - Number(dataA.contributionPercent))
                  .map(([category, data], index) => (
                    <Flex justify="space-between" mb={2} key={index}>
                      <Text>{category}：</Text>
                      <Tooltip
                        hasArrow
                        label={`類別配置 ${data.allocationPercent}% × 加權報酬率 ${data.cagrPercent}%`}
                        placement="top"
                        bg="gray.600"
                        color="white"
                      >
                        <Text fontWeight="bold" color="green.400">
                          +{data.contributionPercent}%
                        </Text>
                      </Tooltip>
                    </Flex>
                  ))}
                
                {/* 新增總報酬率行 */}
                <Divider my={2} opacity={0.3} />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>總報酬率：</Text>
                  <Text color="green.400">
                    +{targetCategoryContributions.totalYearContributionPercent}%
                  </Text>
                </Flex>
              </Box>
            </>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default SummarySection;