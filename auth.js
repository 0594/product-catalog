const session = require('express-session');
const { getSetting } = require('./db');

// 配置Session
const sessionMiddleware = session({
  secret: 'product-catalog-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    httpOnly: true,
    sameSite: 'lax'
  }
});

// 登录验证中间件
function requireAuth(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// 检查验证码是否开启
function captchaEnabled() {
  return getSetting('captcha_enabled') === 'true';
}

module.exports = { sessionMiddleware, requireAuth, captchaEnabled };
