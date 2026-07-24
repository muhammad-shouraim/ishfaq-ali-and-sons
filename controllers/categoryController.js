const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder');
  res.render('pages/categories', { title: 'Categories', categories });
};

exports.getCategoryDetail = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).render('pages/404', { message: 'Category not found' });
  res.render('pages/category-detail', { title: category.name, category });
};