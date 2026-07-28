const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Cart = require('./Cart');
const Wishlist = require('./Wishlist');
const Order = require('./Order');
const Review = require('./Review');
const Media = require('./Media');
const ActivityLog = require('./ActivityLog');

User.hasMany(Cart, { foreignKey: 'user' });
User.hasMany(Wishlist, { foreignKey: 'user' });
User.hasMany(Order, { foreignKey: 'user' });
User.hasMany(Review, { foreignKey: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'user' });
User.hasMany(Media, { foreignKey: 'uploadedBy' });

Product.belongsTo(Category, { foreignKey: 'category', as: 'categoryData' });
Category.hasMany(Product, { foreignKey: 'category' });

Review.belongsTo(Product, { foreignKey: 'product' });
Review.belongsTo(User, { foreignKey: 'user' });

Order.belongsTo(User, { foreignKey: 'user' });

ActivityLog.belongsTo(User, { foreignKey: 'user' });

Media.belongsTo(User, { foreignKey: 'uploadedBy' });

module.exports = {
  User, Product, Category, Cart, Wishlist, Order, Review, Coupon: require('./Coupon'),
  Media, ActivityLog, Page: require('./Page'), Setting: require('./Setting'),
  Newsletter: require('./Newsletter'),
  Promotion: require('./Promotion')
};