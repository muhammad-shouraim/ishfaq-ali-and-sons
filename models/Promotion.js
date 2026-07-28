const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Promotion = sequelize.define('Promotion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  discountPercent: { type: DataTypes.INTEGER, defaultValue: 0 },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  bannerImage: { type: DataTypes.STRING, defaultValue: '' },
  linkUrl: { type: DataTypes.STRING, defaultValue: '/shop' }
});

module.exports = Promotion;
