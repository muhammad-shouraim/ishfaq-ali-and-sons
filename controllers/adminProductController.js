const Product = require('../models/Product');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');

exports.listProducts = async (req, res) => {
  try {
    const { search, category, isActive, isFeatured, sort, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true' || isActive === '1';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true' || isFeatured === '1';

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    else if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'stock') sortOption = { stock: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total, categories] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
      Category.find().sort('name')
    ]);

    res.render('admin/pages/products', {
      title: 'Products',
      products,
      categories,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      query: req.query
    });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCreateProduct = async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.render('admin/pages/product-form', { title: 'Create Product', categories, product: {} });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = req.body;
    const images = req.files ? req.files.map(f => f.path.replace(/\\/g, '/').replace('public/', '')) : [];
    const thumbnail = images.length > 0 ? images[0] : (data.thumbnail || '');

    const productData = {
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      specifications: data.specifications ? (Array.isArray(data.specifications) ? data.specifications : JSON.parse(data.specifications)) : [],
      category: data.category,
      images,
      thumbnail,
      price: Number(data.price) || 0,
      comparePrice: Number(data.comparePrice) || 0,
      costPrice: Number(data.costPrice) || 0,
      stock: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      isActive: data.isActive === 'true' || data.isActive === 'on' || data.isActive === true,
      isFeatured: data.isFeatured === 'true' || data.isFeatured === 'on' || data.isFeatured === true,
      isTrending: data.isTrending === 'true' || data.isTrending === 'on' || data.isTrending === true,
      isNewArrival: data.isNewArrival === 'true' || data.isNewArrival === 'on' || data.isNewArrival === true,
      tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim())) : [],
      material: data.material || '',
      weight: data.weight || '',
      dimensions: data.dimensions || '',
      minOrderQty: Number(data.minOrderQty) || 1,
      maxOrderQty: Number(data.maxOrderQty) || 0,
      taxClass: data.taxClass || '',
      shippingClass: data.shippingClass || '',
      returnPolicy: data.returnPolicy || '',
      warranty: data.warranty || '',
      brand: data.brand || '',
      videoUrl: data.videoUrl || '',
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      seoKeywords: data.seoKeywords ? (Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : [],
      barcode: data.barcode || '',
      barcodeSymbol: data.barcodeSymbol || '',
      variants: data.variants ? (typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants) : []
    };

    const product = await Product.create(productData);

    await ActivityLog.create({ user: req.user._id, action: 'create_product', resource: 'Product', resourceId: product._id, details: { name: product.name }, ip: req.ip });

    if (req.xhr || req.headers.accept.includes('json')) {
      res.json({ success: true, product });
    } else {
      // msg: 'success', 'Product created successfully');
      res.redirect('/admin/products');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).render('admin/pages/product-form', { title: 'Create Product', categories: await Category.find().sort('name'), product: req.body, error: err.message });
    }
  }
};

exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.redirect('/admin?message=&messageType=danger');
    const categories = await Category.find().sort('name');
    res.render('admin/pages/product-form', { title: 'Edit Product', product, categories });
  } catch (err) {
    res.redirect('/admin?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const data = req.body;
    const newImages = req.files && req.files.length > 0
      ? req.files.map(f => f.path.replace(/\\/g, '/').replace('public/', ''))
      : [];

    const existingImages = data.existingImages
      ? (Array.isArray(data.existingImages) ? data.existingImages : [data.existingImages])
      : product.images || [];

    const images = [...existingImages, ...newImages];
    const thumbnail = data.thumbnail || images[0] || product.thumbnail || '';

    const updateData = {
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      specifications: data.specifications ? (Array.isArray(data.specifications) ? data.specifications : JSON.parse(data.specifications)) : [],
      category: data.category,
      images,
      thumbnail,
      price: Number(data.price) || 0,
      comparePrice: Number(data.comparePrice) || 0,
      costPrice: Number(data.costPrice) || 0,
      stock: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      isActive: data.isActive === 'true' || data.isActive === 'on' || data.isActive === true,
      isFeatured: data.isFeatured === 'true' || data.isFeatured === 'on' || data.isFeatured === true,
      isTrending: data.isTrending === 'true' || data.isTrending === 'on' || data.isTrending === true,
      isNewArrival: data.isNewArrival === 'true' || data.isNewArrival === 'on' || data.isNewArrival === true,
      tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim())) : [],
      material: data.material || '',
      weight: data.weight || '',
      dimensions: data.dimensions || '',
      minOrderQty: Number(data.minOrderQty) || 1,
      maxOrderQty: Number(data.maxOrderQty) || 0,
      taxClass: data.taxClass || '',
      shippingClass: data.shippingClass || '',
      returnPolicy: data.returnPolicy || '',
      warranty: data.warranty || '',
      brand: data.brand || '',
      videoUrl: data.videoUrl || '',
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      seoKeywords: data.seoKeywords ? (Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : [],
      barcode: data.barcode || '',
      barcodeSymbol: data.barcodeSymbol || '',
      variants: data.variants ? (typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants) : []
    };

    Object.assign(product, updateData);
    await product.save();

    await ActivityLog.create({ user: req.user._id, action: 'update_product', resource: 'Product', resourceId: product._id, details: { name: product.name }, ip: req.ip });

    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, product });
    } else {
      // msg: 'success', 'Product updated successfully');
      res.redirect('/admin/products');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const categories = await Category.find().sort('name');
      res.status(500).render('admin/pages/product-form', { title: 'Edit Product', product: { ...req.body, _id: req.params.id }, categories, error: err.message });
    }
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.images.forEach(img => {
      const imgPath = path.join(__dirname, '..', 'public', img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    await ActivityLog.create({ user: req.user._id, action: 'delete_product', resource: 'Product', resourceId: product._id, details: { name: product.name }, ip: req.ip });

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { action, ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No products selected' });

    let result;
    switch (action) {
      case 'delete':
        const products = await Product.find({ _id: { $in: ids } });
        products.forEach(p => {
          p.images.forEach(img => {
            const imgPath = path.join(__dirname, '..', 'public', img);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          });
        });
        result = await Product.deleteMany({ _id: { $in: ids } });
        await ActivityLog.create({ user: req.user._id, action: 'bulk_delete_products', resource: 'Product', details: { count: result.deletedCount, ids }, ip: req.ip });
        break;
      case 'activate':
        result = await Product.updateMany({ _id: { $in: ids } }, { isActive: true });
        await ActivityLog.create({ user: req.user._id, action: 'bulk_activate_products', resource: 'Product', details: { count: result.modifiedCount, ids }, ip: req.ip });
        break;
      case 'deactivate':
        result = await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
        await ActivityLog.create({ user: req.user._id, action: 'bulk_deactivate_products', resource: 'Product', details: { count: result.modifiedCount, ids }, ip: req.ip });
        break;
      case 'feature':
        result = await Product.updateMany({ _id: { $in: ids } }, { isFeatured: true });
        break;
      case 'unfeature':
        result = await Product.updateMany({ _id: { $in: ids } }, { isFeatured: false });
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ success: true, modifiedCount: result.modifiedCount || result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.manageVariants = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.variants = req.body.variants || [];
    await product.save();

    await ActivityLog.create({ user: req.user._id, action: 'update_variants', resource: 'Product', resourceId: product._id, details: { variantCount: product.variants.length }, ip: req.ip });

    res.json({ success: true, variants: product.variants });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Product not found' });

    const dup = original.toObject();
    delete dup._id;
    delete dup.slug;
    delete dup.createdAt;
    delete dup.updatedAt;
    dup.name = `${original.name} (Copy)`;
    dup.sku = original.sku ? `${original.sku}-COPY-${Date.now()}` : undefined;

    const product = await Product.create(dup);

    await ActivityLog.create({ user: req.user._id, action: 'duplicate_product', resource: 'Product', resourceId: product._id, details: { originalId: original._id, name: product.name }, ip: req.ip });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.isActive = !product.isActive;
    await product.save();

    await ActivityLog.create({ user: req.user._id, action: product.isActive ? 'activate_product' : 'deactivate_product', resource: 'Product', resourceId: product._id, details: { name: product.name }, ip: req.ip });

    res.json({ success: true, isActive: product.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.apiListProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



