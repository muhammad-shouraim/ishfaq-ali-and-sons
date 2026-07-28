const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/newsletterController');

router.post('/api/newsletter/subscribe', subscribe);

module.exports = router;
