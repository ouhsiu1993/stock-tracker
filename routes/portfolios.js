// routes/portfolios.js
const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');

// @route   GET /api/portfolios
// @desc    獲取所有投資組合
// @access  Public
router.get('/', async (req, res) => {
  try {
    // 只返回必要的字段，不包括完整的股票數據
    const portfolios = await Portfolio.find().select('name description createdAt updatedAt');
    res.json(portfolios);
  } catch (err) {
    console.error('獲取投資組合失敗:', err.message);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// @route   GET /api/portfolios/:id
// @desc    獲取單個投資組合
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: '找不到該投資組合' });
    }
    
    res.json(portfolio);
  } catch (err) {
    console.error('獲取單個投資組合失敗:', err.message);
    
    // 檢查是否是 ID 格式錯誤
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: '找不到該投資組合' });
    }
    
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// @route   POST /api/portfolios
// @desc    創建新投資組合
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, description, stocks } = req.body;
    
    // 基本驗證
    if (!name || !stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ error: '無效的投資組合數據' });
    }
    
    // 檢查是否存在同名投資組合
    const existingPortfolio = await Portfolio.findOne({ name });
    if (existingPortfolio) {
      return res.status(400).json({ error: '已存在同名投資組合', existingId: existingPortfolio._id });
    }
    
    // 創建新投資組合
    const newPortfolio = new Portfolio({
      name,
      description,
      stocks
    });
    
    const portfolio = await newPortfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('創建投資組合失敗:', err.message);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// @route   PUT /api/portfolios/:id
// @desc    更新投資組合
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { name, description, stocks } = req.body;
    
    // 基本驗證
    if (!name || !stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ error: '無效的投資組合數據' });
    }
    
    // 檢查是否存在
    let portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: '找不到該投資組合' });
    }
    
    // 檢查是否有其他同名投資組合
    const existingPortfolio = await Portfolio.findOne({ 
      name, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingPortfolio) {
      return res.status(400).json({ error: '已存在同名投資組合', existingId: existingPortfolio._id });
    }
    
    // 更新投資組合
    portfolio.name = name;
    portfolio.description = description || '';
    portfolio.stocks = stocks;
    portfolio.updatedAt = Date.now();
    
    const updatedPortfolio = await portfolio.save();
    res.json(updatedPortfolio);
  } catch (err) {
    console.error('更新投資組合失敗:', err.message);
    
    // 檢查是否是 ID 格式錯誤
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: '找不到該投資組合' });
    }
    
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// @route   DELETE /api/portfolios/:id
// @desc    刪除投資組合
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    // 使用 findByIdAndDelete 方法刪除投資組合
    const deletedPortfolio = await Portfolio.findByIdAndDelete(req.params.id);
    
    if (!deletedPortfolio) {
      return res.status(404).json({ error: '找不到該投資組合' });
    }
    
    // 刪除成功，返回成功消息
    res.json({ 
      message: '投資組合已刪除成功',
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error('刪除投資組合時出錯:', err);
    
    // 檢查是否是 ID 格式錯誤
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: '無效的投資組合 ID 格式' });
    }
    
    // 返回伺服器錯誤
    res.status(500).json({ 
      error: '伺服器錯誤，無法刪除投資組合',
      message: err.message
    });
  }
});


module.exports = router;