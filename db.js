const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'catalog.db'));

// 启用WAL模式，提高并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_zh TEXT NOT NULL DEFAULT '',
    name_en TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    name_zh TEXT NOT NULL DEFAULT '',
    name_en TEXT NOT NULL DEFAULT '',
    price1 REAL DEFAULT 0,
    price2 REAL DEFAULT 0,
    category_id INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// 默认设置
const defaultSettings = {
  site_title: 'Product Catalog',
  products_per_page: '12',
  price_display: 'both', // both / price1 / price2
  default_image: '/images/no-image.png',
  currency_symbol: '¥',
  captcha_enabled: 'true',
  copyright: '© 2026 Product Catalog. All rights reserved.'   // 新增
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, val] of Object.entries(defaultSettings)) {
  insertSetting.run(key, val);
}

// 辅助函数
function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  return obj;
}

module.exports = { db, getSetting, getAllSettings };
