const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Order = require('../models/Order');
const ADMIN_PATH = require('../config/adminPath');

const generateUserToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const generateAdminToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_ADMIN, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

exports.getLogin = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('pages/login', { title: 'Login', redirect: req.query.redirect || '' });
};

exports.getSignup = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('pages/signup', { title: 'Create Account' });
};

exports.getForgotPassword = (req, res) => {
  res.render('pages/forgot-password', { title: 'Forgot Password' });
};

exports.postSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const token = generateUserToken(user.id);
    res.cookie('user_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.redirect('/?login=1');
    }
    const token = generateUserToken(user.id);
    res.cookie('user_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'development' ? false : true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    const redirectUrl = req.body.redirect || '/';
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, redirect: redirectUrl });
    }
    return res.redirect(redirectUrl);
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ message: err.message });
    }
    return res.redirect('/');
  }
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const token = generateAdminToken(user.id);
    res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'development' ? false : true, sameSite: 'lax' });
    const redirectUrl = req.body.redirect || ADMIN_PATH;
    return res.json({ success: true, redirect: redirectUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.postForgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res.status(404).json({ message: 'No account with that email' });
    }
    res.json({ success: true, message: 'Password reset link sent (demo)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('user_token');
  req.user = null;
  res.redirect('/');
};

exports.adminLogout = (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin-auth-x9k2');
};

exports.googleCallback = (req, res) => {
  const token = generateUserToken(req.user.id);
  res.cookie('user_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect(req.query.state || '/');
};

exports.getProfile = async (req, res) => {
  res.render('pages/profile', { title: 'My Profile', user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await User.update({ name, phone }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  const orders = await Order.findAll({ where: { user: req.user.id }, order: [['createdAt', 'DESC']] });
  res.render('pages/orders', { title: 'My Orders', orders });
};