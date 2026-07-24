const Review = require('../models/Review');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    const query = {};
    if (filter === 'approved') query.isApproved = true;
    else if (filter === 'pending') query.isApproved = false;
    else if (filter === 'rejected') query.isRejected = true;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('product', 'name slug thumbnail')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);

    res.render('admin/pages/reviews', {
      title: 'Reviews',
      reviews,
      currentFilter: filter,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    // msg: 'error', 'Error loading reviews');
    res.redirect('/admin');
  }
};

exports.approve = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('product');
    if (!review) {
      // msg: 'error', 'Review not found');
      return res.redirect('/admin/pages/reviews');
    }

    review.isApproved = !review.isApproved;
    review.isRejected = false;
    await review.save();

    if (review.product) {
      const stats = await Review.aggregate([
        { $match: { product: review.product._id, isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      if (stats.length > 0) {
        await Product.findByIdAndUpdate(review.product._id, {
          ratings: Math.round(stats[0].avgRating * 10) / 10,
          numReviews: stats[0].count
        });
      } else {
        await Product.findByIdAndUpdate(review.product._id, {
          ratings: 0,
          numReviews: 0
        });
      }
    }

    await ActivityLog.create({
      user: req.user._id,
      action: review.isApproved ? 'approve_review' : 'unapprove_review',
      resource: 'Review',
      resourceId: review._id,
      details: { product: review.product?.name }
    });

    // msg: 'success', `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully`);
    res.redirect('/admin/pages/reviews');
  } catch (err) {
    // msg: 'error', 'Error updating review');
    res.redirect('/admin/pages/reviews');
  }
};

exports.reject = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, {
      isApproved: false,
      isRejected: true,
      rejectedAt: new Date()
    }, { new: true }).populate('product');

    if (!review) {
      // msg: 'error', 'Review not found');
      return res.redirect('/admin/pages/reviews');
    }

    if (review.product) {
      const stats = await Review.aggregate([
        { $match: { product: review.product._id, isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      await Product.findByIdAndUpdate(review.product._id, {
        ratings: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        numReviews: stats.length > 0 ? stats[0].count : 0
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'reject_review',
      resource: 'Review',
      resourceId: review._id,
      details: { product: review.product?.name }
    });

    // msg: 'success', 'Review rejected successfully');
    res.redirect('/admin/pages/reviews');
  } catch (err) {
    // msg: 'error', 'Error rejecting review');
    res.redirect('/admin/pages/reviews');
  }
};

exports.reply = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      // msg: 'error', 'Reply cannot be empty');
      return res.redirect('/admin/pages/reviews');
    }

    const review = await Review.findByIdAndUpdate(req.params.id, {
      adminReply: reply.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id
    }, { new: true });

    if (!review) {
      // msg: 'error', 'Review not found');
      return res.redirect('/admin/pages/reviews');
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'reply_review',
      resource: 'Review',
      resourceId: review._id,
      details: { reply: reply.trim() }
    });

    // msg: 'success', 'Reply added successfully');
    res.redirect('/admin/pages/reviews');
  } catch (err) {
    // msg: 'error', 'Error adding reply');
    res.redirect('/admin/pages/reviews');
  }
};

exports.delete = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).populate('product');
    if (!review) {
      // msg: 'error', 'Review not found');
      return res.redirect('/admin/pages/reviews');
    }

    if (review.product) {
      const stats = await Review.aggregate([
        { $match: { product: review.product._id, isApproved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      await Product.findByIdAndUpdate(review.product._id, {
        ratings: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        numReviews: stats.length > 0 ? stats[0].count : 0
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_review',
      resource: 'Review',
      resourceId: review._id,
      details: { product: review.product?.name }
    });

    // msg: 'success', 'Review deleted successfully');
    res.redirect('/admin/pages/reviews');
  } catch (err) {
    // msg: 'error', 'Error deleting review');
    res.redirect('/admin/pages/reviews');
  }
};

exports.report = async (req, res) => {
  try {
    const [ratingStats, totalReviews, approvedReviews, pendingReviews] = await Promise.all([
      Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Review.countDocuments(),
      Review.countDocuments({ isApproved: true }),
      Review.countDocuments({ isApproved: false, isRejected: { $ne: true } })
    ]);

    const avgResult = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    const avgRating = avgResult.length > 0 ? Math.round(avgResult[0].avg * 10) / 10 : 0;

    const ratingBreakdown = {};
    for (let i = 1; i <= 5; i++) {
      const found = ratingStats.find(r => r._id === i);
      ratingBreakdown[i] = found ? found.count : 0;
    }

    res.render('admin/pages/reviews-report', {
      title: 'Reviews Report',
      avgRating,
      totalReviews,
      approvedReviews,
      pendingReviews,
      ratingBreakdown
    });
  } catch (err) {
    // msg: 'error', 'Error generating report');
    res.redirect('/admin/pages/reviews');
  }
};

