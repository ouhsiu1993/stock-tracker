// src/components/SavePortfolioDialog.js - 修復版本
import React, { useState, useEffect } from 'react';
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
  Textarea,
  useToast,
  Box,
  Text,
  Radio,
  RadioGroup,
  Stack,
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 如果是生產環境，使用相對路徑
  : 'http://localhost:3001'; // 開發環境使用本地服務器

const SavePortfolioDialog = ({ 
  isOpen, 
  onClose, 
  stocks, 
  onSaveSuccess 
}) => {
  // 狀態
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveOption, setSaveOption] = useState('new');
  const [existingPortfolios, setExistingPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [processedStocks, setProcessedStocks] = useState([]);
  
  const toast = useToast();
  
  // 當對話框打開時，深度複製股票數據
  useEffect(() => {
    if (isOpen && stocks) {
      // 深度複製以避免引用問題
      const stocksCopy = JSON.parse(JSON.stringify(stocks));
      setProcessedStocks(stocksCopy);
      console.log("SavePortfolioDialog 打開，已複製股票數據:", stocksCopy.length);
    }
  }, [isOpen, stocks]);
  
  // 加載已存在的投資組合
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/portfolios`);
        setExistingPortfolios(response.data);
        console.log("已獲取現有投資組合列表:", response.data.length);
      } catch (error) {
        console.error('獲取投資組合列表失敗:', error);
        toast({
          title: '獲取投資組合列表失敗',
          description: error.response?.data?.error || '發生未知錯誤',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    };
    
    if (isOpen) {
      fetchPortfolios();
    }
  }, [isOpen, toast]);
  
  // 處理提交
  const handleSubmit = async () => {
    // 基本驗證
    if (saveOption === 'new' && !name.trim()) {
      toast({
        title: '請輸入投資組合名稱',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    if (saveOption === 'overwrite' && !selectedPortfolio) {
      toast({
        title: '請選擇要覆蓋的投資組合',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("開始儲存投資組合...");
      console.log("使用 processedStocks 數據:", processedStocks.length);
      
      // 對複製的股票數據進行驗證和豐富
      const enrichedStocks = validateAndEnrichStocks(processedStocks);
      console.log("驗證後的股票數據 (enrichedStocks):", enrichedStocks.length);
      
      let response;
      
      if (saveOption === 'new') {
        // 創建新投資組合
        console.log("創建新投資組合:", { name, description, stocks: enrichedStocks.length });
        response = await axios.post(`${API_BASE_URL}/api/portfolios`, {
          name,
          description,
          stocks: enrichedStocks
        });
        
        console.log("投資組合創建成功:", response.data._id);
        
        toast({
          title: '投資組合已保存',
          description: `已創建新投資組合「${name}」`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
      } else {
        // 覆蓋現有投資組合
        const portfolioToUpdate = existingPortfolios.find(p => p._id === selectedPortfolio);
        
        console.log("覆蓋現有投資組合:", {
          id: selectedPortfolio,
          name: portfolioToUpdate.name,
          description: portfolioToUpdate.description,
          stocks: enrichedStocks.length
        });
        
        response = await axios.put(`${API_BASE_URL}/api/portfolios/${selectedPortfolio}`, {
          name: portfolioToUpdate.name,
          description: portfolioToUpdate.description,
          stocks: enrichedStocks
        });
        
        console.log("投資組合更新成功:", response.data._id);
        
        toast({
          title: '投資組合已更新',
          description: `已更新投資組合「${portfolioToUpdate.name}」`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
      }
      
      if (onSaveSuccess) {
        // 修改：確保正確傳遞完整的投資組合資訊，包括ID
        onSaveSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('保存投資組合失敗:', error);
      console.error('錯誤詳情:', error.response?.data || error.message);
      
      toast({
        title: '保存失敗',
        description: error.response?.data?.error || '發生未知錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 驗證和豐富股票數據，確保所有必要欄位存在
  const validateAndEnrichStocks = (stocksData) => {
    if (!stocksData || !Array.isArray(stocksData) || stocksData.length === 0) {
      console.warn("沒有股票數據可以驗證");
      return [];
    }
    
    console.log("開始驗證股票數據，共 " + stocksData.length + " 條記錄");
    
    // 檢查每支股票是否有完整的衍生值
    return stocksData.map((stock, index) => {
      // 1. 確保所有基本欄位存在
      const validatedStock = {
        // ID 和識別信息
        id: stock.id || `stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: stock.symbol || '',
        name: stock.name || '',
        category: stock.category || '未分類',
        
        // 價格信息
        price: typeof stock.price === 'number' ? stock.price : 0,
        originalPrice: typeof stock.originalPrice === 'number' ? stock.originalPrice : null,
        exchangeRate: typeof stock.exchangeRate === 'number' ? stock.exchangeRate : null,
        
        // 數量信息
        currentQuantity: typeof stock.currentQuantity === 'number' ? stock.currentQuantity : 0,
        targetQuantity: typeof stock.targetQuantity === 'number' ? stock.targetQuantity : 0,
        
        // CAGR 信息
        cagr: typeof stock.cagr === 'number' ? stock.cagr : null,
        cagrPercent: stock.cagrPercent || null,
        
        // 2. 確保所有衍生欄位存在
        // 現況金額和配置
        currentAmount: typeof stock.currentAmount === 'number' ? stock.currentAmount : 
          (typeof stock.price === 'number' && typeof stock.currentQuantity === 'number' ? 
            Math.round(stock.price * stock.currentQuantity) : 0),
        
        currentAllocation: typeof stock.currentAllocation === 'number' ? stock.currentAllocation : 0,
        
        // 目標金額和配置
        targetAmount: typeof stock.targetAmount === 'number' ? stock.targetAmount : 
          (typeof stock.price === 'number' && typeof stock.targetQuantity === 'number' ? 
            Math.round(stock.price * stock.targetQuantity) : 0),
        
        targetAllocation: typeof stock.targetAllocation === 'number' ? stock.targetAllocation : 0,
        
        // 年貢獻率
        currentYearContribution: typeof stock.currentYearContribution === 'number' ? stock.currentYearContribution : 0,
        currentYearContributionPercent: stock.currentYearContributionPercent || '0.00',
        yearContribution: typeof stock.yearContribution === 'number' ? stock.yearContribution : 0,
        yearContributionPercent: stock.yearContributionPercent || '0.00',
        
        // 達成率
        progress: typeof stock.progress === 'number' ? stock.progress : 
          (typeof stock.currentQuantity === 'number' && typeof stock.targetQuantity === 'number' && stock.targetQuantity > 0 ? 
            (stock.currentQuantity / stock.targetQuantity) * 100 : 0)
      };
      
      return validatedStock;
    });
  };
  
  // 清理表單
  const resetForm = () => {
    setName('');
    setDescription('');
    setSaveOption('new');
    setSelectedPortfolio('');
    setProcessedStocks([]);
  };
  
  // 對話框關閉時清理表單
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg="#2D3748" color="white">
        <ModalHeader>儲存投資組合</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* 儲存選項 */}
          <RadioGroup mb={4} value={saveOption} onChange={setSaveOption}>
            <FormLabel>儲存選項</FormLabel>
            <Stack direction="row">
              <Radio value="new" colorScheme="blue">創建新投資組合</Radio>
              <Radio 
                value="overwrite" 
                colorScheme="green"
                isDisabled={existingPortfolios.length === 0}
              >
                覆蓋現有投資組合
              </Radio>
            </Stack>
          </RadioGroup>
          
          <Divider my={4} />
          
          {/* 創建新投資組合 */}
          {saveOption === 'new' && (
            <>
              <FormControl mb={4} isRequired>
                <FormLabel>投資組合名稱</FormLabel>
                <Input 
                  placeholder="例如：我的核心投資組合" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>描述（選填）</FormLabel>
                <Textarea 
                  placeholder="描述此投資組合的策略或目標..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </FormControl>
              
              <Box bg="#1A2035" p={3} borderRadius="md" fontSize="sm">
                <Text fontWeight="bold" mb={2}>將保存的股票：{processedStocks.length} 支</Text>
                <Text fontSize="xs" color="gray.400">
                  保存的數據包括所有股票的代號、名稱、類別、數量、價格以及所有計算衍生的數值（金額、比例、年報酬、年貢獻、達成率等）。
                </Text>
              </Box>
            </>
          )}
          
          {/* 覆蓋現有投資組合 */}
          {saveOption === 'overwrite' && (
            <>
              <FormControl mb={4} isRequired>
                <FormLabel>選擇要覆蓋的投資組合</FormLabel>
                {existingPortfolios.length > 0 ? (
                  <RadioGroup value={selectedPortfolio} onChange={setSelectedPortfolio}>
                    <Stack spacing={3}>
                      {existingPortfolios.map(portfolio => (
                        <Box 
                          key={portfolio._id} 
                          p={3} 
                          borderRadius="md"
                          bg={selectedPortfolio === portfolio._id ? "#3182CE30" : "#1A2035"}
                          borderWidth={selectedPortfolio === portfolio._id ? "1px" : "0"}
                          borderColor="#3182CE"
                        >
                          <Radio value={portfolio._id} colorScheme="blue">
                            <Box>
                              <Text fontWeight="bold">{portfolio.name}</Text>
                              <Text fontSize="xs" color="gray.400">
                                最後更新：{formatDate(portfolio.updatedAt)}
                              </Text>
                            </Box>
                          </Radio>
                        </Box>
                      ))}
                    </Stack>
                  </RadioGroup>
                ) : (
                  <Box p={3} bg="#1A2035" borderRadius="md" textAlign="center">
                    <Text>沒有現有的投資組合</Text>
                  </Box>
                )}
              </FormControl>
              
              <Box bg="#1A2035" p={3} borderRadius="md" fontSize="sm">
                <Text fontWeight="bold" mb={2}>警告</Text>
                <Text fontSize="xs" color="orange.300">
                  覆蓋將使用當前的 {processedStocks.length} 支股票數據替換選定投資組合的所有現有數據。此操作無法撤銷。
                </Text>
              </Box>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme={saveOption === 'new' ? 'blue' : 'green'} 
            mr={3} 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="儲存中..."
          >
            {saveOption === 'new' ? '創建' : '覆蓋'}
          </Button>
          <Button variant="solid" onClick={handleClose}>取消</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SavePortfolioDialog;