// src/components/LoadPortfolioDialog.js - 修改版本
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
  useToast,
  Box,
  Text,
  Stack,
  Flex,
  IconButton,
  Divider,
  Spinner,
  RadioGroup,
  Radio,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 如果是生產環境，使用相對路徑
  : 'http://localhost:3001'; // 開發環境使用本地服務器

const LoadPortfolioDialog = ({ 
  isOpen, 
  onClose, 
  onPortfolioLoad
}) => {
  // 狀態
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  
  const toast = useToast();
  const cancelRef = React.useRef();

  // 加載投資組合列表
  const fetchPortfolios = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/portfolios`);
      setPortfolios(response.data);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // 當對話框打開時獲取列表
  useEffect(() => {
    if (isOpen) {
      fetchPortfolios();
    } else {
      setSelectedPortfolio('');
    }
  }, [isOpen]);
  
  // 處理加載投資組合 - 移除成功提示，由 App.js 統一處理
  const handleLoadPortfolio = async () => {
    if (!selectedPortfolio) {
      toast({
        title: '請選擇一個投資組合',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    
    setIsLoadingPortfolio(true);
    
    try {
      console.log(`開始載入投資組合ID: ${selectedPortfolio}`);
      const response = await axios.get(`${API_BASE_URL}/api/portfolios/${selectedPortfolio}`);
      
      if (onPortfolioLoad) {
        // 始終設為手動載入，並且永不自動更新股價
        onPortfolioLoad(response.data, false, true);
        console.log(`投資組合「${response.data.name}」已成功手動載入`);
      }
      
      // 移除這裡的成功提示，由 App.js 統一處理
      // toast({ ... }); // 已移除
      
      onClose();
    } catch (error) {
      console.error('加載投資組合失敗:', error);
      toast({
        title: '加載失敗',
        description: error.response?.data?.error || '發生未知錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoadingPortfolio(false);
    }
  };
  
  // 開啟刪除確認
  const openDeleteConfirm = (portfolio, e) => {
    e.stopPropagation(); // 防止選中 Radio
    setPortfolioToDelete(portfolio);
    setIsDeleteConfirmOpen(true);
  };
  
  // 處理刪除投資組合
  const handleDeletePortfolio = async () => {
    if (!portfolioToDelete) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/portfolios/${portfolioToDelete._id}`);
      
      // 更新列表
      setPortfolios(portfolios.filter(p => p._id !== portfolioToDelete._id));
      
      // 如果刪除的是當前選中的，重置選擇
      if (selectedPortfolio === portfolioToDelete._id) {
        setSelectedPortfolio('');
      }
      
      toast({
        title: '投資組合已刪除',
        description: `已刪除投資組合「${portfolioToDelete.name}」`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('刪除投資組合失敗:', error);
      toast({
        title: '刪除失敗',
        description: error.response?.data?.error || '發生未知錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setPortfolioToDelete(null);
    }
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
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="#2D3748" color="white">
          <ModalHeader>載入投資組合</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoading ? (
              <Flex justify="center" align="center" direction="column" py={10}>
                <Spinner size="xl" mb={4} color="blue.400" />
                <Text>正在獲取投資組合列表...</Text>
              </Flex>
            ) : portfolios.length > 0 ? (
              <Box>
                <Text mb={4}>選擇要載入的投資組合：</Text>
                
                <RadioGroup value={selectedPortfolio} onChange={setSelectedPortfolio}>
                  <Stack spacing={3}>
                    {portfolios.map(portfolio => (
                      <Box 
                        key={portfolio._id} 
                        p={3} 
                        borderRadius="md"
                        bg={selectedPortfolio === portfolio._id ? "#3182CE30" : "#1A2035"}
                        borderWidth={selectedPortfolio === portfolio._id ? "1px" : "0"}
                        borderColor="#3182CE"
                      >
                        <Flex justify="space-between" align="center">
                          <Radio value={portfolio._id} colorScheme="blue">
                            <Box>
                              <Text fontWeight="bold">{portfolio.name}</Text>
                              <Text fontSize="xs" color="gray.400">
                                最後更新：{formatDate(portfolio.updatedAt)}
                              </Text>
                              {portfolio.description && (
                                <Text fontSize="sm" mt={1} color="gray.300">
                                  {portfolio.description}
                                </Text>
                              )}
                            </Box>
                          </Radio>
                          
                          <IconButton
                            aria-label="刪除投資組合"
                            icon={<DeleteIcon />}
                            size="md"
                            colorScheme="red"
                            variant="ghost"
                                    opacity="0.7"
        _hover={{ 
          opacity: "1",
          bg: "#4A5568"
        }}
                            onClick={(e) => openDeleteConfirm(portfolio, e)}
                          />
                        </Flex>
                      </Box>
                    ))}
                  </Stack>
                </RadioGroup>
                
                <Box mt={4} pt={2} borderTopWidth="1px" borderColor="gray.600">
                  <Text fontSize="sm" color="gray.400">
                    載入後，您可以使用「更新數據」按鈕手動更新股價。
                  </Text>
                </Box>
              </Box>
            ) : (
              <Box textAlign="center" py={10}>
                <Text mb={4}>沒有已儲存的投資組合</Text>
                <Text fontSize="sm" color="gray.400">
                  請先使用儲存功能創建投資組合
                </Text>
              </Box>
            )}
            
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={handleLoadPortfolio}
              isDisabled={!selectedPortfolio || portfolios.length === 0}
              isLoading={isLoadingPortfolio}
              loadingText="載入中..."
            >
              載入
            </Button>
            <Button variant="solid" onClick={onClose}>取消</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 刪除確認對話框 */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="#2D3748" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              刪除投資組合
            </AlertDialogHeader>

            <AlertDialogBody>
              確定要刪除投資組合「{portfolioToDelete?.name}」嗎？此操作無法撤銷。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteConfirmOpen(false)}>
                取消
              </Button>
              <Button colorScheme="red" onClick={handleDeletePortfolio} ml={3}>
                刪除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default LoadPortfolioDialog;