const express = require('express');
const router = express.Router();
const { db, getSetting, getAllSettings } = require('./db');
const { requireAuth, captchaEnabled } = require('./auth');
const { uploadProductImage, uploadBannerImage, uploadExcel } = require('./upload');
const { generateThumbnail, downloadImage } = require('./image');
const svgCaptcha = require('svg-captcha');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ====================== 验证码 ======================
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1il',
    noise: 2,
    color: true,
    background: '#f0f0f0'
  });
  req.session.captcha = captcha.text.toLowerCase();
  res.type('svg');
  res.status(200).send(captcha.data);
});

// ====================== 登录 ======================
router.post('/login', (req, res) => {
  const { password, captcha } = req.body;
  const needCaptcha = captchaEnabled();

  if (needCaptcha) {
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
      return res.status(400).json({ error: '验证码错误' });
    }
  }

  // 默认密码 admin123，可在生产环境中修改
  if (password === 'admin123') {
    req.session.isLoggedIn = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/check-auth', (req, res) => {
  res.json({ loggedIn: !!req.session.isLoggedIn });
});

// ====================== 分类管理 ======================
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json(categories);
});

router.post('/categories', requireAuth, (req, res) => {
  const { name_zh, name_en } = req.body;
  const stmt = db.prepare('INSERT INTO categories (name_zh, name_en) VALUES (?, ?)');
  const result = stmt.run(name_zh || '', name_en || '');
  res.json({ id: result.lastInsertRowid });
});

router.put('/categories/:id', requireAuth, (req, res) => {
  const { name_zh, name_en } = req.body;
  db.prepare('UPDATE categories SET name_zh = ?, name_en = ? WHERE id = ?')
    .run(name_zh, name_en, req.params.id);
  res.json({ success: true });
});

router.delete('/categories/:id', requireAuth, (req, res) => {
  // 将使用该分类的产品归为无分类
  db.prepare('UPDATE products SET category_id = 0 WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ====================== 产品管理 ======================
   //产品列表
router.get('/products', (req, res) => {
  const { category, search, page = 1, limit: limitParam } = req.query;
  const limit = parseInt(limitParam) || parseInt(getSetting('products_per_page')) || 12;
  const offset = (parseInt(page) - 1) * limit;

  let where = '1=1';
  const params = [];
  if (category && category !== 'all') {
    where += ' AND category_id = ?';
    params.push(category);
  }
  if (search) {
    where += ' AND (sku LIKE ? OR name_zh LIKE ? OR name_en LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM products WHERE ${where}`);
  const total = countStmt.get(...params).total;

  const dataStmt = db.prepare(`SELECT * FROM products WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`);
  const products = dataStmt.all(...params, limit, offset);

  res.json({ products, total, page: parseInt(page), limit });
});

// Excel 模板下载
router.get('/products/template', (req, res) => {
  const template = [
    { SKU: 'DEMO-001', 中文名称: '示例产品', 英文名称: 'Sample Product', 价格1: 100, 价格2: 80, 分类ID: 1, 图片: 'https://example.com/img.jpg' }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

router.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

router.post('/products', requireAuth, (req, res) => {
  uploadProductImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { sku, name_zh, name_en, price1, price2, category_id } = req.body;
    let imagePath = '';

    if (req.file) {
      const rawPath = '/uploads/products/' + req.file.filename;
      imagePath = await generateThumbnail(path.join(__dirname, 'public', rawPath));
    }

    const stmt = db.prepare('INSERT INTO products (sku, name_zh, name_en, price1, price2, category_id, image) VALUES (?,?,?,?,?,?,?)');
    const result = stmt.run(sku, name_zh || '', name_en || '', price1 || 0, price2 || 0, category_id || 0, imagePath);
    res.json({ id: result.lastInsertRowid, image: imagePath });
  });
});

router.put('/products/:id', requireAuth, (req, res) => {
  uploadProductImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { sku, name_zh, name_en, price1, price2, category_id, remove_image } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    let imagePath = product.image;
    if (remove_image === 'true') {
      imagePath = '';
    }
    if (req.file) {
      const rawPath = '/uploads/products/' + req.file.filename;
      imagePath = await generateThumbnail(path.join(__dirname, 'public', rawPath));
    }

    db.prepare('UPDATE products SET sku=?, name_zh=?, name_en=?, price1=?, price2=?, category_id=?, image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(sku, name_zh, name_en, price1, price2, category_id, imagePath, req.params.id);
    res.json({ success: true, image: imagePath });
  });
});

router.delete('/products/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 批量更新
router.put('/products/batch/update', requireAuth, (req, res) => {
  const { ids, price1, price2, category_id } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No ids provided' });

  const updateParts = [];
  const params = [];
  if (price1 !== undefined) { updateParts.push('price1 = ?'); params.push(price1); }
  if (price2 !== undefined) { updateParts.push('price2 = ?'); params.push(price2); }
  if (category_id !== undefined) { updateParts.push('category_id = ?'); params.push(category_id); }
  if (updateParts.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updateParts.push('updated_at = CURRENT_TIMESTAMP');
  const placeholders = ids.map(() => '?').join(',');
  params.push(...ids);
  db.prepare(`UPDATE products SET ${updateParts.join(', ')} WHERE id IN (${placeholders})`).run(...params);
  res.json({ success: true });
});

router.delete('/products/batch/delete', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No ids provided' });
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
  res.json({ success: true });
});

// ====================== Excel 导入 (SSE) - 修正版 ======================
router.post('/products/import', requireAuth, async (req, res) => {
  try {
    uploadExcel(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      // 设置 SSE 响应头
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const total = rows.length;
      let processed = 0;
      let success = 0;
      let skipped = 0;

      // 先预处理所有行，下载远程图片
      const productsToInsert = [];
      for (const row of rows) {
        const sku = String(row['SKU'] || row['sku'] || '').trim();
        if (!sku) {
          skipped++;
          processed++;
          continue;
        }

        const nameZh = row['中文名称'] || row['name_zh'] || '';
        const nameEn = row['英文名称'] || row['name_en'] || '';
        const price1 = parseFloat(row['价格1'] || row['price1'] || 0);
        const price2 = parseFloat(row['价格2'] || row['price2'] || 0);
        const categoryId = parseInt(row['分类ID'] || row['category_id'] || 0) || 0;
        let image = '';

        const imgVal = String(row['图片'] || row['image'] || '').trim();
        if (imgVal && (imgVal.startsWith('http://') || imgVal.startsWith('https://'))) {
          try {
            const relativePath = await downloadImage(imgVal);
            image = await generateThumbnail(
              path.join(__dirname, 'public', relativePath)
            );
          } catch (e) {
            // 下载失败，图片留空
            image = '';
          }
        }

        productsToInsert.push([sku, nameZh, nameEn, price1, price2, categoryId, image]);
        processed++;
        success++; // 先预标记为成功，最终事务写入可能失败

        // 每处理 10 条发送进度
        if (processed % 10 === 0 || processed === total) {
          res.write(
            `data: ${JSON.stringify({ total, processed, success, skipped })}\n\n`
          );
        }
      }

      // 事务批量插入
      const insertStmt = db.prepare(
        'INSERT INTO products (sku, name_zh, name_en, price1, price2, category_id, image) VALUES (?,?,?,?,?,?,?)'
      );

      let realSuccess = 0;
      const transaction = db.transaction(() => {
        for (const item of productsToInsert) {
          try {
            insertStmt.run(...item);
            realSuccess++;
          } catch (e) {
            // 某条失败则计入跳过
            skipped++;
          }
        }
      });

      try {
        transaction();
        success = realSuccess;
        processed = total;
        res.write(
          `data: ${JSON.stringify({ total, processed, success, skipped, done: true })}\n\n`
        );
      } catch (e) {
        res.write(
          `data: ${JSON.stringify({ error: e.message, done: true })}\n\n`
        );
      }
      res.end();
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// ====================== 轮播图管理 ======================
router.get('/banners', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY sort_order, id').all();
  res.json(banners);
});

router.post('/banners', requireAuth, (req, res) => {
  uploadBannerImage(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { sort_order, enabled } = req.body;
    const imagePath = '/uploads/banners/' + req.file.filename;
    db.prepare('INSERT INTO banners (image, sort_order, enabled) VALUES (?,?,?)')
      .run(imagePath, sort_order || 0, enabled !== undefined ? enabled : 1);
    res.json({ success: true });
  });
});

router.put('/banners/:id', requireAuth, (req, res) => {
  const { sort_order, enabled } = req.body;
  db.prepare('UPDATE banners SET sort_order=?, enabled=? WHERE id=?')
    .run(sort_order, enabled, req.params.id);
  res.json({ success: true });
});

router.delete('/banners/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ====================== 网站设置 ======================
router.get('/settings', (req, res) => {
  res.json(getAllSettings());
});

router.put('/settings', requireAuth, (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(req.body)) {
    stmt.run(key, String(value));
  }
  res.json({ success: true });
});

module.exports = router;
