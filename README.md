
# 📦 Product Catalog（产品展示系统）

**免费开源**的在线产品展示系统，适用于中小规模产品目录、作品集或轻量电商展示。  
无需额外数据库，开箱即用，支持多语言、双价格、Excel 批量导入、实时进度反馈和完整的后台管理。

> 🚀 前端响应式设计，后台内联编辑，部署简单，适合个人、团队快速搭建产品展示网站。

---

## ✨ 核心功能

### 🖥️ 前台展示
- **响应式产品卡片网格**：桌面 5 列、平板 3 列、手机 2 列自动适配
- **分类筛选 & 搜索**：按分类过滤，支持 SKU / 名称模糊搜索（防抖）
- **轮播图**：支持后台开关和自定义图片（Swiper 实现）
- **多语言切换**：中/英文界面，分类名称、搜索框提示文字自动跟随语言
- **双价格显示**：可显示批发价和零售价，后台可设置为仅显示单一价格
- **图片灯箱**：点击图片全屏查看，点击背景空白处关闭（无多余按钮）
- **产品卡片优化**：名称两行显示（超出省略），价格与 SKU 同行且 SKU 右对齐
- **占位图防闪烁**：无图片时自动显示灰色 SVG 占位图，避免加载错误
- **分页加载**：每页产品数可在后台动态配置
- **网站标题、货币符号、版权信息**：后台设置，前台即时生效

### ⚙️ 后台管理
- **安全登录**：密码 + 可选验证码（纯数字4位），支持开关验证码
- **产品管理**：
  - **内联添加**：表格上方直接输入产品信息，支持同时上传图片
  - **内联编辑**：双击单元格直接修改（文本/数字/分类下拉），自动保存并刷新
  - **图片管理**：点击缩略图更换图片，独立的“删除图片”按钮
  - **批量操作**：批量删除、批量修改价格/分类
- **Excel 批量导入**：
  - 上传 `.xlsx` 文件，支持远程图片自动下载并生成缩略图
  - 可视化进度反馈（已处理 / 成功 / 跳过）
  - 提供模板下载
- **分类管理**：内联添加/编辑/删除，中英文名称，固定表头滚动
- **轮播图管理**：上传、排序、启用/禁用、删除
- **网站设置**：
  - 网站标题、每页产品数
  - 价格显示模式（双价格/仅价格1/仅价格2）
  - 默认产品图片路径、货币符号
  - 验证码开关、底部版权信息
  - **清除数据库**：三次确认防误删（保留设置）

### 🛡️ 性能与安全
- 图片自动生成 200×200 缩略图，前端加载迅速
- SQLite WAL 模式，读写并发友好
- 流式解析 Excel，事务批量写入，支持大文件导入
- Helmet 安全头、速率限制、Session 安全管理

---

## 🛠️ 技术栈

| 类型 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 图片处理 | sharp |
| Excel 导入 | SheetJS (xlsx) |
| 验证码 | svg-captcha |
| 前端 | 原生 HTML/CSS/JS，Swiper 轮播 |
| 部署 | 支持 PM2 + Nginx + Let’s Encrypt HTTPS |

---

## 📁 项目结构

```
product-catalog/
├── server.js              # 入口文件 (Express 启动、中间件)
├── package.json           # 项目配置与依赖声明
├── db.js                  # SQLite 数据库初始化 (建表、默认设置)
├── auth.js                # 会话管理、登录认证中间件
├── upload.js              # Multer 文件上传配置 (图片/Excel)
├── image.js               # Sharp 缩略图生成、远程图片下载
├── routes.js              # 所有 API 路由 (产品/分类/轮播/设置/导入)
└── public/
    ├── index.html         # 前台产品展示页面
    ├── admin.html         # 后台管理页面
    └── uploads/           # (运行时自动创建) 存放产品图、轮播图及缩略图
        ├── products/
        └── banners/
```

---

## 🚀 快速开始（本地开发）

### 1. 环境要求
- **Node.js** >= 16.x （推荐 18 LTS）
- **npm** （Node.js 自带）

### 2. 获取代码
```bash
git clone https://github.com/0594/product-catalog.git
cd product-catalog
```
> 或直接下载源码包解压

### 3. 安装依赖
```bash
npm install
```

### 4. 启动服务
```bash
node server.js
```

### 5. 访问系统
- 🏠 前台：`http://localhost:3000`
- ⚙️ 后台：`http://localhost:3000/admin.html`
- 🔑 默认密码：`admin123` （**部署后请立即修改！**）

---

## 🔧 生产环境部署

### 1. 修改默认密码
编辑 `routes.js`，搜索 `if (password === 'admin123')`，将 `'admin123'` 改为你的强密码。

### 2. 安装 PM2（进程守护）
```bash
npm install -g pm2
pm2 start server.js --name product-catalog
pm2 save
pm2 startup   # 按提示设置开机自启
```

### 3. 配置 Nginx 反向代理
创建配置文件 `/etc/nginx/sites-available/product-catalog`：
```nginx
server {
    listen 80;
    server_name your-domain.com;      # 替换为你的域名

    client_max_body_size 20M;         # 允许上传 Excel 和大图片

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
启用站点并重载 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/product-catalog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 HTTPS（推荐）
使用 Let’s Encrypt 免费证书：
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# CentOS 8+
sudo dnf install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
证书会自动续期。

### 5. 文件权限
```bash
# 确保数据库可写
chmod 666 /path/to/product-catalog/catalog.db

# uploads 目录可写
chmod -R 755 /path/to/product-catalog/public/uploads
```

### 6. 防火墙
仅开放 HTTP/HTTPS 端口：
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 💾 数据备份
定期备份数据库和上传文件：
```bash
cp /path/to/product-catalog/catalog.db ./backup/
cp -r /path/to/product-catalog/public/uploads ./backup/
```

---

## 🔄 更新系统
```bash
cd /path/to/product-catalog
git pull   # 或手动替换文件
npm install   # 如果依赖有变化
pm2 restart product-catalog
```

---

## ❓ 常见问题

| 问题 | 解决方法 |
|------|----------|
| 端口被占用 | 修改 `server.js` 中的 `PORT` 变量 |
| SQLite 写入错误 | 检查 `catalog.db` 文件权限 |
| 图片上传失败 | 确认 `public/uploads` 目录存在且可写 |
| 验证码不显示 | 检查 `svg-captcha` 依赖是否正确安装 |
| Excel 导入超时 | 增大 Nginx 的 `client_max_body_size` 和 `proxy_read_timeout` |
| 前台图片不显示 | 确保 `default_image` 设置路径有效，或上传图片后测试 |
| 重启后设置丢失 | 确保 `catalog.db` 未被删除，权限可写 |

---

## 📜 开源协议
[MIT License](LICENSE)

---

## 🤝 贡献
欢迎提交 Issue 和 Pull Request！

---

## ⭐ 支持项目
如果这个项目对你有帮助，请点个 Star ⭐ 支持一下！
```
