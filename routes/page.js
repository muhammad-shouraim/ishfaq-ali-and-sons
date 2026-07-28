const express = require('express');
const router = express.Router();
const { getHome, getAbout, getPrivacy, getTerms, getRefund, getShipping, getTrackOrder, postTrackOrder } = require('../controllers/pageController');

router.get('/', getHome);
router.get('/about', getAbout);
router.get('/privacy-policy', getPrivacy);
router.get('/terms-conditions', getTerms);
router.get('/refund-policy', getRefund);
router.get('/shipping-policy', getShipping);
router.get('/track-order', getTrackOrder);
router.post('/track-order', postTrackOrder);

module.exports = router;