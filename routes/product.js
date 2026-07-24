const express = require('express');
const router = express.Router();
const { getShop, getProducts, getProduct } = require('../controllers/productController');
const { getCategories, getCategoryDetail } = require('../controllers/categoryController');

router.get('/shop', getShop);
router.get('/api/products', getProducts);
router.get('/product/:slug', getProduct);
router.get('/categories', getCategories);
router.get('/category/:slug', getCategoryDetail);

module.exports = router;