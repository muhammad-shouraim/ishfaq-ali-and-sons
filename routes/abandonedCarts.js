const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Order = require('../models/Order');
const ADMIN_PATH = require('../config/adminPath');
const { logAdminAction } = require('../utils/adminLogger');

router.get('/', async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const carts = await Cart.findAll({
      where: { updatedAt: { [Op.lt]: oneHourAgo } },
      order: [['updatedAt', 'DESC']]
    });
    const results = [];
    for (const cart of carts) {
      const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : (cart.items || []);
      if (!items.length) continue;
      let customerName = 'Guest', customerEmail = '';
      if (cart.user) {
        const u = await User.findByPk(cart.user);
        if (u) { customerName = u.name; customerEmail = u.email; }
      }
      const hasOrder = cart.user ? await Order.findOne({ where: { user: cart.user } }) : null;
      if (hasOrder) continue;
      const cartValue = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1), 0);
      results.push({
        id: cart.id,
        customerName,
        customerEmail,
        userId: cart.user,
        items,
        cartValue,
        lastActive: cart.updatedAt
      });
    }
    res.render('admin/pages/abandoned-carts', {
      title: 'Abandoned Carts',
      carts: results,
      adminPath: ADMIN_PATH
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=Error loading abandoned carts&messageType=danger');
  }
});

router.post('/:id/remind', async (req, res) => {
  try {
    const cart = await Cart.findByPk(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : (cart.items || []);
    let email = '';
    if (cart.user) {
      const u = await User.findByPk(cart.user);
      if (u) email = u.email;
    }
    await logAdminAction(req, 'send_abandoned_reminder', 'Cart', cart.id, email || 'guest', `Reminder sent for abandoned cart (${items.length} items)`);
    res.json({ success: true, message: 'Reminder logged' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
