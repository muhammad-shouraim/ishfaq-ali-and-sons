const Coupon = require('../models/Coupon');
const ActivityLog = require('../models/ActivityLog');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const query = search ? { code: { $regex: search, $options: 'i' } } : {};
    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query)
    ]);
    res.render('admin/pages/coupons', { title: 'Coupons', coupons, currentPage: page, totalPages: Math.ceil(total / limit), search, message: req.query.message, messageType: req.query.messageType });
  } catch (err) {
    res.render('admin/pages/coupons', { title: 'Coupons', coupons: [], currentPage: 1, totalPages: 0, search: '', message: 'Error loading coupons', messageType: 'danger' });
  }
};

exports.createForm = async (req, res) => {
  res.render('admin/pages/coupon-form', { title: 'Create Coupon', coupon: {} });
};

exports.create = async (req, res) => {
  try {
    const { code, type, value, minPurchase, maxDiscount, usageLimit, isActive, expiresAt } = req.body;
    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) return res.redirect('/admin/coupons?message=Coupon code already exists&messageType=danger');
    const coupon = await Coupon.create({ code, type, value, minPurchase: minPurchase || 0, maxDiscount: maxDiscount || undefined, usageLimit: usageLimit || undefined, isActive: isActive === 'on' || isActive === true, expiresAt: expiresAt || undefined });
    await ActivityLog.create({ user: req.user._id, action: 'create_coupon', resource: 'Coupon', resourceId: coupon._id, details: { code: coupon.code } });
    res.redirect('/admin/coupons?message=Coupon created successfully');
  } catch (err) {
    res.redirect('/admin/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.editForm = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.redirect('/admin/coupons?message=Coupon not found&messageType=danger');
    res.render('admin/pages/coupon-form', { title: 'Edit Coupon', coupon });
  } catch (err) {
    res.redirect('/admin/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.update = async (req, res) => {
  try {
    const { code, type, value, minPurchase, maxDiscount, usageLimit, isActive, expiresAt } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
    if (existing) return res.redirect('/admin/coupons?message=Coupon code already in use&messageType=danger');
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { code, type, value, minPurchase: minPurchase || 0, maxDiscount: maxDiscount || undefined, usageLimit: usageLimit || undefined, isActive: isActive === 'on' || isActive === true, expiresAt: expiresAt || undefined }, { new: true, runValidators: true });
    if (!coupon) return res.redirect('/admin/coupons?message=Coupon not found&messageType=danger');
    await ActivityLog.create({ user: req.user._id, action: 'update_coupon', resource: 'Coupon', resourceId: coupon._id, details: { code: coupon.code } });
    res.redirect('/admin/coupons?message=Coupon updated successfully');
  } catch (err) {
    res.redirect('/admin/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.delete = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.redirect('/admin/coupons?message=Coupon not found&messageType=danger');
    await ActivityLog.create({ user: req.user._id, action: 'delete_coupon', resource: 'Coupon', resourceId: coupon._id, details: { code: coupon.code } });
    res.redirect('/admin/coupons?message=Coupon deleted successfully');
  } catch (err) {
    res.redirect('/admin/coupons?message=Error deleting coupon&messageType=danger');
  }
};