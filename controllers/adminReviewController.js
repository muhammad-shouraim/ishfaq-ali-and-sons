const { Op } = require('sequelize');
const Review = require('../models/Review');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';
    const where = {};
    if (filter === 'pending') where.isApproved = false;
    if (filter === 'approved') where.isApproved = true;
    const { count: total, rows: reviews } = await Review.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit
    });
    res.render('admin/pages/reviews', {
      title: 'Reviews', reviews, currentPage: page, totalPages: Math.ceil(total / limit), filter,
      search: req.query.search || ''
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=Error loading reviews&messageType=danger');
  }
};

exports.approve = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.isApproved = true;
    await review.save();
    const avgRating = await Review.findOne({
      attributes: [[require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg']],
      where: { product: review.product, isApproved: true },
      raw: true
    });
    const count = await Review.count({ where: { product: review.product, isApproved: true } });
    await Product.update({ ratings: Number(avgRating?.avg || 0).toFixed(2), numReviews: count }, { where: { id: review.product } });
    res.json({ success: true, message: 'Review approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reply = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.adminReply = req.body.reply;
    review.repliedAt = new Date();
    review.repliedBy = req.user.id;
    await review.save();
    res.json({ success: true, message: 'Reply added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await Review.destroy({ where: { id: req.params.id } });
    const avgRating = await Review.findOne({
      attributes: [[require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg']],
      where: { product: review.product, isApproved: true },
      raw: true
    });
    const count = await Review.count({ where: { product: review.product, isApproved: true } });
    await Product.update({ ratings: Number(avgRating?.avg || 0).toFixed(2), numReviews: count }, { where: { id: review.product } });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};