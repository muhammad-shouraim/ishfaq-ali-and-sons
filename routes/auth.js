const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { getLogin, getSignup, getForgotPassword, postLogin, postSignup, postForgotPassword, logout, getProfile, updateProfile, getOrders, googleCallback } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

router.get('/login', getLogin);
router.get('/signup', getSignup);
router.get('/forgot-password', getForgotPassword);
router.post('/login', loginValidation, postLogin);
router.post('/signup', signupValidation, postSignup);
router.post('/forgot-password', postForgotPassword);
router.get('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, updateProfile);
router.get('/orders', requireAuth, getOrders);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?message=Google+login+failed&messageType=danger' }), googleCallback);

module.exports = router;