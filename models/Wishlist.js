const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user: { type: DataTypes.INTEGER },
  sessionId: { type: DataTypes.STRING },
  items: { type: DataTypes.TEXT, defaultValue: '[]' }
});

Wishlist.prototype.toJSON = function() {
  const values = { ...this.get() };
  if (values.items && typeof values.items === 'string') {
    try { values.items = JSON.parse(values.items); } catch { values.items = []; }
  }
  return values;
};

module.exports = Wishlist;