const express = require('express');
const router = express.Router();
const { getShop, getProducts, getProduct } = require('../controllers/productController');
const { getCategoryDetail, getCategoryLanding } = require('../controllers/categoryController');

router.get('/shop', getShop);
router.get('/api/products', getProducts);
router.get('/product/:slug', getProduct);

// Static category pages (must be before dynamic /collection/:slug)
router.get('/collection/turkish-jewellery/:sub?/:nested?', getCategoryLanding);
router.get('/collection/1-carat/:sub?/:nested?', getCategoryLanding);
router.get('/collection/south-indian/:sub?/:nested?', getCategoryLanding);

router.get('/collection/:slug', getCategoryDetail);

module.exports = router;