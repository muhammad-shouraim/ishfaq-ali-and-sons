const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, default: '' },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  featuredImage: String,
  status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
  scheduledAt: Date,
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

pageSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);