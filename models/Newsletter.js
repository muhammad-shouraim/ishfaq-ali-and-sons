const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Newsletter = sequelize.define('Newsletter', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = Newsletter;
