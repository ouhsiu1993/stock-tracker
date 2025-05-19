// src/components/InvestmentCard.js - 移除預設值和修正達成率計算
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Text,
  Flex,
  Badge,
  Input,
  InputGroup,
  InputRightAddon,
  useColorModeValue,
  Tag,
  Tooltip,
  Progress,
  Grid,
  GridItem,
  IconButton
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { formatNumber, getCategoryStyle, getMarketInfo } from '../utils/formatters';

const InvestmentCard = ({ 
  stock, 
  cardType, 
  quantity, 
  onQuantityChange, 
  allocation,
  isLoading,
  isLoaded = false,
  onDelete
}) => {
  const { id, name, symbol, category, price, originalPrice, exchangeRate, currentQuantity, targetQuantity } = stock;
  const amount = Math.round(quantity * price);
  const categoryStyle = getCategoryStyle(category);
  
  // 獲取市場資訊
  const { isUSMarket } = getMarketInfo(symbol);
  
  // 美股卡片背景色調深一點
  const cardBg = isUSMarket 
    ? '#262D3D' // 美股卡片用更深的背景
    : '#2D3748'; // 台股卡片保持原來的背景
  
  const cardShadow = useColorModeValue('sm', 'none');
  
  // 添加狀態來追蹤價格變化
  const [prevPrice, setPrevPrice] = useState(price);
  const [isPriceChanged, setIsPriceChanged] = useState(false);
  const timerRef = useRef(null);
  
  // 監視價格變化
  useEffect(() => {
    // 如果是剛載入的股票，不顯示變化動畫，直接設置前一次的價格為當前價格
    if (isLoaded) {
      setPrevPrice(price);
      setIsPriceChanged(false);
      return;
    }

    if (price !== prevPrice) {
      setPrevPrice(price);
      setIsPriceChanged(true);
      
      // 設置動畫持續時間後清除狀態
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsPriceChanged(false);
      }, 2000);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [price, prevPrice, isLoaded]);
  
  // 確定價格變化的方向
  const priceDirection = price > prevPrice 
    ? 'up' 
    : price < prevPrice 
      ? 'down' 
      : 'none';
  
  // 價格變化的百分比
  const priceChangePercent = prevPrice !== 0 
    ? ((price - prevPrice) / prevPrice * 100).toFixed(2) 
    : '0.00';
    
  // 計算進度百分比（僅在目標卡片中顯示）
  const calculateProgress = () => {
    if (cardType !== 'target') return 0;
    
    // 如果目標數量為0，避免除以零的錯誤
    if (targetQuantity <= 0) return 0;
    
    // 計算進度百分比
    const progress = (currentQuantity / targetQuantity) * 100;
    
    // 檢查是否為有效數字
    if (isNaN(progress)) return 0;
    
    // 返回計算結果，保留最小值為0
    return Math.max(progress, 0);
  };

  // 獲取進度值
  const progress = calculateProgress();
  
  // 根據進度值選擇顏色
  const getProgressColorScheme = (value) => {
    if (value === 0) return "red";    // 0% 時用紅色
    if (value > 100) return "red";    // 超過100% 時也用紅色
    if (value >= 70) return "blue";   // 70-100% 用藍色
    if (value >= 30) return "yellow"; // 30-70% 用黃色
    return "red";                     // 0-30% 用紅色
  };
  
  // 當數量為0時的卡片透明度
  const cardOpacity = quantity > 0 ? 1 : 0.6;
  
  // 檢查數據是否為預設值或缺失
  const isMissingData = (value) => {
    return value === undefined || value === null;
  };
  
  return (
    <Box
      bg={cardBg}
      borderRadius="lg"
      boxShadow={cardShadow}
      p={5}
      mb={4}
      data-type={cardType}
      data-category={category}
      data-market={isUSMarket ? 'us' : 'tw'}
      opacity={isLoading ? 0.7 : cardOpacity}
      transition="opacity 0.2s"
      position="relative"
    >


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
          bg="rgba(255, 255, 255, 0.3)"
        >
          <Box
            width="30px"
            height="30px"
            borderRadius="full"
            border="3px solid"
            borderColor="gray.200"
            borderTopColor="blue.500"
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
      
      
{/* 標題列 */}
<Flex justify="space-between" align="center" mb={4}>
  <Flex align="center">
    <Text fontWeight="bold" fontSize="lg">
      {symbol}（{name}）
    </Text>
    
    {/* 美股標籤 - 使用飽和度高的深色底+白字 */}
    {isUSMarket && (
      <Tag 
        size="sm" 
        ml={2} 
        bg="#0052CC" 
        color="white" 
        fontWeight="bold"
        borderRadius="md"
        fontSize="xs"
      >
        美股
      </Tag>
    )}
  </Flex>
  
  {/* 類別和刪除按鈕放在一起 */}
  <Flex align="center">
    {/* 數量為零的標籤放在類別左邊 */}
    {quantity === 0 && (
      <Badge 
        colorScheme="gray" 
        variant="solid"
        px={2}
        py={1}
        borderRadius="md"
        fontSize="xs"
        mr={2} // 添加右邊距，與類別分開
      >
        數量為零
      </Badge>
    )}

    <Badge px={3} py={1} borderRadius="full" {...categoryStyle}>
      {category}
    </Badge>
    
    {/* 刪除按鈕放在類別右側 */}
    <Tooltip label="刪除此標的" placement="top">
      <IconButton
        aria-label="刪除標的"
        icon={<DeleteIcon boxSize="16px" />}
        size="md"
        colorScheme="red"
        variant="ghost"
        ml={2}
        opacity="0.7"
        _hover={{ 
          opacity: "1",
          bg: "#4A5568"
        }}
        onClick={() => onDelete && onDelete(stock.id)}
      />
    </Tooltip>
  </Flex>
</Flex>
      
      {/* 使用Grid進行兩欄式佈局 */}
      <Grid templateColumns="1fr 1fr" gap={4}>
        {/* 左側欄 - 數量和數據 */}
        <GridItem>
          <Flex align="center" mb={2}>
            <Text width="60px" textAlign="right" mr={2}>
              數量：
            </Text>
            <InputGroup size="sm" maxW="120px">
              <Input
                type="number"
                value={quantity}
                min={0}
                onChange={(e) => onQuantityChange(stock.id, parseInt(e.target.value) || 0)}
                borderRadius="md"
              />
              <InputRightAddon children="股" bg="#4A5568"/>
            </InputGroup>
          </Flex>
          
          <Flex align="center" mb={2}>
            <Text width="60px" textAlign="right" mr={2}>
              股價：
            </Text>
            <Box position="relative" data-price={price}>
              {isMissingData(price) ? (
                <Text color="gray.400">未知</Text>
              ) : (
                <Tooltip 
                  label={isUSMarket && originalPrice ? `原始價格: $${originalPrice.toFixed(2)} USD，匯率: ${exchangeRate?.toFixed(2)}` : ''} 
                  isDisabled={!isUSMarket || isMissingData(originalPrice) || isMissingData(exchangeRate)}
                  hasArrow
                  placement="top"
                >
                  <Text 
                    fontWeight="bold"
                    color={isPriceChanged 
                      ? priceDirection === 'up' 
                        ? 'green.400' 
                        : priceDirection === 'down' 
                          ? 'red.400' 
                          : 'white'
                      : 'white'
                    }
                    transition="color 0.3s"
                    textDecoration={isUSMarket ? "underline dotted" : "none"}
                    textUnderlineOffset="3px"
                    cursor={isUSMarket ? "help" : "default"}
                  >
                    NT${price.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    
                    {isPriceChanged && (
                      <Box
                        as="span"
                        ml={2}
                        color={
                          priceDirection === 'up' 
                            ? 'green.400' 
                            : priceDirection === 'down' 
                              ? 'red.400' 
                              : 'gray.400' // 無變化時使用灰色
                        }
                        fontSize="xs"
                        fontWeight="normal"
                        animation={isPriceChanged ? "fadeInOut 2s" : "none"}
                        sx={{
                          "@keyframes fadeInOut": {
                            "0%": { opacity: 0 },
                            "10%": { opacity: 1 },
                            "90%": { opacity: 1 },
                            "100%": { opacity: 0 }
                          }
                        }}
                      >
                        {priceDirection === 'up' 
                          ? '↑' 
                          : priceDirection === 'down' 
                            ? '↓' 
                            : '-'} {Math.abs(priceChangePercent)}%
                      </Box>
                    )}
                  </Text>
                </Tooltip>
              )}
              
              {isMissingData(price) && (
                <Badge size="xs" colorScheme="red" ml={2}>
                  無資料
                </Badge>
              )}
            </Box>
          </Flex>
          
          <Flex align="center" mb={2}>
            <Text width="60px" textAlign="right" mr={2}>
              金額：
            </Text>
            {isMissingData(price) ? (
              <Text color="gray.400">未知</Text>
            ) : (
              <Text 
                fontWeight="bold"
                color={isPriceChanged 
                  ? priceDirection === 'up' 
                    ? 'green.400' 
                    : priceDirection === 'down' 
                      ? 'red.400' 
                      : 'white'
                  : 'white'
                }
                transition="color 0.3s"
              >
                NT${formatNumber(amount)}
              </Text>
            )}
          </Flex>
          
          <Flex align="center">
            <Text width="60px" textAlign="right" mr={2}>
              比例：
            </Text>
            <Text fontWeight="bold">
              {allocation.toFixed(1)}%
            </Text>
          </Flex>
        </GridItem>
        
        {/* 右側欄 - 進度和報酬率 */}
        <GridItem>
          {/* 所有卡片都顯示年報酬率 */}
          <Box mb={2}>
            <Flex justify="space-between" align="center">
              <Text fontSize="xs" color="gray.400">年報酬：</Text>
              {isMissingData(stock.cagr) ? (
                <Flex align="center">
                  <Text color="gray.400">未知</Text>
                  <Badge size="xs" colorScheme="red" ml={2}>
                    無資料
                  </Badge>
                </Flex>
              ) : (
                <Tooltip
                  hasArrow
                  label="根據過去5年歷史數據計算的複合年增長率 (CAGR)"
                  placement="top"
                                          bg="gray.600"
                        color="white"

                        
                >
                  <Text fontWeight="bold" color="green.400">
                    {stock.cagrPercent || (stock.cagr * 100).toFixed(2)}%
                  </Text>
                </Tooltip>
              )}
            </Flex>
          </Box>
          
          {/* 所有卡片都顯示年貢獻預估 */}
<Box mb={cardType === 'target' ? 4 : 0}>
  <Flex justify="space-between" align="center">
    <Text fontSize="xs" color="gray.400">年貢獻：</Text>
    {isMissingData(stock.cagr) || isMissingData(allocation) ? (
      <Text color="gray.400">未知</Text>
    ) : (
      <Tooltip
        hasArrow
        label={`根據配置比例 (${allocation.toFixed(1)}%) 和預估年報酬率 (${stock.cagrPercent || (stock.cagr * 100).toFixed(2)}%) 計算的投資組合年貢獻`}
        placement="top"
                                bg="gray.600"
                        color="white"

                        
      >
        <Text fontWeight="bold" color="green.400" >
          
          {cardType === 'current' 
            // 使用已經計算好的年貢獻百分比（如果有的話）
            ? (stock.currentYearContributionPercent 
                ? `+${stock.currentYearContributionPercent}%` 
                // 否則動態計算：配置比例 * 年報酬率
                : `+${(allocation * stock.cagr).toFixed(2)}%`)
            // 同樣處理目標年貢獻
            : (stock.yearContributionPercent 
                ? `+${stock.yearContributionPercent}%` 
                : `+${(allocation * stock.cagr).toFixed(2)}%`)
          }
        </Text>
      </Tooltip>
    )}
  </Flex>
</Box>
          
          {/* 進度條（僅在目標卡片中顯示） */}
          {cardType === 'target' && (
            <Box>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="xs" color="gray.400">達成率</Text>
                {targetQuantity <= 0 ? (
                  <Text fontSize="xs" color="gray.400">無法計算</Text>
                ) : (
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={(progress > 100 || progress === 0) ? "red.400" : `${getProgressColorScheme(progress)}.400`}
                  >
                    {progress.toFixed(1)}%
                  </Text>
                )}
              </Flex>
              <Box 
                position="relative" 
                height="8px" 
                width="100%" 
                borderRadius="full" 
                overflow="hidden"
                bg="#4A5568" // 自定義進度條底色，確保在進度為0時也顯示
              >
                {progress > 0 && (
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    height="100%"
                    width={`${progress > 100 ? 100 : progress}%`}
                    bg={`${getProgressColorScheme(progress)}.400`}
                    borderRadius="full"
                    transition="width 0.3s"
                  />
                )}
              </Box>
              {progress > 100 && (
                <Text fontSize="xs" color="red.400" textAlign="right" mt={1}>
                  超出目標 {(progress - 100).toFixed(1)}%
                </Text>
              )}
            </Box>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default InvestmentCard;