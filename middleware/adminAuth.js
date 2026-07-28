const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ADMIN_PATH = require('../config/adminPath');

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }
  if (!token) {
    req.admin = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    req.admin = user || null;
  } catch {
    req.admin = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.admin) return res.redirect(`/admin-auth-x9k2?redirect=${ADMIN_PATH}`);
  if (req.admin.role !== 'super_admin' && req.admin.role !== 'admin' && req.admin.role !== 'staff') {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    return res.redirect('/');
  }
  if (!req.user) {
    req.user = req.admin;
    res.locals.user = req.admin;
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

const requireAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { protectAdmin, requireAdmin, requireSuperAdmin, requireAdminRole };