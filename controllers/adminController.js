const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      pendingOrders,
      revenueResult,
      recentOrders,
      lowStockProducts,
      bestSellingProducts,
      salesData
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.aggregate([
        { $match: { orderStatus: { $nin: ['cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isActive: true }).sort({ stock: 1 }).limit(10),
      Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo }, orderStatus: { $nin: ['cancelled'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    const salesMap = {};
    salesData.forEach(s => { salesMap[s._id] = { revenue: s.total, orders: s.count }; });
    const chartData = months.map(m => ({ month: m, revenue: salesMap[m]?.revenue || 0, orders: salesMap[m]?.orders || 0 }));

    await ActivityLog.create({ user: req.user._id, action: 'view_dashboard', resource: 'dashboard', details: {}, ip: req.ip });

    res.render('admin/pages/dashboard', {
      title: 'Dashboard',
      totalProducts,
      totalCategories,
      totalOrders,
      totalCustomers,
      totalRevenue,
      pendingOrders,
      recentOrders,
      lowStockProducts,
      bestSellingProducts,
      chartData
    });
  } catch (err) {
    res.status(500).render('admin/pages/dashboard', { message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let data, total, title;
    switch (type) {
      case 'sales':
        title = 'Sales Report';
        data = await Order.find({ ...dateFilter, orderStatus: { $nin: ['cancelled'] } })
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));
        total = await Order.countDocuments({ ...dateFilter, orderStatus: { $nin: ['cancelled'] } });
        break;
      case 'orders':
        title = 'Orders Report';
        data = await Order.find(dateFilter)
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));
        total = await Order.countDocuments(dateFilter);
        break;
      case 'customers':
        title = 'Customers Report';
        data = await User.find({ role: 'user', ...dateFilter })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));
        total = await User.countDocuments({ role: 'user', ...dateFilter });
        break;
      case 'products':
        title = 'Products Report';
        data = await Product.find(dateFilter)
          .populate('category', 'name')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit));
        total = await Product.countDocuments(dateFilter);
        break;
      case 'revenue':
        title = 'Revenue Report';
        data = await Order.aggregate([
          { $match: { ...(startDate || endDate ? { createdAt: dateFilter.createdAt } : {}), orderStatus: { $nin: ['cancelled'] } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
          { $sort: { _id: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: Number(limit) }
        ]);
        total = data.length;
        break;
      default:
        return res.redirect('/admin');
    }

    await ActivityLog.create({ user: req.user._id, action: 'view_report', resource: 'report', details: { type }, ip: req.ip });

    res.render('admin/pages/dashboard', { title, type, data, total, pages: Math.ceil(total / limit), currentPage: Number(page), startDate, endDate });
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
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let data;
    switch (type) {
      case 'sales':
        data = await Order.find({ ...dateFilter, orderStatus: { $nin: ['cancelled'] } }).populate('user', 'name email').sort({ createdAt: -1 }).lean();
        break;
      case 'orders':
        data = await Order.find(dateFilter).populate('user', 'name email').sort({ createdAt: -1 }).lean();
        break;
      case 'customers':
        data = await User.find({ role: 'user', ...dateFilter }).sort({ createdAt: -1 }).lean();
        break;
      case 'products':
        data = await Product.find(dateFilter).populate('category', 'name').sort({ createdAt: -1 }).lean();
        break;
      case 'revenue':
        data = await Order.aggregate([
          { $match: { ...(startDate || endDate ? { createdAt: dateFilter.createdAt } : {}), orderStatus: { $nin: ['cancelled'] } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
          { $sort: { _id: -1 } }
        ]);
        break;
      default:
        return res.redirect('/admin');
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      if (!data || data.length === 0) return res.send('No data');
      const headers = Object.keys(data[0]).filter(k => k !== '__v').join(',');
      const rows = data.map(row => Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','));
      res.send([headers, ...rows].join('\n'));
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
      const { Parser } = require('json2csv');
      const parser = new Parser();
      const csv = parser.parse(data);
      res.send(csv);
    }

    await ActivityLog.create({ user: req.user._id, action: 'export_report', resource: 'report', details: { type, format }, ip: req.ip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

