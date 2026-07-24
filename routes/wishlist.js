const express = require('express');
const router = express.Router();
const { getWishlistPage, getWishlistData, toggleWishlist, removeFromWishlist } = require('../controllers/wishlistController');

router.get('/wishlist', getWishlistPage);
router.get('/api/wishlist', getWishlistData);
router.post('/api/wishlist/toggle', toggleWishlist);
router.delete('/api/wishlist/remove/:productId', removeFromWishlist);

module.exports = router;