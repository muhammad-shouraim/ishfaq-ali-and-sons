const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user: { type: DataTypes.INTEGER },
  orderNumber: { type: DataTypes.STRING, unique: true },
  items: { type: DataTypes.TEXT, defaultValue: '[]' },
  shippingInfo: { type: DataTypes.TEXT, defaultValue: '{}' },
  paymentMethod: { type: DataTypes.ENUM('cod', 'bank_transfer'), defaultValue: 'cod' },
  paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'failed'), defaultValue: 'pending' },
  orderStatus: { type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  shippingCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  couponCode: { type: DataTypes.STRING },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  accountName: { type: DataTypes.STRING },
  transactionId: { type: DataTypes.STRING },
  trackingNumber: { type: DataTypes.STRING },
  isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
  paidAt: { type: DataTypes.DATE },
  deliveredAt: { type: DataTypes.DATE },
  internalNotes: { type: DataTypes.TEXT },
  packingSlipPrinted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  hooks: {
    beforeSave: (order) => {
      if (!order.orderNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        order.orderNumber = `IAS-${timestamp}${random}`;
      }
    }
  }
});

Order.prototype.toJSON = function() {
  const values = { ...this.get() };
  if (values.items && typeof values.items === 'string') {
    try { values.items = JSON.parse(values.items); } catch { values.items = []; }
  }
  if (values.shippingInfo && typeof values.shippingInfo === 'string') {
    try { values.shippingInfo = JSON.parse(values.shippingInfo); } catch { values.shippingInfo = {}; }
  }
  return values;
};

module.exports = Order;