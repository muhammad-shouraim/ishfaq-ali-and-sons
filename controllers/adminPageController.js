const Page = require('../models/Page');
const ActivityLog = require('../models/ActivityLog');

exports.list = async (req, res) => {
  try {
    const filter = req.query.status || 'all';
    const query = {};
    if (filter !== 'all') query.status = filter;
    const pages = await Page.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.render('admin/pages/pages', { title: 'Pages', pages, currentFilter: filter });
  } catch (err) {
    res.render('admin/pages/pages', { title: 'Pages', pages: [], currentFilter: 'all', message: 'Error loading pages: ' + err.message, messageType: 'danger' });
  }
};

exports.createForm = async (req, res) => {
  res.render('admin/pages/page-form', { title: 'Create Page', page: {}, useEditor: true });
};

exports.create = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, metaKeywords, featuredImage, status, scheduledAt, displayOrder } = req.body;
    let slug = req.body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Page.findOne({ slug });
    if (existing) slug = slug + '-' + Date.now();
    const page = await Page.create({ title, slug, content: content || '', metaTitle: metaTitle || '', metaDescription: metaDescription || '', metaKeywords: metaKeywords || '', featuredImage: featuredImage || '', status: status || 'draft', scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt) : undefined, displayOrder: displayOrder || 0 });
    await ActivityLog.create({ user: req.user._id, action: 'create_page', resource: 'Page', resourceId: page._id, details: { title: page.title, slug: page.slug } });
    res.redirect('/admin/pages?message=Page created successfully');
  } catch (err) {
    res.render('admin/pages/page-form', { title: 'Create Page', page: req.body, useEditor: true, message: 'Error: ' + err.message, messageType: 'danger' });
  }
};

exports.editForm = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.redirect('/admin/pages?message=Page not found&messageType=danger');
    res.render('admin/pages/page-form', { title: 'Edit Page', page, useEditor: true });
  } catch (err) {
    res.redirect('/admin/pages?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription, metaKeywords, featuredImage, status, scheduledAt, displayOrder } = req.body;
    const pageSlug = req.body.slug ? req.body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dup = await Page.findOne({ slug: pageSlug, _id: { $ne: req.params.id } });
    if (dup) return res.redirect('/admin/pages?message=A page with this slug already exists&messageType=danger');
    const page = await Page.findByIdAndUpdate(req.params.id, { title, slug: pageSlug, content: content || '', metaTitle: metaTitle || '', metaDescription: metaDescription || '', metaKeywords: metaKeywords || '', featuredImage: featuredImage || '', status: status || 'draft', scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt) : undefined, displayOrder: displayOrder || 0 }, { new: true, runValidators: true });
    if (!page) return res.redirect('/admin/pages?message=Page not found&messageType=danger');
    await ActivityLog.create({ user: req.user._id, action: 'update_page', resource: 'Page', resourceId: page._id, details: { title: page.title } });
    res.redirect('/admin/pages?message=Page updated successfully');
  } catch (err) {
    res.redirect('/admin/pages?message=Error updating page: ' + err.message + '&messageType=danger');
  }
};

exports.delete = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.redirect('/admin/pages?message=Page not found&messageType=danger');
    await ActivityLog.create({ user: req.user._id, action: 'delete_page', resource: 'Page', resourceId: page._id, details: { title: page.title } });
    res.redirect('/admin/pages?message=Page deleted successfully');
  } catch (err) {
    res.redirect('/admin/pages?message=Error deleting page&messageType=danger');
  }
};