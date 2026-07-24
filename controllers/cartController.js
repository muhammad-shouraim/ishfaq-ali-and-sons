const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (userId, sessionId) => {
  let query = {};
  if (userId) query = { user: userId };
  else if (sessionId) query = { sessionId };
  else return null;
  return Cart.findOne(query).populate('items.product');
};

exports.getCartPage = async (req, res) => {
  const cart = await getCart(req.user?._id, req.sessionID);
  res.render('pages/cart', { title: 'Shopping Cart', cart });
};

exports.getCartData = async (req, res) => {
  const cart = await getCart(req.user?._id, req.sessionID);
  if (!cart) return res.json({ items: [], subtotal: 0, total: 0, count: 0 });
  const subtotal = cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  res.json({ items: cart.items, subtotal, total: subtotal, count: cart.items.reduce((s, i) => s + i.quantity, 0) });
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });

    let cart = await getCart(req.user?._id, req.sessionID);
    if (!cart) {
      cart = new Cart({ items: [] });
      if (req.user) cart.user = req.user._id;
      else cart.sessionId = req.sessionID;
    }
    const existing = cart.items.find(i => i.product?.toString() === productId || (i.product?._id?.toString() === productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
    const count = cart.items.reduce((s, i) => s + i.quantity, 0);
    res.json({ success: true, message: 'Added to cart', count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await getCart(req.user?._id, req.sessionID);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const item = cart.items.find(i => i.product?.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });
    if (quantity < 1) {
      cart.items.pull({ _id: item._id });
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    const subtotal = cart.items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
    res.json({ success: true, items: cart.items, subtotal, total: subtotal, count: cart.items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await getCart(req.user?._id, req.sessionID);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items.pull({ product: req.params.productId });
    await cart.save();
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyCoupon = async (req, res) => {
  const Coupon = require('../models/Coupon');
  try {
    const coupon = await Coupon.findOne({ code: req.body.code.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (!coupon) return res.status(400).json({ message: 'Invalid or expired coupon' });
    const cart = await getCart(req.user?._id, req.sessionID);
    const subtotal = cart.items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
    let discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    if (cart) {
      cart.couponCode = coupon.code;
      cart.discount = discount;
      await cart.save();
    }
    res.json({ success: true, discount, total: subtotal - discount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};