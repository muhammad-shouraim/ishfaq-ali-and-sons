const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { Op } = require('sequelize');

exports.getHome = async (req, res) => {
  try {
    let categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    categories = categories.filter(c => c.parentId !== null).map(c => {
      const cat = c.get({ plain: true });
      if (!cat.image) {
        const imgPath = path.join(__dirname, '..', 'public', 'images', 'categories', cat.slug + '.jpg');
        if (fs.existsSync(imgPath)) {
          cat.image = '/images/categories/' + cat.slug + '.jpg';
        }
      }
      return cat;
    });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newArrivals = await Product.findAll({
      where: { isActive: true, createdAt: { [Op.gte]: sevenDaysAgo } },
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    const saleProducts = await Product.findAll({
      where: { isActive: true, comparePrice: { [Op.gt]: 0 } },
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    const orders = await Order.findAll({ where: { orderStatus: { [Op.notIn]: ['cancelled'] } } });
    const salesCount = {};
    orders.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
      items.forEach(item => {
        const pid = item.product || item.id || item.productId;
        if (pid) salesCount[pid] = (salesCount[pid] || 0) + Number(item.quantity || 1);
      });
    });
    const bestSellerIds = Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);
    const bestSellers = bestSellerIds.length > 0
      ? await Product.findAll({ where: { id: bestSellerIds, isActive: true } })
      : [];

    const allProducts = await Product.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 12
    });

    res.render('pages/home', {
      title: 'Home', categories, newArrivals, saleProducts, bestSellers, allProducts
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.render('pages/home', {
      title: 'Home', categories: [], newArrivals: [], saleProducts: [], bestSellers: [], allProducts: []
    });
  }
};

exports.getAbout = (req, res) => {
  res.render('pages/about', { title: 'About Us' });
};

exports.getPrivacy = (req, res) => {
  res.render('pages/privacy', { title: 'Privacy Policy' });
};

exports.getTerms = (req, res) => {
  res.render('pages/terms', { title: 'Terms & Conditions' });
};

exports.getRefund = (req, res) => {
  res.render('pages/refund', { title: 'Refund Policy' });
};

exports.getShipping = (req, res) => {
  res.render('pages/shipping', { title: 'Shipping Policy' });
};



exports.get404 = (req, res) => {
  res.redirect('/');
};