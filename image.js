const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// 生成200x200缩略图，保存在同目录下以thumb_为前缀
async function generateThumbnail(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  const thumbPath = path.join(dir, 'thumb_' + basename + ext);

  try {
    await sharp(filePath)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .toFile(thumbPath);
    // 返回相对public的路径
    return '/uploads/' + path.relative(path.join(__dirname, 'public', 'uploads'), thumbPath).replace(/\\/g, '/');
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    return filePath.replace(/\\/g, '/').replace('public/', '/');
  }
}

// 下载远程图片并保存到本地 products 目录，返回相对路径和缩略图
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
    const filename = 'remote_' + Date.now() + '_' + Math.round(Math.random() * 1E5) + ext;
    const dir = path.join(__dirname, 'public', 'uploads', 'products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);

    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filePath);
      response.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        const relativePath = '/uploads/products/' + filename;
        resolve(relativePath);
      });
    }).on('error', reject);
  });
}

module.exports = { generateThumbnail, downloadImage };
