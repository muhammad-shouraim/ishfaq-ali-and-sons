const express = require('express');
const router = express.Router();
const { getContact, postContact } = require('../controllers/contactController');
const { contactValidation } = require('../middleware/validation');

router.get('/contact', getContact);
router.post('/api/contact', contactValidation, postContact);

module.exports = router;