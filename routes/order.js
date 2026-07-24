const express = require('express');
const router = express.Router();
const { getCheckout, placeOrder, getOrderSuccess } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');
const { checkoutValidation } = require('../middleware/validation');

router.get('/checkout', requireAuth, getCheckout);
router.post('/api/checkout', requireAuth, checkoutValidation, placeOrder);
router.get('/order/success/:id', requireAuth, getOrderSuccess);

module.exports = router;