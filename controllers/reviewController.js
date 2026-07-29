const Review = require('../models/Review');
const Product = require('../models/Product');

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { product: productId, isApproved: true },
      order: [['createdAt', 'DESC']]
    });
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;
    res.json({ reviews, total, avgRating: Math.round(avgRating * 10) / 10 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ message: 'Name, rating, and comment are required' });
    }
    const review = await Review.create({
      product: productId,
      user: req.user?.id || null,
      name: name.trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      isApproved: true
    });
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
