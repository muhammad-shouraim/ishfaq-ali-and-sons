const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const getWishlist = async (userId, sessionId) => {
  let where = {};
  if (userId) where = { user: userId };
  else if (sessionId) where = { sessionId };
  else return null;
  const wishlist = await Wishlist.findOne({ where });
  if (!wishlist) return null;
  const data = wishlist.toJSON();
  const productIds = data.items.filter(Boolean);
  if (productIds.length > 0) {
    const products = await Product.findAll({ where: { id: productIds } });
    data.items = productIds.map(id => products.find(p => p.id === id) || id);
  }
  return data;
};

exports.getWishlistPage = async (req, res) => {
  const wishlist = await getWishlist(req.user?.id, req.guestSessionId);
  res.render('pages/wishlist', { title: 'My Wishlist', wishlist });
};

exports.getWishlistData = async (req, res) => {
  const wishlist = await getWishlist(req.user?.id, req.guestSessionId);
  res.json({ items: wishlist?.items || [] });
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ where: req.user ? { user: req.user.id } : { sessionId: req.guestSessionId } });
    let items = [];
    if (wishlist) {
      try { items = JSON.parse(wishlist.items); } catch { items = []; }
    } else {
      wishlist = Wishlist.build({ items: '[]' });
      if (req.user) wishlist.user = req.user.id;
      else wishlist.sessionId = req.guestSessionId;
    }
    const exists = items.some(i => Number(i) === Number(productId));
    if (exists) {
      items = items.filter(i => Number(i) !== Number(productId));
      wishlist.items = JSON.stringify(items);
      await wishlist.save();
      return res.json({ success: true, inWishlist: false, message: 'Removed from wishlist' });
    }
    items.push(productId);
    wishlist.items = JSON.stringify(items);
    await wishlist.save();
    res.json({ success: true, inWishlist: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ where: req.user ? { user: req.user.id } : { sessionId: req.guestSessionId } });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
    let items = [];
    try { items = JSON.parse(wishlist.items); } catch { items = []; }
    items = items.filter(i => Number(i) !== Number(req.params.productId));
    wishlist.items = JSON.stringify(items);
    await wishlist.save();
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};