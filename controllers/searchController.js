const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ products: [] });
    const products = await Product.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { tags: { [Op.like]: `%${q}%` } },
          { sku: { [Op.like]: `%${q}%` } }
        ]
      },
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }],
      limit: 10
    });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSearchPage = async (req, res) => {
  const { q } = req.query;
  res.render('pages/search', { title: q ? `Search: ${q}` : 'Search', query: q || '' });
};