const Newsletter = require('../models/Newsletter');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: 'Email is required' });
    const existing = await Newsletter.findOne({ where: { email } });
    if (existing) return res.json({ success: false, message: 'Already subscribed!' });
    await Newsletter.create({ email });
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
