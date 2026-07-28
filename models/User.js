const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  googleId: { type: DataTypes.STRING },
  provider: { type: DataTypes.ENUM('local', 'google'), defaultValue: 'local' },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.DATE },
  addresses: { type: DataTypes.TEXT, defaultValue: '[]' },
  internalNotes: { type: DataTypes.TEXT },
  tags: { type: DataTypes.STRING, defaultValue: '' },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  if (values.addresses && typeof values.addresses === 'string') {
    try { values.addresses = JSON.parse(values.addresses); } catch { values.addresses = []; }
  }
  return values;
};

module.exports = User;