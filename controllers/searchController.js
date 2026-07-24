const Product = require('../models/Product');

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ products: [] });
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } }
      ]
    }).populate('category', 'name slug').limit(10).select('name slug price images thumbnail');
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSearchPage = async (req, res) => {
  const { q } = req.query;
  res.render('pages/search', { title: q ? `Search: ${q}` : 'Search', query: q || '' });
};