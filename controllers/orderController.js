const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.getCheckout = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) return res.redirect('/cart');
  res.render('pages/checkout', { title: 'Checkout', cart });
};

exports.placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const { name, phone, address, city, postalCode, paymentMethod, notes } = req.body;
    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      price: item.product.price,
      quantity: item.quantity
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 5000 ? 0 : 200;
    const total = subtotal + shippingCost - (cart.discount || 0);

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingInfo: { name, phone, address, city, postalCode },
      paymentMethod,
      subtotal,
      shippingCost,
      discount: cart.discount || 0,
      couponCode: cart.couponCode,
      total,
      notes
    });
    await Cart.findByIdAndDelete(cart._id);
    res.json({ success: true, orderId: order._id, orderNumber: order.orderNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderSuccess = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.redirect('/');
  res.render('pages/order-success', { title: 'Order Placed', order });
};