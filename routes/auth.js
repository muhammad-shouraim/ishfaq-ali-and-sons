const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { getLogin, getSignup, getForgotPassword, postLogin, postSignup, postAdminLogin, postForgotPassword, logout, getProfile, updateProfile, getOrders, googleCallback } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');

const ADMIN_PATH = require('../config/adminPath');

router.get('/login', (req, res) => res.redirect('/'));
router.get('/signup', (req, res) => res.redirect('/'));
router.get('/forgot-password', (req, res) => res.redirect('/'));

router.get('/admin-auth-x9k2', protectAdmin, (req, res) => {
  if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'super_admin' || req.admin.role === 'staff')) return res.redirect(ADMIN_PATH);
  res.render('admin/admin-login', { title: 'Admin Login', redirect: req.query.redirect || ADMIN_PATH, error: req.query.error || '', layout: false });
});
router.post('/admin-auth-x9k2', protectAdmin, postAdminLogin);
router.post('/login', loginValidation, postLogin);
router.post('/signup', signupValidation, postSignup);
router.post('/forgot-password', postForgotPassword);
router.get('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, updateProfile);
router.get('/orders', requireAuth, getOrders);

const authGuard = (req, res, next) => {
  if (passport.isGoogleConfigured) return next();
  res.redirect('/login?message=Google+login+not+configured&messageType=warning');
};
router.get('/auth/google', authGuard, passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/auth/google/callback', authGuard, passport.authenticate('google', { session: false, failureRedirect: '/login?message=Google+login+failed&messageType=danger' }), googleCallback);

module.exports = router;