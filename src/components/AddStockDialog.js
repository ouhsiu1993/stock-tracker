// src/components/AddStockDialog.js - 完整的新增標的對話框組件
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Stack,
  InputGroup,
  InputRightAddon,
  Text,
  Box,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';

// API 基礎 URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 如果是生產環境，使用相對路徑
  : 'http://localhost:3001'; // 開發環境使用本地服務器

const AddStockDialog = ({ isOpen, onClose, onStockAdd }) => {
  // 狀態
  const [market, setMarket] = useState('tw');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('核心ETF');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [targetQuantity, setTargetQuantity] = useState('0');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  // 驗證股票代碼
  const validateSymbol = async () => {
    if (!symbol.trim()) {
      toast({
        title: '請輸入股票代碼',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // 處理股票符號格式
      let formattedSymbol = symbol.trim();
      
      // 呼叫後端 API 驗證並獲取股票信息
      const response = await axios.post(`${API_BASE_URL}/api/stock-prices`, { 
        symbols: [formattedSymbol] 
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const stockData = response.data.results[0];
        
        if (stockData.price === null || stockData.error) {
          setValidationResult({
            isValid: false,
            message: `無法獲取「${formattedSymbol}」的價格資訊: ${stockData.error || '未知錯誤'}`
          });
        } else {
          // 簡化: 如果股票名稱為空，直接使用股票代碼作為名稱
          if (!name.trim()) {
            setName(formattedSymbol);
          }
          
          setValidationResult({
            isValid: true,
            message: `「${formattedSymbol}」有效，當前價格: NT${stockData.price.toFixed(2)}`,
            data: stockData
          });
        }
      } else {
        setValidationResult({
          isValid: false,
          message: `找不到「${formattedSymbol}」的資訊`
        });
      }
    } catch (error) {
      console.error('驗證股票代碼時發生錯誤:', error);
      setValidationResult({
        isValid: false,
        message: `驗證錯誤: ${error.message}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  // 處理新增標的
  const handleAddStock = async () => {
    // 基本驗證
    if (!symbol.trim()) {
      toast({
        title: '請輸入股票代碼',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    if (!name.trim()) {
      toast({
        title: '請輸入股票名稱',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    if (!category) {
      toast({
        title: '請選擇類別',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 如果還沒有驗證過，進行驗證
      if (!validationResult || !validationResult.isValid) {
        await validateSymbol();
        
        // 等待驗證結果更新
        // 注意：這是異步的，可能需要改進這個邏輯
        if (!validationResult || !validationResult.isValid) {
          throw new Error('請先驗證股票代碼');
        }
      }
      
      // 獲取 CAGR 數據
      const cagrResponse = await axios.post(`${API_BASE_URL}/api/stock-cagr`, { 
        symbols: [symbol.trim()],
        years: 5
      });
      
      let cagrData = null;
      if (cagrResponse.data && cagrResponse.data.results && cagrResponse.data.results.length > 0) {
        cagrData = cagrResponse.data.results[0];
      }
      
      // 創建新股票對象
      const newStock = {
        id: `${symbol.trim()}-${Date.now()}`,
        symbol: symbol.trim(),
        name: name.trim(),
        category,
        price: validationResult.data.price,
        originalPrice: validationResult.data.originalPrice,
        exchangeRate: validationResult.data.exchangeRate,
        currentQuantity: parseInt(currentQuantity) || 0,
        targetQuantity: parseInt(targetQuantity) || 0,
        // CAGR 數據
        cagr: cagrData && cagrData.cagr !== null ? cagrData.cagr : null,
        cagrPercent: cagrData && cagrData.cagrPercent ? cagrData.cagrPercent : null,
      };
      
      // 通知父組件添加新股票
      if (onStockAdd) {
        onStockAdd(newStock);
      }
      
      toast({
        title: '標的已新增',
        description: `已成功新增「${newStock.symbol}（${newStock.name}）」`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('新增標的時發生錯誤:', error);
      toast({
        title: '新增失敗',
        description: error.message || '發生未知錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 清理表單
  const resetForm = () => {
    setMarket('tw');
    setSymbol('');
    setName('');
    setCategory('核心ETF');
    setCurrentQuantity('0');
    setTargetQuantity('0');
    setValidationResult(null);
  };
  
  // 對話框關閉時清理表單
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 獲取標的代碼提示
  const getSymbolPlaceholder = () => {
    if (market === 'tw') {
      return "請輸入台股代號，例如：0050、2330";
    } else if (market === 'us') {
      return "請輸入美股代號，例如：NVDA、AAPL";
    }
    return "請輸入標的，例如：0050、NVDA";
  };

  // 處理股票代碼輸入完成 (支援按 Enter 鍵驗證)
  const handleSymbolKeyDown = (e) => {
    if (e.key === 'Enter') {
      validateSymbol();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg="#2D3748" color="white">
        <ModalHeader>新增標的</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box mb={4} p={3} bg="#1E2A3B" borderRadius="md">
            <Text fontSize="sm">
              請填寫新增標的的相關資訊。系統將自動獲取最新股價和報酬率數據。
            </Text>
          </Box>
          
          <Stack spacing={4}>
            {/* 地區選擇 */}
            <FormControl isRequired>
              <FormLabel>地區</FormLabel>
              <Select 
                placeholder="請選擇地區"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                bg="#1E2A3B"
                color="white"
                borderColor="#4A5568"
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.400" }}
                _placeholder={{ color: "gray.400" }}
                sx={{
                  "& option": {
                    bg: "#2D3748",
                    color: "white"
                  }
                }}
              >
                <option value="tw">台股</option>
                <option value="us">美股</option>
              </Select>
            </FormControl>
            
            {/* 標的代碼輸入 */}
            <FormControl isRequired>
              <FormLabel>標的代碼</FormLabel>
              <InputGroup>
                <Input 
                  placeholder={getSymbolPlaceholder()}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  onKeyDown={handleSymbolKeyDown}
                />
                <InputRightAddon 
                  children={
                    isValidating ? 
                      <Spinner size="sm" color="blue.500" /> : 
                      <Button 
                        size="xs"
                        colorScheme="blue"
                        onClick={validateSymbol}
                        isDisabled={!symbol.trim()}
                      >
                        驗證
                      </Button>
                  }
                  bg="#4A5568" 
                  color="white"
                  px={2}
                />
              </InputGroup>
              {validationResult && (
                <Alert 
                  status={validationResult.isValid ? "success" : "error"}
                  variant="solid"
                  mt={2}
                  size="sm"
                  borderRadius="md"
                >
                  <AlertIcon />
                  {validationResult.message}
                </Alert>
              )}
            </FormControl>
            
            {/* 標的名稱輸入 */}
            <FormControl isRequired>
              <FormLabel>標的名稱</FormLabel>
              <Input 
                placeholder="請輸入名稱，例如：元大台灣50、輝達"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            
            {/* 類別選擇 */}
            <FormControl isRequired>
              <FormLabel>類別</FormLabel>
              <Select 
                placeholder="請選擇類型"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                bg="#1E2A3B"
                color="white"
                borderColor="#4A5568"
                _hover={{ borderColor: "blue.400" }}
                _focus={{ borderColor: "blue.400" }}
                _placeholder={{ color: "gray.400" }}
                sx={{
                  "& option": {
                    bg: "#2D3748",
                    color: "white"
                  }
                }}
              >
                <option value="核心ETF">核心ETF</option>
                <option value="高成長股">高成長股</option>
                <option value="波段操作">波段操作</option>
                <option value="主題型ETF">主題型ETF</option>
                <option value="高股息ETF">高股息ETF</option>
                <option value="待轉出資產">待轉出資產</option>
              </Select>
            </FormControl>
            
            {/* 現有數量輸入 */}
            <FormControl isRequired>
              <FormLabel>現有數量</FormLabel>
              <InputGroup>
                <Input 
                  type="number"
                  placeholder="請輸入目前持有股數"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                />
                <InputRightAddon children="股" bg="#4A5568" color="white" />
              </InputGroup>
            </FormControl>
            
            {/* 目標數量輸入 */}
            <FormControl isRequired>
              <FormLabel>目標數量</FormLabel>
              <InputGroup>
                <Input 
                  type="number"
                  placeholder="請輸入目標持有股數"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                />
                <InputRightAddon children="股" bg="#4A5568" color="white" />
              </InputGroup>
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleAddStock}
            isLoading={isSubmitting}
            loadingText="新增中..."
            isDisabled={isValidating || (validationResult && !validationResult.isValid)}
          >
            新增
          </Button>
          <Button variant="solid" onClick={handleClose}>取消</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddStockDialog;