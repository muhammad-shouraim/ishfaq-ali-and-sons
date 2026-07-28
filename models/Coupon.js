const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
  value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  minPurchase: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  maxDiscount: { type: DataTypes.DECIMAL(12, 2) },
  usageLimit: { type: DataTypes.INTEGER },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalDiscount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  expiresAt: { type: DataTypes.DATE }
});

module.exports = Coupon;