const { Op } = require('sequelize');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (userId, sessionId) => {
  let where = {};
  if (userId) where = { user: userId };
  else if (sessionId) where = { sessionId };
  else return null;
  const cart = await Cart.findOne({ where });
  if (!cart) return null;
  const data = cart.toJSON();
  const productIds = data.items.map(i => i.product).filter(Boolean);
  if (productIds.length > 0) {
    const products = await Product.findAll({ where: { id: productIds } });
    data.items = data.items.map(item => {
      const p = products.find(pr => Number(pr.id) === Number(item.product));
      return { ...item, product: p ? p.toJSON() : item.product };
    });
    data.items.forEach(item => {
      if (item.product && typeof item.product === 'object') {
        item.product.price = Number(item.product.price);
        item.product.comparePrice = Number(item.product.comparePrice);
      }
    });
  }
  return data;
};

exports.getCartData = async (req, res) => {
  const cart = await getCart(req.user?.id, req.guestSessionId);
  if (!cart) return res.json({ items: [], subtotal: 0, total: 0, count: 0 });
  const subtotal = cart.items.reduce((sum, item) => {
    const p = item.product;
    const unitPrice = (p && p.comparePrice && p.comparePrice > 0) ? p.comparePrice : (p?.price || 0);
    return sum + unitPrice * item.quantity;
  }, 0);
  res.json({ items: cart.items, subtotal, total: subtotal, count: cart.items.reduce((s, i) => s + i.quantity, 0) });
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ where: req.user ? { user: req.user.id } : { sessionId: req.guestSessionId } });
    let items = [];
    if (cart) {
      try { items = JSON.parse(cart.items); } catch { items = []; }
    } else {
      cart = Cart.build({ items: '[]' });
      if (req.user) cart.user = req.user.id;
      else cart.sessionId = req.guestSessionId;
    }
    const existing = items.find(i => Number(i.product) === Number(productId));
    if (existing) {
      existing.quantity = (existing.quantity || 0) + quantity;
    } else {
      items.push({ product: productId, quantity });
    }
    cart.items = JSON.stringify(items);
    await cart.save();
    const count = items.reduce((s, i) => s + i.quantity, 0);
    res.json({ success: true, message: 'Added to cart', count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ where: req.user ? { user: req.user.id } : { sessionId: req.guestSessionId } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    let items = [];
    try { items = JSON.parse(cart.items); } catch { items = []; }
    const idx = items.findIndex(i => Number(i.product) === Number(productId));
    if (idx === -1) return res.status(404).json({ message: 'Item not in cart' });
    if (quantity < 1) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
    cart.items = JSON.stringify(items);
    await cart.save();
    const productIds = items.map(i => i.product);
    const products = productIds.length > 0 ? await Product.findAll({ where: { id: productIds } }) : [];
    const subtotal = items.reduce((sum, i) => {
      const p = products.find(pr => pr.id === Number(i.product));
      const unitPrice = (p && p.comparePrice && Number(p.comparePrice) > 0) ? Number(p.comparePrice) : Number(p?.price || 0);
      return sum + unitPrice * i.quantity;
    }, 0);
    res.json({ success: true, items, subtotal, total: subtotal, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ where: req.user ? { user: req.user.id } : { sessionId: req.guestSessionId } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    let items = [];
    try { items = JSON.parse(cart.items); } catch { items = []; }
    items = items.filter(i => Number(i.product) !== Number(req.params.productId));
    cart.items = JSON.stringify(items);
    await cart.save();
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyCoupon = async (req, res) => {
  const Coupon = require('../models/Coupon');
  try {
    const coupon = await Coupon.findOne({
      where: {
        code: req.body.code.toUpperCase(),
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon' });
    const cart = await getCart(req.user?.id, req.guestSessionId);
    const subtotal = cart.items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
    let discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    if (cart) {
      const cartRow = await Cart.findOne({ where: { user: req.user?.id, sessionId: req.guestSessionId } });
      if (cartRow) {
        cartRow.couponCode = coupon.code;
        cartRow.discount = discount;
        await cartRow.save();
      }
    }
    res.json({ success: true, discount, total: subtotal - discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};