const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Page = sequelize.define('Page', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true },
  content: { type: DataTypes.TEXT, defaultValue: '' },
  metaTitle: { type: DataTypes.STRING },
  metaDescription: { type: DataTypes.TEXT },
  metaKeywords: { type: DataTypes.STRING },
  featuredImage: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('draft', 'published', 'scheduled'), defaultValue: 'draft' },
  scheduledAt: { type: DataTypes.DATE },
  displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  hooks: {
    beforeSave: (page) => {
      if (!page.slug) {
        page.slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
  }
});

module.exports = Page;