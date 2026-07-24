const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) req.user = null;
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
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).render('pages/404', { message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { protect, requireAuth, requireAdmin };