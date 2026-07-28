const Setting = require('../models/Setting');
const ActivityLog = require('../models/ActivityLog');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });
    res.render('admin/pages/settings', { title: 'Settings', settings: settingMap });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=Error loading settings&messageType=danger');
  }
};

exports.update = async (req, res) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await Setting.upsert({ key, value: String(value) });
      }
    }
    await ActivityLog.create({ user: req.user.id, action: 'update_settings', resource: 'Setting', details: '{}', ip: req.ip });
    // msg: 'success', 'Settings updated successfully');
    res.redirect(ADMIN_PATH + '/settings');
  } catch (err) {
    // msg: 'error', 'Error updating settings');
    res.redirect(ADMIN_PATH + '/settings');
  }
};

exports.getPaymentSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });
    res.render('admin/pages/settings-payment', { title: 'Payment Settings', settings: settingMap });
  } catch (err) {
    res.redirect(ADMIN_PATH + '?message=Error loading payment settings&messageType=danger');
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await Setting.upsert({ key, value: String(value) });
      }
    }
    await ActivityLog.create({ user: req.user.id, action: 'update_payment_settings', resource: 'Setting', details: '{}', ip: req.ip });
    // msg: 'success', 'Payment settings updated successfully');
    res.redirect(ADMIN_PATH + '/settings/payment');
  } catch (err) {
    // msg: 'error', 'Error updating payment settings');
    res.redirect(ADMIN_PATH + '/settings/payment');
  }
};