const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/sequelize');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true },
  sku: { type: DataTypes.STRING, unique: true },
  barcode: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  shortDescription: { type: DataTypes.TEXT, defaultValue: '' },
  specifications: { type: DataTypes.TEXT, defaultValue: '[]', get() { const r = this.getDataValue('specifications'); if (r && typeof r === 'string') { try { return JSON.parse(r); } catch { return []; } } return r || []; }, set(v) { this.setDataValue('specifications', typeof v === 'string' ? v : JSON.stringify(v)); } },
  category: { type: DataTypes.INTEGER },
  subcategory: { type: DataTypes.STRING, defaultValue: '' },
  brand: { type: DataTypes.STRING, defaultValue: '' },
  images: { type: DataTypes.TEXT, defaultValue: '[]', get() { const r = this.getDataValue('images'); if (r && typeof r === 'string') { try { return JSON.parse(r); } catch { return []; } } return r || []; }, set(v) { this.setDataValue('images', typeof v === 'string' ? v : JSON.stringify(v)); } },
  thumbnail: { type: DataTypes.STRING },
  videoUrl: { type: DataTypes.STRING, defaultValue: '' },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  comparePrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  costPrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
  minOrderQty: { type: DataTypes.INTEGER, defaultValue: 1 },
  maxOrderQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  weight: { type: DataTypes.STRING, defaultValue: '' },
  dimensions: { type: DataTypes.STRING, defaultValue: '' },
  taxClass: { type: DataTypes.STRING, defaultValue: 'standard' },
  shippingClass: { type: DataTypes.STRING, defaultValue: 'standard' },
  returnPolicy: { type: DataTypes.TEXT, defaultValue: '' },
  warranty: { type: DataTypes.TEXT, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isTrending: { type: DataTypes.BOOLEAN, defaultValue: false },
  isNewArrival: { type: DataTypes.BOOLEAN, defaultValue: false },
  isSale: { type: DataTypes.BOOLEAN, defaultValue: false },
  tags: { type: DataTypes.TEXT, defaultValue: '[]', get() { const r = this.getDataValue('tags'); if (r && typeof r === 'string') { try { return JSON.parse(r); } catch { return []; } } return r || []; }, set(v) { this.setDataValue('tags', typeof v === 'string' ? v : JSON.stringify(v)); } },
  material: { type: DataTypes.STRING, defaultValue: '' },
  ratings: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  metaTitle: { type: DataTypes.STRING },
  metaDescription: { type: DataTypes.TEXT },
  seoKeywords: { type: DataTypes.TEXT, defaultValue: '[]', get() { const r = this.getDataValue('seoKeywords'); if (r && typeof r === 'string') { try { return JSON.parse(r); } catch { return []; } } return r || []; }, set(v) { this.setDataValue('seoKeywords', typeof v === 'string' ? v : JSON.stringify(v)); } },
  variants: { type: DataTypes.TEXT, defaultValue: '[]', get() { const r = this.getDataValue('variants'); if (r && typeof r === 'string') { try { return JSON.parse(r); } catch { return []; } } return r || []; }, set(v) { this.setDataValue('variants', typeof v === 'string' ? v : JSON.stringify(v)); } }
}, {
  hooks: {
    beforeSave: async (product) => {
      if (!product.slug) {
        product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      const existingSlug = await Product.findOne({ where: { slug: product.slug, id: { [Op.ne]: product.id || 0 } } });
      if (existingSlug) product.slug += '-' + Date.now();
      if (!product.sku) {
        product.sku = `IAS-${Date.now()}`;
      } else {
        const existingSku = await Product.findOne({ where: { sku: product.sku, id: { [Op.ne]: product.id || 0 } } });
        if (existingSku) product.sku += '-' + Date.now();
      }
    }
  }
});

Product.prototype.toJSON = function() {
  const values = { ...this.get() };
  ['images', 'tags', 'specifications', 'seoKeywords', 'variants'].forEach(f => {
    if (values[f] && typeof values[f] === 'string') {
      try { values[f] = JSON.parse(values[f]); } catch { values[f] = []; }
    }
  });
  return values;
};

module.exports = Product;