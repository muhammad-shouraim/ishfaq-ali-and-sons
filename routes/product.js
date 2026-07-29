const express = require('express');
const router = express.Router();
const { getShop, getProducts, getProduct } = require('../controllers/productController');
const { getCategoryDetail, getCategoryLanding } = require('../controllers/categoryController');
const { getReviews, addReview } = require('../controllers/reviewController');

router.get('/shop', getShop);
router.get('/api/products', getProducts);
router.get('/product/:slug', getProduct);
router.get('/api/products/:productId/reviews', getReviews);
router.post('/api/products/:productId/reviews', addReview);

// Static category pages (must be before dynamic /collection/:slug)
router.get('/collection/turkish-jewellery/:sub?/:nested?', getCategoryLanding);
router.get('/collection/1-carat/:sub?/:nested?', getCategoryLanding);
router.get('/collection/south-indian/:sub?/:nested?', getCategoryLanding);

router.get('/collection/:slug', getCategoryDetail);

module.exports = router;