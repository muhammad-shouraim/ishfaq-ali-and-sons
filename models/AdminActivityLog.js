const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const AdminActivityLog = sequelize.define('AdminActivityLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  adminId: { type: DataTypes.INTEGER, allowNull: false },
  adminName: { type: DataTypes.STRING, defaultValue: '' },
  action: { type: DataTypes.STRING, allowNull: false },
  targetType: { type: DataTypes.STRING, defaultValue: '' },
  targetId: { type: DataTypes.INTEGER },
  targetName: { type: DataTypes.STRING, defaultValue: '' },
  description: { type: DataTypes.TEXT }
}, {
  tableName: 'adminactivitylogs',
  timestamps: true
});

module.exports = AdminActivityLog;
