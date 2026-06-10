const express = require('express');
const helmet = require('helmet');
const path = require('path');
const { sessionMiddleware } = require('./auth');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全头
app.use(helmet({
  contentSecurityPolicy: false, // 允许加载脚本等
  crossOriginEmbedderPolicy: false
}));

// Session
app.use(sessionMiddleware);

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// API路由
app.use('/api', routes);

// 对于SPA回退（前台和后台各自处理）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 原后台路径 app.get('/admin', (req, res) => {
const { getSetting } = require('./db');   // 放在文件顶部或这里
const adminPath = getSetting('admin_path') || '/admin';
app.get(adminPath, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`✅ 产品展示系统运行在 http://localhost:${PORT}`);
  console.log(`   前台: http://localhost:${PORT}`);
  console.log(`   后台: http://localhost:${PORT}/admin.html`);
});
