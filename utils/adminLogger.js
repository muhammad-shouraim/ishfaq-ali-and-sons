const AdminActivityLog = require('../models/AdminActivityLog');

const logAdminAction = async (req, action, targetType, targetId, targetName, description) => {
  try {
    await AdminActivityLog.create({
      adminId: req.user?.id || 0,
      adminName: req.user?.name || 'Admin',
      action,
      targetType,
      targetId: targetId || null,
      targetName: targetName || '',
      description: description || ''
    });
  } catch (e) {
    console.error('Admin log error:', e.message);
  }
};

module.exports = { logAdminAction };
