const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Media = sequelize.define('Media', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  filename: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  folder: { type: DataTypes.STRING, defaultValue: '/' },
  alt: { type: DataTypes.STRING },
  caption: { type: DataTypes.STRING },
  uploadedBy: { type: DataTypes.INTEGER }
});

module.exports = Media;