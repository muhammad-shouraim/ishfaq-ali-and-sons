const Category = require('../models/Category');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');

exports.listCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [categories, total] = await Promise.all([
      Category.find().sort('sortOrder').skip(skip).limit(Number(limit)),
      Category.countDocuments()
    ]);

    res.render('admin/pages/categories', {
      title: 'Categories',
      categories,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCreateCategory = async (req, res) => {
  try {
    const parentCategories = await Category.find({ isActive: true }).sort('name');
    res.render('admin/pages/category-form', { title: 'Create Category', category: {}, parentCategories });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const data = req.body;
    const image = req.files?.image ? req.files.image[0].path.replace(/\\/g, '/').replace('public/', '') : '';
    const banner = req.files?.banner ? req.files.banner[0].path.replace(/\\/g, '/').replace('public/', '') : '';

    const categoryData = {
      name: data.name,
      description: data.description || '',
      image: image || data.image || '',
      banner: banner || data.banner || '',
      icon: data.icon || '',
      parent: data.parent || null,
      isActive: data.isActive === 'true' || data.isActive === 'on' || data.isActive === true,
      displayOrder: Number(data.displayOrder) || 0,
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      seoKeywords: data.seoKeywords ? (Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : []
    };

    const category = await Category.create(categoryData);

    await ActivityLog.create({ user: req.user._id, action: 'create_category', resource: 'Category', resourceId: category._id, details: { name: category.name }, ip: req.ip });

    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, category });
    } else {
      // msg: 'success', 'Category created successfully');
      res.redirect('/admin/categories');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const parentCategories = await Category.find({ isActive: true }).sort('name');
      res.status(500).render('admin/pages/category-form', { title: 'Create Category', category: req.body, parentCategories, error: err.message });
    }
  }
};

exports.getEditCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.redirect('/admin?message=&messageType=danger');
    const parentCategories = await Category.find({ _id: { $ne: category._id }, isActive: true }).sort('name');
    res.render('admin/pages/category-form', { title: 'Edit Category', category, parentCategories });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const data = req.body;
    const image = req.files?.image ? req.files.image[0].path.replace(/\\/g, '/').replace('public/', '') : null;
    const banner = req.files?.banner ? req.files.banner[0].path.replace(/\\/g, '/').replace('public/', '') : null;

    if (image) {
      if (category.image && fs.existsSync(path.join(__dirname, '..', 'public', category.image))) {
        fs.unlinkSync(path.join(__dirname, '..', 'public', category.image));
      }
      category.image = image;
    }

    if (banner) {
      if (category.banner && fs.existsSync(path.join(__dirname, '..', 'public', category.banner))) {
        fs.unlinkSync(path.join(__dirname, '..', 'public', category.banner));
      }
      category.banner = banner;
    }

    category.name = data.name || category.name;
    category.description = data.description || '';
    category.icon = data.icon || '';
    category.parent = data.parent || null;
    category.isActive = data.isActive === 'true' || data.isActive === 'on' || data.isActive === true;
    category.displayOrder = Number(data.displayOrder) || 0;
    category.metaTitle = data.metaTitle || '';
    category.metaDescription = data.metaDescription || '';
    category.seoKeywords = data.seoKeywords ? (Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : [];

    await category.save();

    await ActivityLog.create({ user: req.user._id, action: 'update_category', resource: 'Category', resourceId: category._id, details: { name: category.name }, ip: req.ip });

    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, category });
    } else {
      // msg: 'success', 'Category updated successfully');
      res.redirect('/admin/categories');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const parentCategories = await Category.find({ _id: { $ne: req.params.id }, isActive: true }).sort('name');
      res.status(500).render('admin/pages/category-form', { title: 'Edit Category', category: { ...req.body, _id: req.params.id }, parentCategories, error: err.message });
    }
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
      return res.status(400).json({ message: `Cannot delete category. ${productsCount} products are assigned to it.` });
    }

    if (category.image && fs.existsSync(path.join(__dirname, '..', 'public', category.image))) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', category.image));
    }
    if (category.banner && fs.existsSync(path.join(__dirname, '..', 'public', category.banner))) {
      fs.unlinkSync(path.join(__dirname, '..', 'public', category.banner));
    }

    await Category.findByIdAndDelete(req.params.id);

    await ActivityLog.create({ user: req.user._id, action: 'delete_category', resource: 'Category', resourceId: category._id, details: { name: category.name }, ip: req.ip });

    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



