const Product = require('../models/Product');

exports.getShop = async (req, res) => {
  const Category = require('../models/Category');
  const categories = await Category.find({ isActive: true });
  res.render('pages/shop', {
    title: 'Shop',
    categories,
    query: req.query
  });
};

exports.getProducts = async (req, res) => {
  try {
    const { category, sort, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name_asc') sortOption = { name: 1 };
    else if (sort === 'name_desc') sortOption = { name: -1 };
    else if (sort === 'rating') sortOption = { ratings: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) return res.status(404).render('pages/404', { message: 'Product not found' });
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4);
    res.render('pages/product', { title: product.name, product, related });
  } catch (err) {
    res.status(500).render('pages/404', { message: err.message });
  }
};