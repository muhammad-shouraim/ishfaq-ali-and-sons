const express = require('express');
const router = express.Router();
const { searchProducts, getSearchPage } = require('../controllers/searchController');

router.get('/search', getSearchPage);
router.get('/api/search', searchProducts);

module.exports = router;