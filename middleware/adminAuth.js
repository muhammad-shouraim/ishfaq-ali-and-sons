const { requireAuth } = require('./auth');

const requireAdmin = (req, res, next) => {
  if (!req.user) return res.redirect('/login?redirect=/admin');
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && req.user.role !== 'staff') {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    return res.status(403).render('pages/404', { title: 'Access Denied', message: 'You do not have permission to access the admin panel.' });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

const requireAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { requireAdmin, requireSuperAdmin, requireAdminRole };