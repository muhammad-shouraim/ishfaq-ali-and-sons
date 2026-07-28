const Promotion = require('../models/Promotion');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  const promotions = await Promotion.findAll({ order: [['createdAt', 'DESC']] });
  res.render('admin/pages/promotions', { title: 'Promotions', promotions });
};

exports.createForm = (req, res) => {
  res.render('admin/pages/promotion-form', { title: 'New Promotion', promotion: null });
};

exports.create = async (req, res) => {
  try {
    await Promotion.create(req.body);
    res.redirect(ADMIN_PATH + '/promotions');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/promotions/create?error=' + encodeURIComponent(err.message));
  }
};

exports.editForm = async (req, res) => {
  const promotion = await Promotion.findByPk(req.params.id);
  if (!promotion) return res.redirect(ADMIN_PATH + '/promotions');
  res.render('admin/pages/promotion-form', { title: 'Edit Promotion', promotion });
};

exports.update = async (req, res) => {
  try {
    await Promotion.update(req.body, { where: { id: req.params.id } });
    res.redirect(ADMIN_PATH + '/promotions');
  } catch (err) {
    res.redirect(ADMIN_PATH + `/promotions/edit/${req.params.id}?error=` + encodeURIComponent(err.message));
  }
};

exports.toggle = async (req, res) => {
  const promotion = await Promotion.findByPk(req.params.id);
  if (promotion) { promotion.isActive = !promotion.isActive; await promotion.save(); }
  res.redirect(ADMIN_PATH + '/promotions');
};

exports.delete = async (req, res) => {
  await Promotion.destroy({ where: { id: req.params.id } });
  res.redirect(ADMIN_PATH + '/promotions');
};
