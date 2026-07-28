const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING, allowNull: false },
  resource: { type: DataTypes.STRING },
  resourceId: { type: DataTypes.INTEGER },
  details: { type: DataTypes.TEXT },
  ip: { type: DataTypes.STRING },
  userAgent: { type: DataTypes.TEXT }
});

module.exports = ActivityLog;