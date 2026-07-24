const Wishlist = require('../models/Wishlist');

const getWishlist = async (userId, sessionId) => {
  let query = {};
  if (userId) query = { user: userId };
  else if (sessionId) query = { sessionId };
  else return null;
  return Wishlist.findOne(query).populate('items');
};

exports.getWishlistPage = async (req, res) => {
  const wishlist = await getWishlist(req.user?._id, req.sessionID);
  res.render('pages/wishlist', { title: 'My Wishlist', wishlist });
};

exports.getWishlistData = async (req, res) => {
  const wishlist = await getWishlist(req.user?._id, req.sessionID);
  res.json({ items: wishlist?.items || [] });
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await getWishlist(req.user?._id, req.sessionID);
    if (!wishlist) {
      wishlist = new Wishlist({ items: [] });
      if (req.user) wishlist.user = req.user._id;
      else wishlist.sessionId = req.sessionID;
    }
    const exists = wishlist.items.some(i => i?.toString() === productId);
    if (exists) {
      wishlist.items.pull(productId);
      await wishlist.save();
      return res.json({ success: true, inWishlist: false, message: 'Removed from wishlist' });
    }
    wishlist.items.push(productId);
    await wishlist.save();
    res.json({ success: true, inWishlist: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlist(req.user?._id, req.sessionID);
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });
    wishlist.items.pull(req.params.productId);
    await wishlist.save();
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};