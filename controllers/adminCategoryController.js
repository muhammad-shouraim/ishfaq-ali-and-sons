const { Op } = require('sequelize');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const ADMIN_PATH = require('../config/adminPath');

exports.listCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: categories } = await Category.findAndCountAll({
      include: [
        { model: Category, as: 'parent', attributes: ['name'] }
      ],
      order: [['sortOrder', 'ASC']],
      offset: skip,
      limit: Number(limit),
      distinct: true
    });
    const Product = require('../models/Product');
    const mapped = await Promise.all(categories.map(async (c) => {
      const plain = c.get({ plain: true });
      const productsCount = await Product.count({ where: { category: c.id } });
      return { ...plain, parentName: plain.parent ? plain.parent.name : null, displayOrder: plain.sortOrder, productsCount };
    }));
    res.render('admin/pages/categories', {
      title: 'Categories', categories: mapped, total,
      pages: Math.ceil(total / Number(limit)), currentPage: Number(page)
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCreateCategory = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { parentId: null }, order: [['name', 'ASC']] });
    res.render('admin/pages/category-form', { title: 'Create Category', category: {}, categories, isEditing: false });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const data = req.body;
    const imageUrl = req.files?.image?.[0]?.secure_url || req.files?.image?.[0]?.path || data.image || '';
    const category = await Category.create({
      name: data.name,
      description: data.description || '',
      image: imageUrl,
      icon: data.icon || '',
      parentId: data.parentId || null,
      isActive: data.isActive === 'true' || data.isActive === 'on' || data.isActive === true,
      sortOrder: Number(data.sortOrder || data.displayOrder) || 0
    });
    await ActivityLog.create({ user: req.user.id, action: 'create_category', resource: 'Category', resourceId: category.id, details: JSON.stringify({ name: category.name }), ip: req.ip });
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, category });
    } else {
      res.redirect(ADMIN_PATH + '/categories');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const categories = await Category.findAll({ where: { parentId: null }, order: [['name', 'ASC']] });
      res.status(500).render('admin/pages/category-form', { title: 'Create Category', category: req.body, categories, isEditing: false, error: err.message });
    }
  }
};

exports.getEditCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const categories = await Category.findAll({ where: { id: { [Op.ne]: category.id }, parentId: null }, order: [['name', 'ASC']] });
    res.render('admin/pages/category-form', { title: 'Edit Category', category, categories, isEditing: true });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const imageUrl = req.files?.image?.[0]?.secure_url || req.files?.image?.[0]?.path || req.body.image || category.image;
    await category.update({
      name: req.body.name || category.name,
      description: req.body.description || '',
      image: imageUrl,
      icon: req.body.icon || '',
      parentId: req.body.parentId || null,
      isActive: req.body.isActive === 'true' || req.body.isActive === 'on' || req.body.isActive === true,
      sortOrder: Number(req.body.sortOrder || req.body.displayOrder) || 0
    });
    await ActivityLog.create({ user: req.user.id, action: 'update_category', resource: 'Category', resourceId: category.id, details: JSON.stringify({ name: category.name }), ip: req.ip });
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, category });
    } else {
      res.redirect(ADMIN_PATH + '/categories');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).render('admin/pages/category-form', { title: 'Edit Category', category: { ...req.body, id: req.params.id }, error: err.message });
    }
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const productsCount = await Product.count({ where: { category: category.id } });
    if (productsCount > 0) {
      return res.status(400).json({ message: `Cannot delete category. ${productsCount} products are assigned to it.` });
    }
    await Category.destroy({ where: { id: req.params.id } });
    await ActivityLog.create({ user: req.user.id, action: 'delete_category', resource: 'Category', resourceId: category.id, details: JSON.stringify({ name: category.name }), ip: req.ip });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};