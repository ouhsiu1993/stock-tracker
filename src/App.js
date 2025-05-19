// src/App.js - 修復重複載入問題的版本
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  useToast,
  HStack,
  Flex,
  useDisclosure,
  Spinner,
  Text,
  Center,
  Spacer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  UnorderedList,
  ListItem,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaCalculator, FaSave, FaFolderOpen,FaPlus } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import InvestmentCard from './components/InvestmentCard';
import SummarySection from './components/SummarySection';
import SavePortfolioDialog from './components/SavePortfolioDialog';
import LoadPortfolioDialog from './components/LoadPortfolioDialog';
import AddStockDialog from './components/AddStockDialog';

// API 基礎 URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 如果是生產環境，使用相對路徑
  : 'http://localhost:3001'; // 開發環境使用本地服務器

function App() {
  // 初始狀態設置為空陣列，不再使用預設的 initialStocks
  const [stocks, setStocks] = useState([]);
  const [currentSummary, setCurrentSummary] = useState({ totalAmount: 0, categories: {} });
  const [targetSummary, setTargetSummary] = useState({ totalAmount: 0, categories: {} });
  const [isLoading, setIsLoading] = useState(true); // 初始設置為 true，表示正在載入數據
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 追蹤是否完成初始載入
  const [userHasManuallyLoaded, setUserHasManuallyLoaded] = useState(false); // 追蹤用戶是否手動載入了投資組合
  const { isOpen: isAddStockOpen, onOpen: onAddStockOpen, onClose: onAddStockClose } = useDisclosure();// 新增標的對話框的狀態
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const cancelRef = React.useRef();
  const [loadedPortfolioName, setLoadedPortfolioName] = useState("");

  // 新增：防止數據覆蓋的鎖，確保更新操作不會覆蓋載入的數據
  const isUpdatingRef = useRef(false);
  // 新增：記錄當前加載的投資組合ID
  const [currentPortfolioId, setCurrentPortfolioId] = useState(null);
  
  const toast = useToast();

  // 保存和載入對話框的狀態
  const { isOpen: isSaveOpen, onOpen: onSaveOpen, onClose: onSaveClose } = useDisclosure();
  const { isOpen: isLoadOpen, onOpen: onLoadOpen, onClose: onLoadClose } = useDisclosure();



  // 計算總金額和類別金額
  const calculateSummary = (stocksData = stocks, shouldUpdateState = true) => {
    if (!stocksData || stocksData.length === 0) {
      // 如果沒有股票數據，返回空的摘要和原數據
      if (shouldUpdateState) {
        setCurrentSummary({ totalAmount: 0, categories: {} });
        setTargetSummary({ totalAmount: 0, categories: {} });
      }
      return stocksData;
    }
    
    console.log("Calculating summary with stocks:", stocksData.length);
    
    document.title = `Stock-Tracker`;
    
    // 計算現況
    const currentTotal = stocksData.reduce((sum, stock) => {
      return sum + Math.round((stock.price || 0) * stock.currentQuantity);
    }, 0);

    const currentCategories = {};
    stocksData.forEach(stock => {
      const amount = Math.round((stock.price || 0) * stock.currentQuantity);
      if (amount > 0) {
        if (!currentCategories[stock.category]) {
          currentCategories[stock.category] = 0;
        }
        currentCategories[stock.category] += amount;
      }
    });

    // 計算目標
    const targetTotal = stocksData.reduce((sum, stock) => {
      return sum + Math.round((stock.price || 0) * stock.targetQuantity);
    }, 0);

    const targetCategories = {};
    stocksData.forEach(stock => {
      const amount = Math.round((stock.price || 0) * stock.targetQuantity);
      if (amount > 0) {
        if (!targetCategories[stock.category]) {
          targetCategories[stock.category] = 0;
        }
        targetCategories[stock.category] += amount;
      }
    });

    // 計算現況的年貢獻
    let currentTotalYearContribution = 0;
    let currentStocksWithContribution = [];
    
    // 更新每個股票的現況年貢獻預估 - 修正計算方式
    stocksData.forEach(stock => {
      if (stock.currentQuantity > 0) {
        const amount = Math.round((stock.price || 0) * stock.currentQuantity);
        const allocation = currentTotal > 0 ? (amount / currentTotal) * 100 : 0;
        
        // 修正：年貢獻 = 配置比例 * 年報酬率
        // 正確公式：allocation/100 * stock.cagr
        const yearContribution = stock.cagr ? ((allocation/100) * stock.cagr) : 0;
        
        // 累加總年貢獻
        currentTotalYearContribution += yearContribution;
        
        // 更新股票物件
        currentStocksWithContribution.push({
          ...stock,
          currentAllocation: allocation,
          currentAmount: amount,
          currentYearContribution: yearContribution,
          currentYearContributionPercent: (yearContribution*100).toFixed(2)
        });
      }
    });
    
    // 計算目標的年貢獻
    let targetTotalYearContribution = 0;
    let targetStocksWithContribution = [];
    
    // 更新每個股票的目標年貢獻預估 - 修正計算方式
    stocksData.forEach(stock => {
      if (stock.targetQuantity > 0) {
        const amount = Math.round((stock.price || 0) * stock.targetQuantity);
        const allocation = targetTotal > 0 ? (amount / targetTotal) * 100 : 0;
        
        // 修正：年貢獻 = 配置比例 * 年報酬率
        // 正確公式：allocation/100 * stock.cagr
        const yearContribution = stock.cagr ? ((allocation/100) * stock.cagr) : 0;
        
        // 累加總年貢獻
        targetTotalYearContribution += yearContribution;
        
        // 更新股票物件
        targetStocksWithContribution.push({
          ...stock,
          targetAllocation: allocation,
          targetAmount: amount,
          yearContribution: yearContribution,
          yearContributionPercent: (yearContribution*100).toFixed(2)
        });
      }
    });
    
    // 合併更新股票數據
    const updatedStocksData = stocksData.map(stock => {
      const currentData = currentStocksWithContribution.find(s => s.id === stock.id);
      const targetData = targetStocksWithContribution.find(s => s.id === stock.id);
      
      // 計算達成率
      const progress = stock.targetQuantity > 0 ? (stock.currentQuantity / stock.targetQuantity) * 100 : 0;
      
      return {
        ...stock,
        // 現況數據
        currentAmount: currentData ? currentData.currentAmount : 0,
        currentAllocation: currentData ? currentData.currentAllocation : 0,
        currentYearContribution: currentData ? currentData.currentYearContribution : 0,
        currentYearContributionPercent: currentData ? currentData.currentYearContributionPercent : '0.00',
        // 目標數據
        targetAmount: targetData ? targetData.targetAmount : 0,
        targetAllocation: targetData ? targetData.targetAllocation : 0,
        yearContribution: targetData ? targetData.yearContribution : 0,
        yearContributionPercent: targetData ? targetData.yearContributionPercent : '0.00',
        // 達成率
        progress: progress
      };
    });
    
    // 更新摘要數據
    if (shouldUpdateState) {
      setCurrentSummary({ 
        totalAmount: currentTotal, 
        categories: currentCategories,
        totalYearContribution: currentTotalYearContribution,
        totalYearContributionPercent: currentTotalYearContribution.toFixed(2)
      });
      
      setTargetSummary({ 
        totalAmount: targetTotal, 
        categories: targetCategories,
        totalYearContribution: targetTotalYearContribution,
        totalYearContributionPercent: targetTotalYearContribution.toFixed(2)
      });
    }
    
    // 返回更新的股票數據，但不直接設置狀態
    return updatedStocksData;
  };

// 獲取最後更新的投資組合
const fetchLastUpdatedPortfolio = async () => {
  // 修改：增加防重複載入的保護邏輯
  if (userHasManuallyLoaded) {
    console.log("用戶已手動載入投資組合，跳過自動載入");
    setIsLoading(false);
    setInitialLoadComplete(true);
    return null;
  }
  
  // 如果正在更新數據，則不進行自動載入
  if (isUpdatingRef.current) {
    console.log("當前正在更新數據，跳過自動載入");
    setIsLoading(false);
    return null;
  }
  
  try {
    console.log("開始嘗試自動載入最近的投資組合");
    // 獲取所有投資組合
    const response = await axios.get(`${API_BASE_URL}/api/portfolios`);
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // 按更新時間排序，獲取最新的一筆
      const portfolios = response.data.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      
      if (portfolios.length > 0) {
        // 檢查是否已載入過此投資組合
        if (currentPortfolioId === portfolios[0]._id) {
          console.log("已載入此投資組合，跳過重複載入");
          setIsLoading(false);
          setInitialLoadComplete(true);
          return null;
        }
        
        // 獲取詳細投資組合數據
        const portfolioDetail = await axios.get(`${API_BASE_URL}/api/portfolios/${portfolios[0]._id}`);
        
        // 載入投資組合（不更新價格，非手動載入）
        handlePortfolioLoad(portfolioDetail.data, false, false,false);
        
        // 自動載入時顯示特定提示，與手動載入區分
        toast({
          title: '已載入投資組合',
          description: `自動載入「${portfolioDetail.data.name}」`,
          status: 'info',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
        
        return portfolioDetail.data;
      }
    } else {
      // 沒有找到投資組合，設置為空
      setStocks([]);
      setIsLoading(false);
      setInitialLoadComplete(true);
      
      toast({
        title: '尚無投資組合',
        description: '請使用「新增」功能創建投資組合',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  } catch (error) {
    console.error('獲取投資組合失敗:', error);
    setIsLoading(false);
    setInitialLoadComplete(true);
    
    toast({
      title: '載入失敗',
      description: '無法獲取最新投資組合，請稍後再試',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  }
  
  return null;
};

  // 修改：初始載入，只在首次渲染時執行一次
  useEffect(() => {
    if (!initialLoadComplete && !userHasManuallyLoaded) {
      console.log("執行首次自動載入邏輯");
      fetchLastUpdatedPortfolio();
    }
  }, [initialLoadComplete, userHasManuallyLoaded]);

  // 修改：當 stocks 變化時重新計算，但避免無限循環
  useEffect(() => {
    if (stocks.length > 0 && !isUpdatingRef.current) {
      console.log("股票數據已更新，重新計算摘要");
      calculateSummary();
    }
  }, [stocks]);

  // 更新現況數量
  const handleCurrentQuantityChange = (stockId, newQuantity) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.id === stockId 
          ? { ...stock, currentQuantity: newQuantity } 
          : stock
      )
    );
  };

  // 更新目標數量
  const handleTargetQuantityChange = (stockId, newQuantity) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.id === stockId 
          ? { ...stock, targetQuantity: newQuantity } 
          : stock
      )
    );
  };

  // 重新計算配置
  const recalculateAllocation = () => {
    if (stocks.length === 0) {
      toast({
        title: '無股票數據',
        description: '請先載入投資組合',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    setIsLoading(true);
    
    // 模擬計算過程的延遲
    setTimeout(() => {
      // 避免重複載入和計算
      isUpdatingRef.current = true;
      
      const updatedStocks = calculateSummary();
      // 在重新計算後更新股票數據
      setStocks(updatedStocks);
      
      setIsLoading(false);
      
      // 釋放鎖
      isUpdatingRef.current = false;
      
      toast({
        title: '配置已更新',
        description: '投資組合已重新計算',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }, 800); // 設定 800ms 的延遲以顯示 loading 效果
  };

  //新增標的
const handleStockAdd = (newStock) => {
  setIsLoading(true);
  
  // 添加新股票到列表，並保存新的股票列表
  setStocks(prevStocks => {
    // 檢查是否已存在相同代碼的股票
    const existingStockIndex = prevStocks.findIndex(stock => stock.symbol === newStock.symbol);
    
    let updatedStocks;
    if (existingStockIndex >= 0) {
      // 如果已存在，則更新該股票
      toast({
        title: '更新現有標的',
        description: `已更新「${newStock.symbol}（${newStock.name}）」的數據`,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      
      updatedStocks = [...prevStocks];
      updatedStocks[existingStockIndex] = {
        ...updatedStocks[existingStockIndex],
        ...newStock,
        id: updatedStocks[existingStockIndex].id // 保留原 ID
      };
    } else {
      // 如果不存在，則添加新股票
      console.log('添加新股票:', newStock);
      updatedStocks = [...prevStocks, newStock];
    }
    
    // 這裡先更新狀態
    return updatedStocks;
  });
  
  // 更新是否已手動載入標記，防止自動載入覆蓋用戶手動添加的內容
  setUserHasManuallyLoaded(true);
  
  // 加入短暫延遲以確保狀態更新
  setTimeout(() => {
    try {
      // 這裡使用函數式更新，確保使用最新的 stocks 值
      setStocks(latestStocks => {
        // 計算衍生值
        const stocksWithCalculations = calculateSummary(latestStocks, true);
        return stocksWithCalculations;
      });
      
      toast({
        title: '標的已新增',
        description: `已添加「${newStock.symbol}（${newStock.name}）」並更新投資組合數據`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('重新計算投資組合時出錯:', error);
      toast({
        title: '計算警告',
        description: '已添加標的，但重新計算投資組合時出錯。請手動點擊「更新比例」按鈕。',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      // 結束載入狀態
      setIsLoading(false);
    }
  }, 500);
};

//刪除標的
// 修改處理刪除的函數 - 這個函數只負責打開確認對話框
const handleDeleteStock = (stockId) => {
  setStockToDelete(stockId);
  setIsDeleteAlertOpen(true);
};

// 添加一個新函數來處理確認刪除
const confirmDelete = () => {
  if (!stockToDelete) return;
  
  setIsLoading(true);
  
  // 找到要刪除的股票以在提示中顯示名稱
  const stockToDeleteInfo = stocks.find(stock => stock.id === stockToDelete);
  
  // 從列表中移除該標的
  setStocks(prevStocks => prevStocks.filter(stock => stock.id !== stockToDelete));
  
  // 短暫延遲以確保狀態更新
  setTimeout(() => {
    // 更新計算
    setStocks(latestStocks => {
      if (latestStocks.length === 0) {
        // 如果刪除後沒有標的，直接返回空數組
        setIsLoading(false);
        return [];
      }
      
      // 重新計算所有衍生值
      const updatedStocks = calculateSummary(latestStocks, true);
      setIsLoading(false);
      return updatedStocks;
    });
    
    // 顯示成功提示
    toast({
      title: '標的已移除',
      description: stockToDeleteInfo ? 
        `已移除「${stockToDeleteInfo.symbol}（${stockToDeleteInfo.name}）」` : 
        '已成功移除此標的',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });
    
    // 關閉確認對話框並清除要刪除的標的
    setIsDeleteAlertOpen(false);
    setStockToDelete(null);
  }, 300);
};

// 添加一個函數處理取消刪除
const cancelDelete = () => {
  setIsDeleteAlertOpen(false);
  setStockToDelete(null);
};

  // 更新股價和CAGR
const updateStockData = async () => {
  if (stocks.length === 0) {
    toast({
      title: '無股票數據',
      description: '請先載入投資組合',
      status: 'warning',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });
    return;
  }
  
  setIsLoading(true);
  
  // 設置更新鎖，防止在更新過程中被其他操作覆蓋
  isUpdatingRef.current = true;
  
  try {
    // 第一步：更新股票價格
    const symbols = stocks.map(stock => stock.symbol);
    
    console.log('開始更新股票價格，股票代碼: ', symbols);
    
    // 呼叫後端 API
    const priceResponse = await axios.post(`${API_BASE_URL}/api/stock-prices`, { symbols });
    
    // 檢查是否獲得結果
    if (priceResponse.data && priceResponse.data.results) {
      const priceResults = priceResponse.data.results;
      const exchangeRate = priceResponse.data.exchangeRate;
      
      console.log(`取得最新匯率: USD 1 = TWD ${exchangeRate.toFixed(2)}`);
      console.log('API返回的價格數據:', priceResponse.data.results.length);
      
      // 只更新價格和匯率，保留其他所有資料，尤其是ID
      const updatedStocks = stocks.map(stock => {
        // 尋找對應的價格結果
        const priceData = priceResults.find(result => result.symbol === stock.symbol);
        
        if (priceData && priceData.price !== null) {
          // 只更新價格相關信息
          return { 
            ...stock, 
            price: priceData.price,
            originalPrice: priceData.originalPrice,
            exchangeRate: priceData.exchangeRate
          };
        } else {
          // 沒有找到價格數據，保留原有數據
          console.warn(`無法獲取 ${stock.symbol} 的價格資料，保留原有數據`);
          return stock;
        }
      });
      
      // 設定更新後的股票數據
      setStocks(updatedStocks);
      
      // 第二步：更新 CAGR 數據
      try {
        console.log('開始更新 CAGR 數據...');
        
        const cagrResponse = await axios.post(`${API_BASE_URL}/api/stock-cagr`, { 
          symbols,
          years: 5 // 使用過去 5 年的數據
        });
        
        console.log('API返回的CAGR數據:', cagrResponse.data.results.length);
        
        if (cagrResponse.data && cagrResponse.data.results) {
          const cagrResults = cagrResponse.data.results;
          
          // 只更新 CAGR 數據，保留其他所有數據
          const stocksWithCAGR = updatedStocks.map(stock => {
            // 尋找對應的 CAGR 結果
            const cagrData = cagrResults.find(result => result.symbol === stock.symbol);
            
            if (cagrData && cagrData.cagr !== null) {
              // 找到了 CAGR 數據，只更新 CAGR 相關欄位
              console.log(`更新 ${stock.symbol} CAGR：${cagrData.cagrPercent}%`);
              
              return { 
                ...stock, 
                cagr: cagrData.cagr,
                cagrPercent: cagrData.cagrPercent,
              };
            } else {
              // 未找到 CAGR 數據，保留原有數據
              return stock;
            }
          });
          
          // 設定更新後的股票數據
          setStocks(stocksWithCAGR);
        }
      } catch (cagrError) {
        console.error('更新 CAGR 時發生錯誤:', cagrError);
        // 即使 CAGR 更新失敗，仍繼續使用已更新的價格
      }
      
      // 重新計算配置 - 不使用 setTimeout，直接計算
      const updatedStocksWithCalculations = calculateSummary(
        // 確保使用當前最新的股票數據
        stocks, 
        // 直接更新狀態
        true 
      );
      
      // 更新股票數據
      setStocks(updatedStocksWithCalculations);
      
      toast({
        title: '數據已更新',
        description: `股價與報酬率已重新計算`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      
      setIsLoading(false);
      
      // 釋放更新鎖
      isUpdatingRef.current = false;
    } else {
      throw new Error('從 API 獲取的數據格式不正確');
    }
  } catch (error) {
    console.error('更新數據時發生錯誤:', error);
    
    toast({
      title: '更新失敗',
      description: `無法取得最新數據：${error.message}`,
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
    
    setIsLoading(false);
    
    // 釋放更新鎖
    isUpdatingRef.current = false;
  }
};

  // 處理投資組合加載
const handlePortfolioLoad = (portfolio, shouldUpdatePrices = false, isManualLoad = false, skipToast = false) => {
  if (!portfolio || !portfolio.stocks || !Array.isArray(portfolio.stocks)) {
    toast({
      title: '載入失敗',
      description: '投資組合數據格式不正確',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
    return;
  }

  // 設置更新鎖，防止在載入過程中被其他操作覆蓋
  isUpdatingRef.current = true;

  // 如果是手動載入，標記以防止自動載入覆蓋
  if (isManualLoad) {
    console.log("手動載入投資組合，設置保護標記");
    setUserHasManuallyLoaded(true);
  }
  
  // 記錄當前投資組合ID，避免重複載入
  if (portfolio._id) {
    console.log(`載入投資組合ID: ${portfolio._id}`);
    setCurrentPortfolioId(portfolio._id);
    setLoadedPortfolioName(portfolio.name || "未命名投資組合");
  }

  // 驗證每個股票物件的結構完整性，保留所有儲存的衍生數值
  const validatedStocks = portfolio.stocks.map(stock => {
    // 確保所有必要屬性存在
    return {
      id: stock.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
      symbol: stock.symbol || "未知",
      name: stock.name || "未知股票",
      category: stock.category || "未分類",
      price: stock.price !== undefined && stock.price !== null ? parseFloat(stock.price) : undefined,
      originalPrice: stock.originalPrice !== undefined && stock.originalPrice !== null ? parseFloat(stock.originalPrice) : undefined,
      exchangeRate: stock.exchangeRate !== undefined && stock.exchangeRate !== null ? parseFloat(stock.exchangeRate) : undefined,
      currentQuantity: stock.currentQuantity !== undefined ? parseInt(stock.currentQuantity) : 0,
      targetQuantity: stock.targetQuantity !== undefined ? parseInt(stock.targetQuantity) : 0,
      cagr: stock.cagr !== undefined && stock.cagr !== null ? parseFloat(stock.cagr) : undefined,
      cagrPercent: stock.cagrPercent || undefined,
      
      // 保留所有衍生數值，如果有的話
      currentAmount: stock.currentAmount !== undefined ? parseFloat(stock.currentAmount) : undefined,
      targetAmount: stock.targetAmount !== undefined ? parseFloat(stock.targetAmount) : undefined,
      currentAllocation: stock.currentAllocation !== undefined ? parseFloat(stock.currentAllocation) : undefined,
      targetAllocation: stock.targetAllocation !== undefined ? parseFloat(stock.targetAllocation) : undefined,
      currentYearContribution: stock.currentYearContribution !== undefined ? parseFloat(stock.currentYearContribution) : undefined,
      currentYearContributionPercent: stock.currentYearContributionPercent || undefined,
      yearContribution: stock.yearContribution !== undefined ? parseFloat(stock.yearContribution) : undefined,
      yearContributionPercent: stock.yearContributionPercent || undefined,
      progress: stock.progress !== undefined ? parseFloat(stock.progress) : undefined,
      
      isLoaded: true // 添加載入標記
    };
  });
  
  console.log('載入投資組合，驗證後的股票數量：', validatedStocks.length);
  
  // 更新股票數據
  setStocks(validatedStocks);
  setInitialLoadComplete(true);

  // 一段時間後清除載入標記
  setTimeout(() => {
    setStocks(prevStocks => 
      prevStocks.map(stock => ({
        ...stock,
        isLoaded: false
      }))
    );
  }, 500);
  
  // 重新計算配置
  setTimeout(() => {
    const calculatedStocks = calculateSummary(validatedStocks);
    setStocks(calculatedStocks);
    setIsLoading(false);
    
    // 釋放更新鎖
    isUpdatingRef.current = false;
    
    // 顯示成功訊息 - 修改：不需要判斷 isManualLoad，統一在這裡顯示提示
    // 此改變確保從 LoadPortfolioDialog 和自動載入時都有一致的提示
    if (isManualLoad && !skipToast) {
      toast({
        title: '投資組合已載入',
        description: `已載入「${portfolio.name}」(${portfolio.stocks.length} 支股票)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
    // 如果是自動載入，提示已經在 fetchLastUpdatedPortfolio 中處理
  }, 300);
};
  
  // 計算配置百分比
  const calculateAllocation = (stockId, type) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return 0;
    
    const amount = (stock.price || 0) * (type === 'current' ? stock.currentQuantity : stock.targetQuantity);
    const totalAmount = type === 'current' ? currentSummary.totalAmount : targetSummary.totalAmount;
    
    return totalAmount > 0 ? (amount / totalAmount * 100) : 0;
  };
  
  // 在儲存前重新計算投資組合
  const handleSaveClick = () => {
    if (stocks.length === 0) {
      toast({
        title: '無股票數據',
        description: '請先載入或建立投資組合',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    // 設置更新鎖，防止在儲存過程中被其他操作覆蓋
    isUpdatingRef.current = true;
    
    // 先重新計算所有值以確保數據最新
    console.log("開始準備儲存，重新計算所有值...");
    const updatedStocks = calculateSummary();
    
    // 手動更新狀態並確保在開啟對話框前完成
    setStocks(updatedStocks);
    console.log("儲存前更新股票數據:", updatedStocks.length);
    
    // 延遲一點開啟對話框，確保狀態更新完成
    setTimeout(() => {
      setIsLoading(false);
      
      // 釋放更新鎖
      isUpdatingRef.current = false;
      
      onSaveOpen();
    }, 300);
  };

  // 渲染載入中狀態
  if (isLoading && !initialLoadComplete) {
    return (
      <Container maxW="container.xl" py={8} bg="#1A202C" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Center flexDirection="column">
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" mb={4} />
          <Text color="white" fontSize="lg">載入投資組合中...</Text>
        </Center>
      </Container>
    );
  }

  // 渲染沒有股票時的空狀態
const renderEmptyState = () => {
  if (stocks.length === 0) {
    return (
      <Center flexDirection="column" p={10} bg="#2D3748" borderRadius="lg" mt={4}>
        <Text color="white" fontSize="xl" mb={4}>沒有投資組合數據</Text>
        <Text color="gray.400" mb={6}>您可以載入現有投資組合或創建新的投資組合</Text>
        <HStack spacing={4}>
          <Button 
            leftIcon={<FaFolderOpen />}
            colorScheme="teal" 
            size="md"
            onClick={onLoadOpen}
          >
            載入現有投資組合
          </Button>
          <Button 
            leftIcon={<FaPlus />}
            colorScheme="green" 
            size="md"
            onClick={onAddStockOpen}
          >
            新增標的
          </Button>
        </HStack>
      </Center>
    );
  }
  
  return null;
};

  return (
    <Container maxW="container.xl" py={8} bg="#1A202C" minH="100vh">
      <Flex justify="space-between" align="center" mb={8}>
  <Flex align="center">
    <Heading color="white" mr={3}>投資組合追蹤器</Heading>
    {currentPortfolioId && (
      <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="md">
        {loadedPortfolioName}
      </Badge>
    )}
  </Flex>
  
  <HStack spacing={2}>
    {/* 原有的按鈕 */}
    <Button 
      leftIcon={<FaFolderOpen />}
      colorScheme="teal" 
      size="md"
      onClick={onLoadOpen}
    >
      載入
    </Button>
    
    <Button 
      leftIcon={<FaSave />}
      colorScheme="purple" 
      size="md"
      onClick={handleSaveClick}
      isDisabled={stocks.length === 0}
    >
      儲存
    </Button>
  </HStack>
</Flex>
      
      <Box textAlign="center" mb={4}>
  <Flex align="center" justify="center">
    {/* 新增：新增標的按鈕，靠左對齊 */}
    <Button 
      leftIcon={<FaPlus />}
      colorScheme="green" 
      size="md"
      onClick={onAddStockOpen}
      mr="auto"
    >
      新增標的
    </Button>
    
    <Spacer />
    
    {/* 原有的按鈕，保持靠右對齊 */}
    <Button 
      colorScheme="blue" 
      size="md"
      onClick={recalculateAllocation}
      isLoading={isLoading}
      loadingText="更新中..."
      mr={2}
      leftIcon={<FaCalculator />}
      isDisabled={stocks.length === 0}
    >
      更新比例
    </Button>
    <Button 
      colorScheme="blue" 
      size="md"
      onClick={updateStockData}
      isLoading={isLoading}
      loadingText="更新中..."
      leftIcon={<FiRefreshCw />}
      isDisabled={stocks.length === 0}
    >
      更新數據
    </Button>
  </Flex>
</Box>
      
      {/* 渲染空狀態或股票卡片 */}
      {renderEmptyState() || (
        <Box>
          <SimpleGrid columns={2} spacing={6}>
            <VStack align="stretch">
              <Heading size="md" textAlign="center" p={2} bg="" color="white" borderRadius="" boxShadow="">
                現況
              </Heading>
              {stocks.map(stock => (
                <InvestmentCard
                  key={`full-current-${stock.id}`}
                  stock={stock}
                  cardType="current"
                  quantity={stock.currentQuantity}
                  onQuantityChange={handleCurrentQuantityChange}
                  allocation={calculateAllocation(stock.id, 'current')}
                  isLoading={isLoading}
                  isLoaded={stock.isLoaded}
                  onDelete={handleDeleteStock}
                />
              ))}
            </VStack>
            
            <VStack align="stretch">
              <Heading size="md" textAlign="center" p={2} bg="" color="white" borderRadius="" boxShadow="">
                目標
              </Heading>
              {stocks.map(stock => (
                <InvestmentCard
                  key={`full-target-${stock.id}`}
                  stock={stock}
                  cardType="target"
                  quantity={stock.targetQuantity}
                  onQuantityChange={handleTargetQuantityChange}
                  allocation={calculateAllocation(stock.id, 'target')}
                  isLoading={isLoading}
                  isLoaded={stock.isLoaded}
                  onDelete={handleDeleteStock}
                />
              ))}
            </VStack>
          </SimpleGrid>
        </Box>
      )}
      
      {stocks.length > 0 && (
        <SummarySection 
          currentData={currentSummary} 
          targetData={targetSummary}
          stocks={stocks}
          isLoading={isLoading}
        />
      )}
      
      {/* 對話框組件 */}
      <SavePortfolioDialog 
        isOpen={isSaveOpen} 
        onClose={onSaveClose} 
        stocks={stocks}
        onSaveSuccess={(savedPortfolio) => {
          console.log('Portfolio saved successfully:', savedPortfolio);
          // 更新當前投資組合ID
          if (savedPortfolio._id) {
            setCurrentPortfolioId(savedPortfolio._id);
          }
        }}
      />
      
      <LoadPortfolioDialog 
        isOpen={isLoadOpen} 
        onClose={onLoadClose} 
        onPortfolioLoad={handlePortfolioLoad}
      />

      {/* 新增：新增標的對話框 */}
<AddStockDialog 
  isOpen={isAddStockOpen} 
  onClose={onAddStockClose}
  onStockAdd={handleStockAdd}
/>

{/* 刪除確認對話框 */}
<AlertDialog
  isOpen={isDeleteAlertOpen}
  leastDestructiveRef={cancelRef}
  onClose={cancelDelete}
>
  <AlertDialogOverlay>
    <AlertDialogContent bg="#2D3748" color="white">
      <AlertDialogHeader fontSize="lg" fontWeight="bold">
        刪除投資標的
      </AlertDialogHeader>

      <AlertDialogBody>
        {stockToDelete && (
          <>
            <Text mb={4}>
              您即將從投資組合中刪除以下標的：
            </Text>
            
            <Box 
              p={3} 
              mb={4} 
              bg="#1E2A3B" 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderColor="red.500"
            >
              <Text fontWeight="bold" fontSize="lg">
                {stocks.find(stock => stock.id === stockToDelete)?.symbol} 
                （{stocks.find(stock => stock.id === stockToDelete)?.name}）
              </Text>
              
              <Text fontSize="sm" color="gray.400" mt={1}>
                類別：{stocks.find(stock => stock.id === stockToDelete)?.category}
              </Text>
              
              {/* 顯示當前數量和目標數量 */}
              {(() => {
                const stock = stocks.find(s => s.id === stockToDelete);
                if (stock) {
                  return (
                    <Flex mt={2} fontSize="sm">
                      <Text mr={4}>現況數量：{stock.currentQuantity} 股</Text>
                      <Text>目標數量：{stock.targetQuantity} 股</Text>
                    </Flex>
                  );
                }
                return null;
              })()}
            </Box>
            
            <Box p={3} bg="#2A3749" borderRadius="md" mb={4}>
              <Text fontSize="sm" mb={2} fontWeight="bold">
                刪除將會：
              </Text>
              <UnorderedList fontSize="sm" spacing={1}>
                <ListItem>從現況和目標視圖中同時移除此標的</ListItem>
                <ListItem>重新計算投資組合的配置比例和年貢獻率</ListItem>
                <ListItem>在儲存後，此標的將永久從投資組合中移除</ListItem>
              </UnorderedList>
            </Box>
            
            <Alert status="warning" variant="solid" borderRadius="md">
              <AlertIcon />
              此操作無法撤銷，請確認您的決定。
            </Alert>
          </>
        )}
      </AlertDialogBody>

      <AlertDialogFooter>
        <Button ref={cancelRef} onClick={cancelDelete}>
          取消
        </Button>
        <Button colorScheme="red" onClick={confirmDelete} ml={3}>
          確認刪除
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialogOverlay>
</AlertDialog>
    </Container>
  );
}

export default App;