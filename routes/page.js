const express = require('express');
const router = express.Router();
const { getHome, getAbout, getPrivacy, getTerms, getRefund, getShipping } = require('../controllers/pageController');

router.get('/', getHome);
router.get('/about', getAbout);
router.get('/privacy-policy', getPrivacy);
router.get('/terms-conditions', getTerms);
router.get('/refund-policy', getRefund);
router.get('/shipping-policy', getShipping);

module.exports = router;