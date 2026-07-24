const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
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
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, redirect: req.body.redirect || '/' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postForgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'No account with that email' });
    }
    res.json({ success: true, message: 'Password reset link sent (demo)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

exports.googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect(req.query.state || '/');
};

exports.getProfile = async (req, res) => {
  res.render('pages/profile', { title: 'My Profile', user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  const Order = require('../models/Order');
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.render('pages/orders', { title: 'My Orders', orders });
};