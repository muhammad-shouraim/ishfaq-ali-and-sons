const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

exports.getShop = async (req, res) => {
  const allCategories = await Category.findAll({
    where: { isActive: true },
    include: [{ model: Category, as: 'children' }],
    order: [['sortOrder', 'ASC']]
  });
  const parentCategories = allCategories.filter(c => !c.parentId).map(c => {
    const plain = c.get({ plain: true });
    plain.children = allCategories.filter(child => child.parentId === c.id);
    return plain;
  });
  res.render('pages/shop', { title: 'Shop', categories: parentCategories, query: req.query });
};

exports.getProducts = async (req, res) => {
  try {
    const { category, sort, minPrice, maxPrice, search, page = 1, limit = 36 } = req.query;
    const where = { isActive: true };
    if (category) {
      const catRecord = await Category.findOne({ where: { slug: category } });
      if (catRecord) {
        const ids = [catRecord.id];
        if (!catRecord.parentId) {
          const children = await Category.findAll({ where: { parentId: catRecord.id } });
          children.forEach(c => ids.push(c.id));
        }
        where.category = { [Op.in]: ids };
      }
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
    let product;
    try {
      product = await Product.findOne({ where: { slug: req.params.slug } });
    } catch (slugErr) {
      console.error('getProduct slug lookup error (column may be missing):', slugErr.message);
    }
    if (!product && /^\d+$/.test(req.params.slug)) {
      product = await Product.findByPk(Number(req.params.slug));
    }
    if (!product) {
      return res.status(404).render('pages/404', { title: 'Product Not Found', message: 'The requested product could not be found.' });
    }
    const productData = product.toJSON();
    if (productData.category) {
      try {
        const cat = await Category.findByPk(productData.category, { attributes: ['name', 'slug'] });
        if (cat) productData.categoryData = cat.toJSON();
      } catch (catErr) {
        console.error('Category lookup error:', catErr.message);
      }
    }
    let reviews = [], reviewTotal = 0, reviewAvg = 0;
    try {
      reviews = await Review.findAll({
        where: { product: productData.id, isApproved: true },
        order: [['createdAt', 'DESC']]
      });
      reviewTotal = reviews.length;
      reviewAvg = reviewTotal > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviewTotal) : 0;
    } catch (revErr) {
      console.error('Reviews query error (table may need migration):', revErr.message);
    }
    const related = await Product.findAll({
      where: { category: productData.category, id: { [Op.ne]: productData.id }, isActive: true },
      limit: 4
    });
    res.render('pages/product', {
      title: productData.name, product: productData, related,
      reviews, reviewTotal, reviewAvg: Math.round(reviewAvg * 10) / 10,
      metaDescription: productData.shortDescription || productData.description || 'ISHFAQ ALI & SONS - Premium Luxury Jewelry',
      metaKeywords: productData.tags ? (Array.isArray(productData.tags) ? productData.tags.join(', ') : productData.tags) : 'jewelry, luxury',
      ogTitle: productData.name + ' | ISHFAQ ALI & SONS',
      ogDescription: (productData.shortDescription || productData.description || '').substring(0, 200),
      ogImage: productData.images && productData.images.length > 0 ? productData.images[0] : '/images/logo.jpeg'
    });
  } catch (err) {
    console.error('getProduct error:', err);
    res.redirect('/');
  }
};

