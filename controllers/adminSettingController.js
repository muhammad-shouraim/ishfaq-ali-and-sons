const Setting = require('../models/Setting');
const ActivityLog = require('../models/ActivityLog');

const GENERAL_KEYS = [
  'site_name', 'site_logo', 'site_favicon', 'contact_phone', 'contact_email',
  'address', 'google_maps_url', 'facebook_url', 'tiktok_url', 'instagram_url',
  'whatsapp_number', 'tax_rate', 'shipping_cost', 'free_shipping_threshold',
  'currency', 'currency_symbol', 'smtp_host', 'smtp_port', 'smtp_user',
  'smtp_pass', 'smtp_from', 'maintenance_mode', 'seo_title', 'seo_description',
  'analytics_code'
];

const PAYMENT_KEYS = [
  'bank_name', 'bank_account_title', 'bank_account_number', 'bank_iban'
];

async function getSettings(keys) {
  const settings = await Setting.find({ key: { $in: keys } }).lean();
  const map = {};
  for (const s of settings) map[s.key] = s.value;

  const result = {};
  for (const key of keys) {
    result[key] = map[key] !== undefined ? map[key] : '';
  }
  return result;
}

async function upsertSettings(data) {
  const ops = Object.entries(data).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: { $set: { key, value } },
      upsert: true
    }
  }));
  await Setting.bulkWrite(ops);
}

exports.index = async (req, res) => {
  try {
    const settings = await getSettings(GENERAL_KEYS);
    res.render('admin/pages/settings', { title: 'Settings', settings });
  } catch (err) {
    // msg: 'error', 'Error loading settings');
    res.redirect('/admin');
  }
};

exports.save = async (req, res) => {
  try {
    const data = {};
    for (const key of GENERAL_KEYS) {
      if (req.body[key] !== undefined) {
        let value = req.body[key];
        if (key === 'tax_rate' || key === 'shipping_cost' || key === 'free_shipping_threshold') {
          value = parseFloat(value) || 0;
        }
        if (key === 'smtp_port') {
          value = parseInt(value) || 587;
        }
        if (key === 'maintenance_mode') {
          value = value === 'on' || value === true || value === '1';
        }
        data[key] = value;
      }
    }

    await upsertSettings(data);

    await ActivityLog.create({
      user: req.user._id,
      action: 'update_settings',
      resource: 'Setting',
      details: { keys: Object.keys(data) }
    });

    // msg: 'success', 'Settings saved successfully');
    res.redirect('/admin/pages/settings');
  } catch (err) {
    // msg: 'error', 'Error saving settings: ' + err.message);
    res.redirect('/admin/pages/settings');
  }
};

exports.payment = async (req, res) => {
  try {
    const settings = await getSettings(PAYMENT_KEYS);
    res.render('admin/pages/settings-payment', { title: 'Payment Settings', settings });
  } catch (err) {
    // msg: 'error', 'Error loading payment settings');
    res.redirect('/admin/pages/settings');
  }
};

exports.savePayment = async (req, res) => {
  try {
    const data = {};
    for (const key of PAYMENT_KEYS) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    await upsertSettings(data);

    await ActivityLog.create({
      user: req.user._id,
      action: 'update_payment_settings',
      resource: 'Setting',
      details: { keys: Object.keys(data) }
    });

    // msg: 'success', 'Payment settings saved successfully');
    res.redirect('/admin/pages/settings/payment');
  } catch (err) {
    // msg: 'error', 'Error saving payment settings: ' + err.message);
    res.redirect('/admin/pages/settings/payment');
  }
};

