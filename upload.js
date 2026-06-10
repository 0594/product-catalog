const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 产品图片存储
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, 'products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'product_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + ext);
  }
});

// 轮播图存储
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, 'banners');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'banner_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + ext);
  }
});

function fileFilter(req, file, cb) {
  const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
}

const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('image');

const uploadBannerImage = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('image');

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
}).single('file');

module.exports = { uploadProductImage, uploadBannerImage, uploadExcel };
