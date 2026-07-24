const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);