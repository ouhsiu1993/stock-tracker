// db.js
const mongoose = require('mongoose');
require('dotenv').config();

// 從環境變量中獲取連接字串
const MONGODB_URI = process.env.MONGODB_URI;

// 連接到 MongoDB - 移除已棄用的選項
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
    });
    console.log('MongoDB 連接成功...');
  } catch (err) {
    console.error('MongoDB 連接失敗:', err.message);
    // 出現嚴重錯誤時，終止程序
    process.exit(1);
  }
};

module.exports = connectDB;