const { Op } = require('sequelize');
const Coupon = require('../models/Coupon');
const ActivityLog = require('../models/ActivityLog');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const where = search ? { code: { [Op.like]: `%${search}%` } } : {};
    const { count: total, rows: coupons } = await Coupon.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit
    });
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
    const exists = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (exists) return res.redirect(ADMIN_PATH + '/coupons?message=Coupon code already exists&messageType=danger');
    await Coupon.create({
      code, type, value, minPurchase: minPurchase || 0, maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null, isActive: isActive === 'on' || isActive === true, expiresAt: expiresAt || null
    });
    res.redirect(ADMIN_PATH + '/coupons?message=Coupon created successfully');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.editForm = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.redirect(ADMIN_PATH + '/coupons?message=Coupon not found&messageType=danger');
    res.render('admin/pages/coupon-form', { title: 'Edit Coupon', coupon });
  } catch (err) {
    res.redirect(ADMIN_PATH + '/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.update = async (req, res) => {
  try {
    const { code, type, value, minPurchase, maxDiscount, usageLimit, isActive, expiresAt } = req.body;
    const existing = await Coupon.findOne({ where: { code: code.toUpperCase(), id: { [Op.ne]: req.params.id } } });
    if (existing) return res.redirect(ADMIN_PATH + '/coupons?message=Coupon code already in use&messageType=danger');
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.redirect(ADMIN_PATH + '/coupons?message=Coupon not found&messageType=danger');
    await coupon.update({
      code, type, value, minPurchase: minPurchase || 0, maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null, isActive: isActive === 'on' || isActive === true, expiresAt: expiresAt || null
    });
    res.redirect(ADMIN_PATH + '/coupons?message=Coupon updated successfully');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/coupons?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.delete = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.redirect(ADMIN_PATH + '/coupons?message=Coupon not found&messageType=danger');
    await Coupon.destroy({ where: { id: req.params.id } });
    res.redirect(ADMIN_PATH + '/coupons?message=Coupon deleted successfully');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/coupons?message=Error deleting coupon&messageType=danger');
  }
};