const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const ADMIN_PATH = require('../config/adminPath');
const { logAdminAction } = require('../utils/adminLogger');

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

exports.listOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status && status !== 'all') where.orderStatus = status;
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { shippingInfo: { [Op.like]: `%${search}%` } }
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: orders } = await Order.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit: Number(limit)
    });
    res.render('admin/pages/orders', {
      title: 'Orders', orders, total,
      pages: Math.ceil(total / Number(limit)), currentPage: Number(page),
      query: req.query, statuses: Object.keys(STATUS_FLOW),
      filterStatus: req.query.status || '', filterDateFrom: req.query.dateFrom || '', filterDateTo: req.query.dateTo || '', search: req.query.search || ''
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const activityLogs = await ActivityLog.findAll({
      where: { resource: 'Order', resourceId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    const allowedTransitions = STATUS_FLOW[order.orderStatus] || [];
    res.render('admin/pages/order-detail', {
      title: `Order #${order.orderNumber}`, order, activityLogs,
      allowedTransitions, statuses: Object.keys(STATUS_FLOW),
      internalNotes: order.internalNotes || ''
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const { status, note } = req.body;
    const allowedTransitions = STATUS_FLOW[order.orderStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${order.orderStatus} to ${status}` });
    }
    order.orderStatus = status;
    if (note) order.notes = order.notes ? `${order.notes}\n[${new Date().toISOString()}] ${note}` : `[${new Date().toISOString()}] ${note}`;
    if (status === 'delivered') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.deliveredAt = new Date();
    }
    if (status === 'cancelled') {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      for (const item of items) {
        await Product.update({ stock: sequelize.literal(`stock + ${item.quantity}`) }, { where: { id: item.product } });
      }
    }
    await order.save();
    await ActivityLog.create({ user: req.user.id, action: `order_${status}`, resource: 'Order', resourceId: order.id, details: JSON.stringify({ orderNumber: order.orderNumber }), ip: req.ip });
    await logAdminAction(req, `order_${status}`, 'Order', order.id, order.orderNumber, `Order #${order.orderNumber} status changed to ${status}`);
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, order });
    } else {
      res.redirect(ADMIN_PATH + `/orders/${order.id}`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkStatusUpdate = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No orders selected' });
    const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    await Order.update({ orderStatus: status }, { where: { id: ids } });
    await logAdminAction(req, 'bulk_status_update', 'Order', 0, '', `Updated ${ids.length} orders to ${status}`);
    res.json({ success: true, message: `${ids.length} orders updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveInternalNotes = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.internalNotes = req.body.notes || '';
    await order.save();
    await logAdminAction(req, 'save_notes', 'Order', order.id, order.orderNumber, 'Internal notes saved');
    res.json({ success: true, message: 'Notes saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.packingSlip = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.redirect(ADMIN_PATH + '/orders');
    order.packingSlipPrinted = true;
    await order.save();
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    const shipping = typeof order.shippingInfo === 'string' ? JSON.parse(order.shippingInfo) : (order.shippingInfo || {});
    res.render('admin/pages/packing-slip', {
      title: `Packing Slip - ${order.orderNumber}`,
      order, items, shipping, layout: false
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '/orders');
  }
};

exports.setTracking = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.trackingNumber = req.body.trackingNumber;
    await order.save();
    await ActivityLog.create({ user: req.user.id, action: 'set_tracking', resource: 'Order', resourceId: order.id, details: JSON.stringify({ trackingNumber: req.body.trackingNumber, orderNumber: order.orderNumber }), ip: req.ip });
    res.json({ success: true, trackingNumber: order.trackingNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const Setting = require('../models/Setting');
    const settings = await Setting.findAll();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });
    res.render('admin/pages/order-detail', { title: `Invoice #${order.orderNumber}`, order, settings: settingMap });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const Setting = require('../models/Setting');
    const settings = await Setting.findAll();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });
    res.render('admin/pages/order-detail', {
      title: `Invoice #${order.orderNumber}`, order, settings: settingMap, layout: false
    }, (err, html) => {
      if (err) return res.status(500).json({ message: err.message });
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename=invoice-${order.orderNumber}.html`);
      res.send(html);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
