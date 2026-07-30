const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getCheckout = async (req, res) => {
  const where = req.user ? { user: req.user.id } : { sessionId: req.guestSessionId };
  const cartRow = await Cart.findOne({ where });
  if (!cartRow) return res.redirect('/shop');
  const cart = cartRow.toJSON();
  const items = cart.items || [];
  if (items.length === 0) return res.redirect('/shop');
  const productIds = items.map(i => i.product);
  const products = productIds.length > 0 ? await Product.findAll({ where: { id: productIds } }) : [];
  items.forEach(item => {
    item.product = products.find(p => Number(p.id) === Number(item.product));
  });
  cart.items = items;
  res.render('pages/checkout', { title: 'Checkout', cart });
};

exports.placeOrder = async (req, res) => {
  try {
    const where = req.user ? { user: req.user.id } : { sessionId: req.guestSessionId };
    const cartRow = await Cart.findOne({ where });
    if (!cartRow) return res.status(400).json({ message: 'Cart is empty' });
    const cart = cartRow.toJSON();
    const items = cart.items || [];
    if (items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const productIds = items.map(i => i.product);
    const products = productIds.length > 0 ? await Product.findAll({ where: { id: productIds } }) : [];

    const { name, phone, address, city, postalCode, paymentMethod, notes, accountName, transactionId } = req.body;
    const orderItems = items.map(item => {
      const p = products.find(pr => Number(pr.id) === Number(item.product));
      const unitPrice = (p && p.comparePrice && Number(p.comparePrice) > 0) ? Number(p.comparePrice) : Number(p?.price || 0);
      return {
        product: Number(item.product),
        name: p?.name || '',
        image: p?.images ? (typeof p.images === 'string' ? JSON.parse(p.images)[0] || '' : p.images[0] || '') : '',
        price: unitPrice,
        quantity: item.quantity
      };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 200;
    const total = subtotal + shippingCost - Number(cart.discount || 0);

    const order = await Order.create({
      user: req.user ? req.user.id : null,
      items: JSON.stringify(orderItems),
      shippingInfo: JSON.stringify({ name, phone, address, city, postalCode }),
      paymentMethod,
      accountName: paymentMethod === 'bank_transfer' ? accountName : null,
      transactionId: paymentMethod === 'bank_transfer' ? transactionId : null,
      subtotal,
      shippingCost,
      discount: cart.discount || 0,
      couponCode: cart.couponCode,
      total,
      notes
    });
    await Cart.destroy({ where: { id: cartRow.id } });

    if (req.user) {
      const pointsEarned = Math.floor(total / 100);
      await User.update({ points: sequelize.literal(`points + ${pointsEarned}`) }, { where: { id: req.user.id } });
    }

    res.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderSuccess = async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.redirect('/');
  res.render('pages/order-success', { title: 'Order Placed', order });
};

exports.getOrders = async (req, res) => {
  const orders = await Order.findAll({ where: { user: req.user.id }, order: [['createdAt', 'DESC']] });
  res.render('pages/orders', { title: 'My Orders', orders });
};