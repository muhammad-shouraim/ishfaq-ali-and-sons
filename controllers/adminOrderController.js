const Order = require('../models/Order');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: ['refunded'],
  refunded: []
};

exports.listOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingInfo.name': { $regex: search, $options: 'i' } },
        { 'shippingInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(query)
    ]);

    res.render('admin/pages/orders', {
      title: 'Orders',
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      query: req.query,
      statuses: Object.keys(STATUS_FLOW)
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone').populate('items.product', 'name images slug');
    if (!order) return res.redirect('/admin?message=&messageType=danger');

    const activityLogs = await ActivityLog.find({ resource: 'Order', resourceId: order._id }).sort({ createdAt: -1 }).populate('user', 'name');

    const allowedTransitions = STATUS_FLOW[order.orderStatus] || [];

    res.render('admin/pages/order-detail', {
      title: `Order #${order.orderNumber}`,
      order,
      activityLogs,
      allowedTransitions,
      statuses: Object.keys(STATUS_FLOW)
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { status, note } = req.body;
    const allowedTransitions = STATUS_FLOW[order.orderStatus] || [];

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${order.orderStatus} to ${status}. Allowed: ${allowedTransitions.join(', ') || 'none'}` });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    order.notes = note ? (order.notes ? `${order.notes}\n[${new Date().toISOString()}] ${note}` : `[${new Date().toISOString()}] ${note}`) : order.notes;

    if (status === 'delivered') {
      order.isPaid = true;
      order.paidAt = new Date();
      order.deliveredAt = new Date();
    }
    if (status === 'cancelled' || status === 'returned') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    if (status === 'delivered') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, numReviews: 0 }
        });
      }
    }

    await order.save();

    await ActivityLog.create({
      user: req.user._id,
      action: `order_${status}`,
      resource: 'Order',
      resourceId: order._id,
      details: { previousStatus, newStatus: status, note, orderNumber: order.orderNumber },
      ip: req.ip
    });

    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, order });
    } else {
      // msg: 'success', `Order status updated to ${status}`);
      res.redirect(`/admin/orders/${order._id}`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.trackingNumber = req.body.trackingNumber;
    await order.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'set_tracking',
      resource: 'Order',
      resourceId: order._id,
      details: { trackingNumber: req.body.trackingNumber, orderNumber: order.orderNumber },
      ip: req.ip
    });

    res.json({ success: true, trackingNumber: order.trackingNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.redirect('/admin?message=&messageType=danger');

    const Setting = require('../models/Setting');
    const settings = await Setting.find();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });

    res.render('admin/pages/order-detail', {
      title: `Invoice #${order.orderNumber}`,
      order,
      settings: settingMap
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.redirect('/admin?message=&messageType=danger');

    const Setting = require('../models/Setting');
    const settings = await Setting.find();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });

    res.render('admin/pages/order-detail-pdf', {
      title: `Invoice #${order.orderNumber}`,
      order,
      settings: settingMap,
      layout: false
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



