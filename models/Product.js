const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  sku: { type: String, unique: true },
  barcode: { type: String },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  specifications: [{ label: String, value: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: String, default: '' },
  brand: { type: String, default: '' },
  images: [{ type: String }],
  thumbnail: { type: String },
  videoUrl: { type: String, default: '' },
  price: { type: Number, required: true },
  comparePrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  minOrderQty: { type: Number, default: 1 },
  maxOrderQty: { type: Number, default: 0 },
  weight: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  taxClass: { type: String, default: 'standard' },
  shippingClass: { type: String, default: 'standard' },
  returnPolicy: { type: String, default: '' },
  warranty: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isSale: { type: Boolean, default: false },
  tags: [String],
  material: { type: String, default: '' },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  metaTitle: String,
  metaDescription: String,
  seoKeywords: [String],
  variants: [{
    name: String,
    sku: String,
    price: Number,
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

productSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!this.sku) {
    this.sku = `IAS-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);