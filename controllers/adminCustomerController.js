const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const ADMIN_PATH = require('../config/adminPath');

exports.listCustomers = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const where = { role: 'user' };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === '1';
    }
    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: customers } = await User.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit)
    });
    res.render('admin/pages/customers', {
      title: 'Customers', customers, total,
      pages: Math.ceil(total / Number(limit)), currentPage: Number(page), query: req.query,
      search: req.query.search || ''
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const [orders, wishlist, reviews, activityLogs] = await Promise.all([
      Order.findAll({ where: { user: customer.id }, order: [['createdAt', 'DESC']] }),
      Wishlist.findOne({ where: { user: customer.id } }),
      Review.findAll({ where: { user: customer.id }, order: [['createdAt', 'DESC']] }),
      ActivityLog.findAll({ where: { user: customer.id }, order: [['createdAt', 'DESC']], limit: 50 })
    ]);
    const totalSpent = orders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
    res.render('admin/pages/customer-detail', {
      title: customer.name, customer, orders,
      wishlist: wishlist ? (typeof wishlist.items === 'string' ? JSON.parse(wishlist.items) : wishlist.items || []) : [],
      reviews, activityLogs, totalSpent, totalOrders: orders.length
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.toggleBlockCustomer = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (customer.role === 'admin') return res.status(403).json({ message: 'Cannot block admin users' });
    customer.isBlocked = !customer.isBlocked;
    customer.isActive = !customer.isBlocked;
    await customer.save();
    await ActivityLog.create({
      user: req.user.id, action: customer.isBlocked ? 'block_customer' : 'unblock_customer',
      resource: 'User', resourceId: customer.id, details: JSON.stringify({ name: customer.name, email: customer.email }), ip: req.ip
    });
    res.json({ success: true, isBlocked: customer.isBlocked, isActive: customer.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveNotes = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    customer.internalNotes = req.body.notes || '';
    await customer.save();
    await ActivityLog.create({
      user: req.user.id, action: 'save_notes', resource: 'User',
      resourceId: customer.id, details: JSON.stringify({ name: customer.name }), ip: req.ip
    });
    res.json({ success: true, message: 'Notes saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveTags = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    customer.tags = req.body.tags || '';
    await customer.save();
    await ActivityLog.create({
      user: req.user.id, action: 'save_tags', resource: 'User',
      resourceId: customer.id, details: JSON.stringify({ name: customer.name }), ip: req.ip
    });
    res.json({ success: true, message: 'Tags saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (customer.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin users' });
    const orderCount = await Order.count({ where: { user: customer.id } });
    if (orderCount > 0) {
      return res.status(400).json({ message: `Cannot delete customer with ${orderCount} existing orders.` });
    }
    await Promise.all([
      User.destroy({ where: { id: customer.id } }),
      Wishlist.destroy({ where: { user: customer.id } }),
      Review.destroy({ where: { user: customer.id } }),
      ActivityLog.destroy({ where: { user: customer.id } })
    ]);
    await ActivityLog.create({
      user: req.user.id, action: 'delete_customer', resource: 'User',
      resourceId: customer.id, details: JSON.stringify({ name: customer.name, email: customer.email }), ip: req.ip
    });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};