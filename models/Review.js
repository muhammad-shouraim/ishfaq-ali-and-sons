const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product: { type: DataTypes.INTEGER, allowNull: false },
  user: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING },
  comment: { type: DataTypes.TEXT, allowNull: false },
  isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
  adminReply: { type: DataTypes.TEXT },
  repliedAt: { type: DataTypes.DATE },
  repliedBy: { type: DataTypes.INTEGER }
}, {
  indexes: [
    { unique: true, fields: ['product', 'user'] }
  ]
});

module.exports = Review;