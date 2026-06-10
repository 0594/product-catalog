# 🏷️ Product Catalog

一个**免费开源**的在线产品展示系统，适合中小规模（< 5000 SKU）的产品目录、作品集或轻量电商展示。  
无需额外数据库，开箱即用，支持多语言、双价格、Excel 批量导入、实时进度反馈，以及完整的后台管理。

---

## ✨ 核心功能

### 前台展示
- 响应式产品卡片网格，支持按**分类**筛选、**SKU / 名称**搜索
- 顶部轮播图（可在后台开关和自定义）
- 中英文界面切换，分类名称自动跟随语言
- 支持**双价格**显示（如批发价和零售价），可开关或仅显示单一价格
- 产品卡片图片统一 200×200 显示，小图不放大，大图等比缩放
- 点击图片灯箱放大，支持防抖搜索和分页加载
- 网站标题、每页数量、默认产品图片等均可在线动态配置

### 后台管理
- **安全登录**：验证码（纯数字）+ 密码，支持开关验证码，登录状态保持 7 天
- **产品管理**：
  - 单条添加/编辑/删除，支持图片上传和删除
  - 表格内直接编辑（SKU、中英文名、价格、分类），修改后保存
  - 批量修改（价格1、价格2、分类）和**批量删除**
- **Excel 批量导入**：
  - 上传 `.xlsx` 文件导入产品，支持远程图片自动下载并生成缩略图
  - 可视化进度反馈（已读取 / 成功 / 跳过条数）
  - 提供模板下载，支持字段缺失容错
- **分类管理**：中英文分类名，内置“无分类”选项
- **轮播图管理**：上传、排序、删除横幅图片
- **网站设置**：网站标题、每页产品数、价格显示模式（双价格/仅价格1/仅价格2）、默认产品图片、货币符号、验证码开关

### 性能与安全
- 图片自动生成 200×200 缩略图，前端加载迅速
- SQLite WAL 模式，读写并发友好
- 流式解析 Excel，事务批量写入，支持大文件导入
- Helmet 安全头、速率限制、Session 安全管理



## 🛠️ 技术栈

| 类型 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 图片处理 | sharp |
| Excel 导入 | SheetJS (xlsx) |
| 验证码 | svg-captcha (纯数字) |
| 前端 | 原生 HTML/CSS/JS，Swiper 轮播 |
| 部署 | PM2 + Nginx + Let’s Encrypt |



## 📦 项目结构
```markdown
product-catalog/
├── server.js              # 入口文件 (Express 启动、中间件挂载)
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

### 2. 安装依赖
```bash
git clone https://github.com/yourname/product-catalog.git  # 或直接下载源码
cd product-catalog
npm install
以下是完整的部署步骤，适用于本地开发和生产环境（CentOS/Ubuntu/Debian）。

## ✅ 环境要求
Node.js：16.x 或更高版本（推荐 18 LTS）

npm：随 Node.js 自动安装

系统工具：git（可选，用于拉取代码）

（可选）PM2：用于生产环境进程守护

（可选）Nginx：反向代理 + HTTPS

📦 第一步：获取代码
将整个 product-catalog 文件夹上传到服务器，或在服务器上直接创建文件。

推荐目录：/home/youruser/product-catalog 或 /var/www/product-catalog

bash
mkdir -p /var/www/product-catalog
cd /var/www/product-catalog
# 将所有 9 个文件按目录结构放入此处
⚙️ 第二步：安装依赖
在项目根目录下运行：

bash
npm install
如果安装 sharp 或 better-sqlite3 出现编译问题，请确保系统安装了构建工具：

bash
# Debian/Ubuntu
sudo apt update
sudo apt install build-essential python3

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3
🚀 第三步：本地开发启动
直接运行：

bash
node server.js
访问地址：

前台：http://localhost:3000

后台：http://localhost:3000/admin.html

默认密码：admin123

🔧 第四步：修改默认密码（重要！）
编辑 routes.js 文件，找到下面这行并修改：

javascript
// 默认密码 admin123，可在生产环境中修改
if (password === 'admin123') {
将 'admin123' 改为你的强密码。

🛡️ 第五步：生产环境部署（PM2 + Nginx + HTTPS）
1. 使用 PM2 守护进程
全局安装 PM2：

bash
npm install -g pm2
启动应用：

bash
cd /var/www/product-catalog
pm2 start server.js --name product-catalog --watch
pm2 save
pm2 startup   # 设置开机自启，根据提示执行命令
常用命令：

pm2 list：查看进程

pm2 logs product-catalog：查看日志

pm2 restart product-catalog：重启

2. 配置 Nginx 反向代理
安装 Nginx：

bash
# Debian/Ubuntu
sudo apt install nginx

# CentOS
sudo yum install nginx
创建 Nginx 配置文件 /etc/nginx/sites-available/product-catalog：

nginx
server {
    listen 80;
    server_name your-domain.com;   # 替换为你的域名

    client_max_body_size 20M;      # 允许上传 Excel 和图片

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
启用站点并重载 Nginx：

bash
sudo ln -s /etc/nginx/sites-available/product-catalog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
3. 配置 HTTPS（Let's Encrypt）
安装 Certbot：

bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS 8+
sudo dnf install certbot python3-certbot-nginx
获取证书并自动配置：

bash
sudo certbot --nginx -d your-domain.com
证书会自动续期，无需手动操作。

📁 第六步：文件权限与安全建议
bash
# 确保数据库文件可写
chmod 666 /var/www/product-catalog/catalog.db

# public/uploads 目录需要可写
chmod -R 755 /var/www/product-catalog/public/uploads
安全建议：

将 product-catalog 放在 /var/www 下，但不要直接暴露在 Web 根目录。

开启防火墙，仅开放 80 和 443 端口。

定期备份 catalog.db 和 public/uploads 目录。

🌍 第七步：访问与验证
前台：https://your-domain.com

后台：https://your-domain.com/admin.html

登录后台后，先在“网站设置”中调整标题、货币符号等。

导入测试 Excel 模板，验证导入功能。

🔄 更新部署
当代码有更新时，只需：

bash
cd /var/www/product-catalog
git pull   # 或手动覆盖文件
npm install   # 如果依赖有变化
pm2 restart product-catalog
📌 常见问题排查
问题	解决方法
端口被占用	修改 server.js 中的 PORT 变量
SQLite 写入报错	检查 catalog.db 文件权限
图片上传失败	确认 public/uploads 目录存在且可写
验证码显示不出来	确认 svg-captcha 安装正确，检查服务端日志
Excel 导入超时	Nginx 配置中 client_max_body_size 和 proxy_read_timeout 调大
部署完成后，你就拥有了一个完全自托管的产品展示系统，支持多语言、双价格、Excel导入等功能。
├── products.db SQLite 数据库 (自动生成)
├── public/uploads/ 产品原图
├── public/thumbnails/ 缩略图
└── .env.example 环境变量模板 (可选)
