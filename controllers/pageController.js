const Category = require('../models/Category');

exports.getHome = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder');
  res.render('pages/home', { title: 'Home', categories });
};

exports.getAbout = (req, res) => {
  res.render('pages/about', { title: 'About Us' });
};

exports.getPrivacy = (req, res) => {
  res.render('pages/privacy', { title: 'Privacy Policy' });
};

exports.getTerms = (req, res) => {
  res.render('pages/terms', { title: 'Terms & Conditions' });
};

exports.getRefund = (req, res) => {
  res.render('pages/refund', { title: 'Refund Policy' });
};

exports.getShipping = (req, res) => {
  res.render('pages/shipping', { title: 'Shipping Policy' });
};

exports.get404 = (req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found' });
};