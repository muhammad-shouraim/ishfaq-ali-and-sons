const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getShop = async (req, res) => {
  const categories = await Category.findAll({ where: { isActive: true } });
  res.render('pages/shop', { title: 'Shop', categories, query: req.query });
};

exports.getProducts = async (req, res) => {
  try {
    const { category, sort, minPrice, maxPrice, search, page = 1, limit = 36 } = req.query;
    const where = { isActive: true };
    if (category) {
      const catRecord = await Category.findOne({ where: { slug: category } });
      if (catRecord) where.category = catRecord.id;
    }
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    let order = [['createdAt', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'name_asc') order = [['name', 'ASC']];
    else if (sort === 'name_desc') order = [['name', 'DESC']];
    else if (sort === 'rating') order = [['ratings', 'DESC']];

    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }],
      order,
      offset: skip,
      limit: Number(limit)
    });
    res.json({ products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }]
    });
    if (!product) return res.redirect('/');
    const related = await Product.findAll({
      where: { category: product.category, id: { [Op.ne]: product.id }, isActive: true },
      limit: 4
    });
    res.render('pages/product', {
      title: product.name, product, related,
      metaDescription: product.shortDescription || product.description || 'ISHFAQ ALI & SONS - Premium Luxury Jewelry',
      metaKeywords: product.tags ? (Array.isArray(product.tags) ? product.tags.join(', ') : product.tags) : 'jewelry, luxury',
      ogTitle: product.name + ' | ISHFAQ ALI & SONS',
      ogDescription: (product.shortDescription || product.description || '').substring(0, 200),
      ogImage: product.images && product.images.length > 0 ? (typeof product.images === 'string' ? JSON.parse(product.images)[0] : product.images[0]) : '/images/logo.jpeg'
    });
  } catch (err) {
    res.redirect('/');
  }
};