// models/Portfolio.js
const mongoose = require('mongoose');

// 定義股票 Schema
const StockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currentQuantity: {
    type: Number,
    default: 0
  },
  targetQuantity: {
    type: Number,
    default: 0
  },
  originalPrice: {
    type: Number
  },
  exchangeRate: {
    type: Number
  },
  // 以下是新增的衍生數值欄位
  currentAmount: {
    type: Number
  },
  targetAmount: {
    type: Number
  },
  currentAllocation: {
    type: Number
  },
  targetAllocation: {
    type: Number
  },
  cagr: {
    type: Number
  },
  cagrPercent: {
    type: String
  },
  currentYearContribution: {
    type: Number
  },
  currentYearContributionPercent: {
    type: String
  },
  yearContribution: {
    type: Number
  },
  yearContributionPercent: {
    type: String
  },
  progress: {
    type: Number
  }
});

// 定義投資組合 Schema
const PortfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  stocks: [StockSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在保存前更新 updatedAt 字段
PortfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);