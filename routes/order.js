const express = require('express');
const router = express.Router();
const { getCheckout, placeOrder, getOrderSuccess, getOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');
const { checkoutValidation } = require('../middleware/validation');
const { generateInvoice } = require('../controllers/invoiceController');

router.get('/checkout', requireAuth, getCheckout);
router.post('/api/checkout', requireAuth, checkoutValidation, placeOrder);
router.get('/order/success/:id', requireAuth, getOrderSuccess);
router.get('/orders', requireAuth, getOrders);
router.get('/invoice/:id', requireAuth, generateInvoice);

module.exports = router;