const express = require('express');
const router = express.Router();
const { getCartPage, getCartData, addToCart, updateCart, removeFromCart, applyCoupon } = require('../controllers/cartController');

router.get('/cart', getCartPage);
router.get('/api/cart', getCartData);
router.post('/api/cart/add', addToCart);
router.put('/api/cart/update', updateCart);
router.delete('/api/cart/remove/:productId', removeFromCart);
router.post('/api/cart/coupon', applyCoupon);

module.exports = router;