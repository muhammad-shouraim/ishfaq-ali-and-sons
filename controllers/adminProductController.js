const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const ADMIN_PATH = require('../config/adminPath');
const { logAdminAction } = require('../utils/adminLogger');

function toArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === 'object') return Object.values(obj);
  return [];
}

exports.listProducts = async (req, res) => {
  try {
    const { search, category, isActive, isFeatured, sort, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === '1';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true' || isFeatured === '1';

    let order = [['createdAt', 'DESC']];
    if (sort === 'name') order = [['name', 'ASC']];
    else if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'stock') order = [['stock', 'ASC']];

    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }],
      order,
      offset: skip,
      limit: Number(limit)
    });
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const Setting = require('../models/Setting');
    const thresholdSetting = await Setting.findOne({ where: { key: 'low_stock_threshold' } });
    const lowStockThreshold = Number(thresholdSetting?.value) || 5;
    res.render('admin/pages/products', {
      title: 'Products', products, categories, total,
      pages: Math.ceil(total / Number(limit)), currentPage: Number(page), query: req.query,
      lowStockThreshold,
      search: req.query.search || '',
      filterCategory: req.query.category || '',
      message: req.query.message || '',
      messageType: req.query.messageType || 'success'
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.getCreateProduct = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const parentCategories = categories.filter(c => !c.parentId);
    res.render('admin/pages/product-form', {
      title: 'Create Product', categories, parentCategories, product: {}, isEditing: false
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = req.body;
    let newImages = req.files?.images ? req.files.images.map(f => f.secure_url || f.path) : [];
    let submittedImages = data.images ? (Array.isArray(data.images) ? data.images : [data.images]) : [];
    let allImages = [...newImages, ...submittedImages];
    const thumbnail = req.files?.thumbnail?.[0]?.secure_url || req.files?.thumbnail?.[0]?.path || data.thumbnail || '';
    const categoryId = data.subSubcategoryId || data.subcategoryId || data.categoryId;
    const product = await Product.create({
      name: data.name,
      slug: data.slug || '',
      sku: data.sku || '',
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      category: categoryId,
      price: Number(data.price) || 0,
      comparePrice: Number(data.comparePrice) || 0,
      stock: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      minOrderQty: Number(data.minOrderQty) || 1,
      maxOrderQty: Number(data.maxOrderQty) || 0,
      weight: data.weight || '',
      dimensions: data.dimensions || '',
      shippingClass: data.shippingClass || 'standard',
      returnPolicy: data.returnPolicy || '',
      warranty: data.warranty || '',
      isActive: true,
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      images: JSON.stringify(allImages),
      thumbnail,
      specifications: data.specifications ? JSON.stringify(toArray(data.specifications)) : '[]',
      seoKeywords: data.seoKeywords ? JSON.stringify(Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : '[]',
      variants: data.variants ? JSON.stringify(typeof data.variants === 'string' ? JSON.parse(data.variants) : toArray(data.variants)) : '[]'
    });
    await ActivityLog.create({ user: req.user.id, action: 'create_product', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name }), ip: req.ip });
    await logAdminAction(req, 'create_product', 'Product', product.id, product.name, `Created product "${product.name}"`);
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, product });
    } else {
      res.redirect(ADMIN_PATH + '/products?message=' + encodeURIComponent('Product created successfully') + '&messageType=success');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      const parentCategories = categories.filter(c => !c.parentId);
      res.status(500).render('admin/pages/product-form', {
        title: 'Create Product', categories, parentCategories, product: req.body, error: err.message, isEditing: false
      });
    }
  }
};

exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }]
    });
    if (!product) return res.redirect(ADMIN_PATH + '?message=&messageType=danger');
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const parentCategories = categories.filter(c => !c.parentId);
    const productData = product.toJSON();
    res.render('admin/pages/product-form', {
      title: 'Edit Product', product: productData, categories, parentCategories, isEditing: true
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=' + encodeURIComponent(err.message) + '&messageType=danger');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const data = req.body;
    let existingImages = [];
    try { existingImages = JSON.parse(product.images || '[]'); } catch (e) { existingImages = []; }
    let newImages = req.files?.images ? req.files.images.map(f => f.secure_url || f.path) : [];
    let submittedImages = data.images ? (Array.isArray(data.images) ? data.images : [data.images]) : [];
    let removeImages = data.removeImages ? (Array.isArray(data.removeImages) ? data.removeImages : [data.removeImages]) : [];
    let allImages = existingImages.filter(i => !removeImages.includes(i));
    allImages = [...allImages, ...newImages];
    // If hidden inputs were submitted (form with full image list), use those instead
    if (submittedImages.length > 0) {
      allImages = [...newImages, ...submittedImages.filter(i => !removeImages.includes(i))];
    }
    removeImages.forEach(url => {
      const fname = url.replace('/uploads/', '');
      const fp = require('path').join(__dirname, '..', 'public', 'uploads', fname);
      try { if (require('fs').existsSync(fp)) require('fs').unlinkSync(fp); } catch (e) {}
    });
    const thumbnail = req.files?.thumbnail?.[0]?.secure_url || req.files?.thumbnail?.[0]?.path || (data.removeThumbnail ? '' : (data.thumbnail || product.thumbnail));
    const categoryId = data.subSubcategoryId || data.subcategoryId || data.categoryId;
    await product.update({
      name: data.name,
      slug: data.slug || product.slug,
      sku: data.sku || product.sku,
      description: data.description || product.description,
      shortDescription: data.shortDescription || product.shortDescription,
      category: categoryId || product.category,
      price: data.price !== undefined ? Number(data.price) : product.price,
      comparePrice: data.comparePrice !== undefined ? Number(data.comparePrice) : product.comparePrice,
      stock: data.stock !== undefined ? Number(data.stock) : product.stock,
      lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : product.lowStockThreshold,
      minOrderQty: data.minOrderQty !== undefined ? Number(data.minOrderQty) : product.minOrderQty,
      maxOrderQty: data.maxOrderQty !== undefined ? Number(data.maxOrderQty) : product.maxOrderQty,
      weight: data.weight !== undefined ? data.weight : product.weight,
      dimensions: data.dimensions !== undefined ? data.dimensions : product.dimensions,
      shippingClass: data.shippingClass || product.shippingClass,
      returnPolicy: data.returnPolicy || product.returnPolicy,
      warranty: data.warranty || product.warranty,
      metaTitle: data.metaTitle || product.metaTitle,
      metaDescription: data.metaDescription || product.metaDescription,
      images: JSON.stringify(allImages),
      thumbnail,
      specifications: data.specifications ? JSON.stringify(toArray(data.specifications)) : product.specifications,
      seoKeywords: data.seoKeywords ? JSON.stringify(Array.isArray(data.seoKeywords) ? data.seoKeywords : data.seoKeywords.split(',').map(k => k.trim())) : product.seoKeywords,
      variants: data.variants ? JSON.stringify(typeof data.variants === 'string' ? JSON.parse(data.variants) : toArray(data.variants)) : product.variants
    });
    await ActivityLog.create({ user: req.user.id, action: 'update_product', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name }), ip: req.ip });
    await logAdminAction(req, 'update_product', 'Product', product.id, product.name, `Updated product "${product.name}"`);
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.json({ success: true, product });
    } else {
      res.redirect(ADMIN_PATH + '/products?message=' + encodeURIComponent('Product updated successfully') + '&messageType=success');
    }
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      res.status(500).json({ message: err.message });
    } else {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });
      const parentCategories = categories.filter(c => !c.parentId);
      res.status(500).render('admin/pages/product-form', {
        title: 'Edit Product', product: { ...req.body, id: req.params.id }, categories, parentCategories, error: err.message, isEditing: true
      });
    }
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.redirect(ADMIN_PATH + '/products?message=Product not found&messageType=danger');
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    const deleteFile = (ref) => {
      if (!ref) return;
      const fname = ref.replace('/uploads/', '');
      const fp = path.join(uploadDir, fname);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) {}
    };
    (product.images || []).forEach(deleteFile);
    deleteFile(product.thumbnail);
    await Product.destroy({ where: { id: req.params.id } });
    await ActivityLog.create({ user: req.user.id, action: 'delete_product', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name }), ip: req.ip });
    await logAdminAction(req, 'delete_product', 'Product', product.id, product.name, `Deleted product "${product.name}"`);
    res.redirect(ADMIN_PATH + '/products?message=Product deleted successfully&messageType=success');
  } catch (err) {
    res.redirect(ADMIN_PATH + '/products?message=Error: ' + err.message + '&messageType=danger');
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { action, ids, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No products selected' });

    let result;
    switch (action) {
      case 'delete':
        const products = await Product.findAll({ where: { id: ids }, attributes: ['id', 'images', 'thumbnail'] });
        result = await Product.destroy({ where: { id: ids } });
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        products.forEach(p => {
          const del = (ref) => { if (!ref) return; const f = path.join(uploadDir, ref.replace('/uploads/', '')); try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {} };
          (p.images || []).forEach(del);
          del(p.thumbnail);
        });
        await logAdminAction(req, 'bulk_delete', 'Product', 0, '', `Bulk deleted ${result} products`);
        break;
      case 'activate':
        result = await Product.update({ isActive: true }, { where: { id: ids } });
        await logAdminAction(req, 'bulk_activate', 'Product', 0, '', `Bulk activated ${result[0]} products`);
        break;
      case 'deactivate':
        result = await Product.update({ isActive: false }, { where: { id: ids } });
        await logAdminAction(req, 'bulk_deactivate', 'Product', 0, '', `Bulk deactivated ${result[0]} products`);
        break;
      case 'feature':
        result = await Product.update({ isFeatured: true }, { where: { id: ids } });
        break;
      case 'unfeature':
        result = await Product.update({ isFeatured: false }, { where: { id: ids } });
        break;
      case 'change_category':
        if (!value) return res.status(400).json({ message: 'No category specified' });
        result = await Product.update({ category: value }, { where: { id: ids } });
        await logAdminAction(req, 'bulk_change_category', 'Product', 0, '', `Bulk changed category for ${result[0]} products`);
        break;
      case 'price_adjust':
        if (!value || isNaN(value)) return res.status(400).json({ message: 'Invalid percentage' });
        const pct = Number(value);
        if (pct >= 0) {
          result = await Product.update({ price: sequelize.literal(`ROUND(price * ${1 + pct / 100}, 2)`) }, { where: { id: ids } });
        } else {
          result = await Product.update({ price: sequelize.literal(`ROUND(price * ${1 + pct / 100}, 2)`) }, { where: { id: ids } });
        }
        await logAdminAction(req, 'bulk_price_adjust', 'Product', 0, '', `Bulk price adjusted by ${pct}% for ${result[0]} products`);
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    res.json({ success: true, modifiedCount: result[0] || result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.manageVariants = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.variants = JSON.stringify(req.body.variants || []);
    await product.save();
    await ActivityLog.create({ user: req.user.id, action: 'update_variants', resource: 'Product', resourceId: product.id, details: JSON.stringify({ variantCount: req.body.variants?.length || 0 }), ip: req.ip });
    res.json({ success: true, variants: req.body.variants || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.duplicateProduct = async (req, res) => {
  try {
    const original = await Product.findByPk(req.params.id);
    if (!original) return res.status(404).json({ message: 'Product not found' });
    const dupData = { ...original.toJSON() };
    delete dupData.id; delete dupData.createdAt; delete dupData.updatedAt;
    dupData.name = `${original.name} (Copy)`;
    dupData.sku = original.sku ? `${original.sku}-COPY-${Date.now()}` : undefined;
    const product = await Product.create(dupData);
    await ActivityLog.create({ user: req.user.id, action: 'duplicate_product', resource: 'Product', resourceId: product.id, details: JSON.stringify({ originalId: original.id, name: product.name }), ip: req.ip });
    await logAdminAction(req, 'duplicate_product', 'Product', product.id, product.name, `Duplicated "${original.name}" as "${product.name}"`);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    await ActivityLog.create({ user: req.user.id, action: product.isActive ? 'activate_product' : 'deactivate_product', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name }), ip: req.ip });
    res.json({ success: true, isActive: product.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeImage = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: 'Image URL required' });
    let images = product.images || [];
    if (!images.includes(imageUrl)) return res.status(400).json({ success: false, message: 'Image not found on product' });
    images = images.filter(i => i !== imageUrl);
    product.images = JSON.stringify(images);
    if (product.thumbnail === imageUrl) product.thumbnail = '';
    await product.save();
    const fname = imageUrl.replace('/uploads/', '');
    const fp = require('path').join(__dirname, '..', 'public', 'uploads', fname);
    try { if (require('fs').existsSync(fp)) require('fs').unlinkSync(fp); } catch (e) {}
    await ActivityLog.create({ user: req.user.id, action: 'remove_product_image', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name, image: imageUrl }), ip: req.ip });
    await logAdminAction(req, 'remove_product_image', 'Product', product.id, product.name, `Removed image from product "${product.name}"`);
    res.json({ success: true, images: product.images, thumbnail: product.thumbnail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.scanBrokenImages = async (req, res) => {
  try {
    const products = await Product.findAll({ attributes: ['id', 'name', 'images', 'thumbnail'] });
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    const broken = [];
    for (const p of products) {
      const imgs = p.images || [];
      const allRefs = [...imgs];
      if (p.thumbnail && !allRefs.includes(p.thumbnail)) allRefs.push(p.thumbnail);
      const missing = allRefs.filter(ref => {
        if (!ref) return false;
        const fname = ref.replace('/uploads/', '');
        return !fs.existsSync(path.join(uploadDir, fname));
      });
      if (missing.length > 0) {
        broken.push({ id: p.id, name: p.name, images: imgs, thumbnail: p.thumbnail, missing });
      }
    }
    res.json({ success: true, broken, count: broken.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.fixBrokenImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    let images = product.images || [];
    images = images.filter(ref => {
      if (!ref) return false;
      const fname = ref.replace('/uploads/', '');
      return fs.existsSync(path.join(uploadDir, fname));
    });
    if (product.thumbnail) {
      const fname = product.thumbnail.replace('/uploads/', '');
      if (!fs.existsSync(path.join(uploadDir, fname))) {
        product.thumbnail = '';
      }
    }
    product.images = JSON.stringify(images);
    await product.save();
    await ActivityLog.create({ user: req.user.id, action: 'fix_broken_images', resource: 'Product', resourceId: product.id, details: JSON.stringify({ name: product.name }), ip: req.ip });
    res.json({ success: true, images: product.images, thumbnail: product.thumbnail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.apiListProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category) where.category = category;
    const skip = (Number(page) - 1) * Number(limit);
    const { count: total, rows: products } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['name', 'slug'], as: 'categoryData' }],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: Number(limit)
    });
    res.json({ success: true, products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};