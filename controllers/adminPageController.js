const { Op } = require('sequelize');
const Page = require('../models/Page');
const ActivityLog = require('../models/ActivityLog');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  try {
    const filter = req.query.status || 'all';
    const where = {};
    if (filter !== 'all') where.status = filter;
    const pages = await Page.findAll({ where, order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']] });
    res.render('admin/pages/pages', { title: 'Pages', pages, filter });
  } catch (err) {
    // msg: 'error', 'Error loading pages');
    res.redirect(ADMIN_PATH + '');
  }
};

exports.createForm = async (req, res) => {
  res.render('admin/pages/page-form', { title: 'Create Page', page: {} });
};

exports.create = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, metaKeywords, status, displayOrder, scheduledAt } = req.body;
    const featuredImage = req.file?.secure_url || req.file?.path || req.body.featuredImage || '';
    const page = await Page.create({
      title, content: content || '', metaTitle, metaDescription, metaKeywords,
      status: status || 'draft', displayOrder: Number(displayOrder) || 0,
      featuredImage, scheduledAt: scheduledAt || null
    });
    await ActivityLog.create({ user: req.user.id, action: 'create_page', resource: 'Page', resourceId: page.id, details: JSON.stringify({ title: page.title }), ip: req.ip });
    // msg: 'success', 'Page created successfully');
    res.redirect(ADMIN_PATH + '/pages');
  } catch (err) {
    // msg: 'error', 'Error: ' + err.message);
    res.redirect(ADMIN_PATH + '/pages');
  }
};

exports.editForm = async (req, res) => {
  try {
    const page = await Page.findByPk(req.params.id);
    if (!page) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    res.render('admin/pages/page-form', { title: 'Edit Page', page });
  } catch (err) {
    // msg: 'error', 'Error loading page');
    res.redirect(ADMIN_PATH + '/pages');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, metaKeywords, status, displayOrder, scheduledAt } = req.body;
    const page = await Page.findByPk(req.params.id);
    if (!page) return res.redirect(ADMIN_PATH + '/pages?message=Page not found&messageType=danger');
    const featuredImage = req.file?.secure_url || req.file?.path || req.body.featuredImage || page.featuredImage;
    await page.update({
      title, content: content || '', metaTitle, metaDescription, metaKeywords,
      status: status || 'draft', displayOrder: Number(displayOrder) || 0,
      featuredImage, scheduledAt: scheduledAt || null
    });
    await ActivityLog.create({ user: req.user.id, action: 'update_page', resource: 'Page', resourceId: page.id, details: JSON.stringify({ title: page.title }), ip: req.ip });
    // msg: 'success', 'Page updated successfully');
    res.redirect(ADMIN_PATH + '/pages');
  } catch (err) {
    // msg: 'error', 'Error: ' + err.message);
    res.redirect(ADMIN_PATH + '/pages');
  }
};

exports.delete = async (req, res) => {
  try {
    const page = await Page.findByPk(req.params.id);
    if (!page) return res.redirect(ADMIN_PATH + '/pages?message=Page not found&messageType=danger');
    await Page.destroy({ where: { id: req.params.id } });
    await ActivityLog.create({ user: req.user.id, action: 'delete_page', resource: 'Page', resourceId: page.id, details: JSON.stringify({ title: page.title }), ip: req.ip });
    // msg: 'success', 'Page deleted successfully');
    res.redirect(ADMIN_PATH + '/pages');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/pages?message=Error deleting page&messageType=danger');
  }
};