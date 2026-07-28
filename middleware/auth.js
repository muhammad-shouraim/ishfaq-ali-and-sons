const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.user_token) {
    token = req.cookies.user_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ message: 'Please log in to continue' });
    }
    return res.redirect('/?login=1&redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

module.exports = { protect, requireAuth };