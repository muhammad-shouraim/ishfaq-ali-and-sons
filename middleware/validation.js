const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(400).json({ errors: errors.array() });
    }
    const messages = errors.array().map(e => e.msg);
    return res.status(400).render('pages/404', { message: messages.join(', ') });
  }
  next();
};

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  validate
];

const checkoutValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('paymentMethod').isIn(['cod', 'bank_transfer']).withMessage('Select a payment method'),
  validate
];

module.exports = { signupValidation, loginValidation, contactValidation, checkoutValidation };