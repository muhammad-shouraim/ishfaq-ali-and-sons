const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AdminActivityLog = require('../models/AdminActivityLog');
const ADMIN_PATH = require('../config/adminPath');
const { logAdminAction } = require('../utils/adminLogger');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      pendingOrders
    ] = await Promise.all([
      Product.count(),
      Category.count(),
      Order.count(),
      User.count({ where: { role: 'user' } }),
      Order.count({ where: { orderStatus: 'pending' } })
    ]);

    const revenueResult = await Order.findAll({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      where: { orderStatus: { [Op.notIn]: ['cancelled'] } },
      raw: true
    });
    const totalRevenue = Number(revenueResult[0]?.total || 0);

    const recentOrders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const lowStockProducts = await Product.findAll({
      where: literal('stock <= lowStockThreshold'),
      order: [['stock', 'ASC']],
      limit: 10
    });

    const bestSellingProducts = await Product.findAll({
      order: [['numReviews', 'DESC']],
      limit: 5,
      raw: true
    });

    const salesDataRaw = await Order.findAll({
      attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('SUM', col('total')), 'total']],
      where: { orderStatus: { [Op.notIn]: ['cancelled'] } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      limit: 30,
      raw: true
    });
    const salesLabels = salesDataRaw.map(r => r.date);
    const salesData = salesDataRaw.map(r => Number(r.total));

    const recentActivity = await AdminActivityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 15
    });

    const lowStockCount = await Product.count({ where: literal('stock <= lowStockThreshold') });

    await ActivityLog.create({ user: req.user.id, action: 'view_dashboard', resource: 'dashboard', details: '{}', ip: req.ip });

    const Setting = require('../models/Setting');
    const maintSetting = await Setting.findOne({ where: { key: 'maintenance_mode' } });
    const maintenanceMode = maintSetting && maintSetting.value === 'true';

    res.render('admin/pages/dashboard', {
      title: 'Dashboard',
      totalProducts, totalCategories, totalOrders, totalCustomers,
      totalRevenue, pendingOrders, recentOrders, lowStockProducts,
      bestSellingProducts, salesLabels, salesData, maintenanceMode,
      recentActivity, lowStockCount
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.redirect('/');
  };
};

exports.getTopSelling = async (req, res) => {
  try {
    const range = req.query.range || '30';
    let dateFilter = {};
    if (range === '7') {
      dateFilter = { createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (range === '30') {
      dateFilter = { createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }
    const orders = await Order.findAll({
      where: { ...dateFilter, orderStatus: { [Op.notIn]: ['cancelled'] } },
      attributes: ['items'],
      raw: true
    });
    const productMap = {};
    for (const order of orders) {
      let items;
      try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch { items = []; }
      for (const item of items || []) {
        const pid = item.product || item.id;
        if (!pid) continue;
        if (!productMap[pid]) productMap[pid] = { name: item.productName || item.name || `Product #${pid}`, qty: 0, total: 0 };
        productMap[pid].qty += Number(item.quantity) || 1;
        productMap[pid].total += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      }
    }
    const sorted = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
    res.json({ success: true, products: sorted.map(([id, d]) => ({ id, ...d })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRevenueData = async (req, res) => {
  try {
    const range = req.query.range || '30';
    let dateFilter = {};
    if (range === 'today') {
      dateFilter = { createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } };
    } else if (range === 'week') {
      dateFilter = { createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (range === 'month') {
      dateFilter = { createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }
    const data = await Order.findAll({
      attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('SUM', col('total')), 'total']],
      where: { ...dateFilter, orderStatus: { [Op.notIn]: ['cancelled'] } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });
    res.json({ success: true, labels: data.map(r => r.date), values: data.map(r => Number(r.total)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const logs = await AdminActivityLog.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.findAll({ where: literal('stock <= lowStockThreshold'), order: [['stock', 'ASC']], limit: 20 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    let data, total, title;
    const skip = (Number(page) - 1) * Number(limit);
    switch (type) {
      case 'sales':
        title = 'Sales Report';
        data = await Order.findAll({ where: { ...dateFilter, orderStatus: { [Op.notIn]: ['cancelled'] } }, order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit) });
        total = await Order.count({ where: { ...dateFilter, orderStatus: { [Op.notIn]: ['cancelled'] } } });
        break;
      case 'orders':
        title = 'Orders Report';
        data = await Order.findAll({ where: dateFilter, order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit) });
        total = await Order.count({ where: dateFilter });
        break;
      case 'customers':
        title = 'Customers Report';
        data = await User.findAll({ where: { ...dateFilter, role: 'user' }, order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit) });
        total = await User.count({ where: { ...dateFilter, role: 'user' } });
        break;
      case 'products':
        title = 'Products Report';
        data = await Product.findAll({ where: dateFilter, include: [{ model: Category, attributes: ['name'], as: 'categoryData' }], order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit) });
        total = await Product.count({ where: dateFilter });
        break;
      case 'revenue':
        title = 'Revenue Report';
        data = await Order.findAll({
          attributes: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'date'], [fn('SUM', col('total')), 'total'], [fn('COUNT', col('id')), 'count']],
          where: { ...(startDate || endDate ? dateFilter : {}), orderStatus: { [Op.notIn]: ['cancelled'] } },
          group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d')],
          order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'DESC']],
          offset: skip,
          limit: Number(limit),
          raw: true
        });
        total = data.length;
        break;
      default:
        return res.redirect(ADMIN_PATH);
    }

    await ActivityLog.create({ user: req.user.id, action: 'view_report', resource: 'report', details: JSON.stringify({ type }), ip: req.ip });
    res.render('admin/pages/dashboard', {
      title, type, data, total, pages: Math.ceil(total / limit), currentPage: Number(page), startDate, endDate,
      totalProducts: 0, totalCategories: 0, totalOrders: 0, totalCustomers: 0,
      totalRevenue: 0, pendingOrders: 0, lowStockProducts: [],
      salesData: [], salesLabels: [], bestSellingProducts: [], recentOrders: []
    });
  } catch (err) {
    res.status(500).render('admin/pages/dashboard', { message: err.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type, format } = req.params;
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    let data;
    switch (type) {
      case 'sales':
        data = await Order.findAll({ where: { ...dateFilter, orderStatus: { [Op.notIn]: ['cancelled'] } }, order: [['createdAt', 'DESC']], raw: true });
        break;
      case 'orders':
        data = await Order.findAll({ where: dateFilter, order: [['createdAt', 'DESC']], raw: true });
        break;
      case 'customers':
        data = await User.findAll({ where: { ...dateFilter, role: 'user' }, order: [['createdAt', 'DESC']], raw: true });
        break;
      case 'products':
        data = await Product.findAll({ where: dateFilter, order: [['createdAt', 'DESC']], raw: true });
        break;
      case 'revenue':
        data = await Order.findAll({
          attributes: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), '_id'], [fn('SUM', col('total')), 'total'], [fn('COUNT', col('id')), 'count']],
          where: { ...(startDate || endDate ? dateFilter : {}), orderStatus: { [Op.notIn]: ['cancelled'] } },
          group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d')],
          order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'DESC']],
          raw: true
        });
        break;
      default:
        return res.redirect(ADMIN_PATH);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    if (!data || data.length === 0) return res.send('No data');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','));
    res.send([headers, ...rows].join('\n'));

    await ActivityLog.create({ user: req.user.id, action: 'export_report', resource: 'report', details: JSON.stringify({ type, format }), ip: req.ip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
