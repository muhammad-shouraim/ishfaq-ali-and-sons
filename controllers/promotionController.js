const { Op } = require('sequelize');
const Promotion = require('../models/Promotion');

exports.getActivePromotions = async (req, res, next) => {
  try {
    const now = new Date();
    const promotions = await Promotion.findAll({
      where: { isActive: true, startDate: { [Op.lte]: now }, endDate: { [Op.gte]: now } },
      order: [['createdAt', 'DESC']],
      limit: 1
    });
    res.locals.activePromotion = promotions.length > 0 ? promotions[0] : null;
  } catch { res.locals.activePromotion = null; }
  next();
};
