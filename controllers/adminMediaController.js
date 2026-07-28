const { Op } = require('sequelize');
const Media = require('../models/Media');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const ADMIN_PATH = require('../config/adminPath');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;
    const folder = req.query.folder || '/';
    const where = { folder };
    const { count: total, rows: media } = await Media.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit
    });
    const foldersResult = await Media.findAll({ attributes: ['folder'], where: { folder: { [Op.ne]: '/' } }, group: ['folder'], raw: true });
    const folders = [...new Set(foldersResult.map(f => f.folder))];
    res.render('admin/pages/media', {
      title: 'Media Library', media, currentPage: page,
      totalPages: Math.ceil(total / limit), currentFolder: folder, folders
    });
  } catch (err) {
    res.redirect(ADMIN_PATH + '');
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.redirect(ADMIN_PATH + '/media');
    const folder = req.body.folder || '/';
    for (const file of req.files) {
      await Media.create({
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path || file.secure_url,
        url: file.secure_url || file.path,
        folder,
        uploadedBy: req.user.id
      });
    }
    res.redirect(ADMIN_PATH + '/media?folder=' + encodeURIComponent(folder));
  } catch (err) {
    res.redirect(ADMIN_PATH + '/media');
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { folderName, parentFolder } = req.body;
    if (!folderName || !folderName.trim()) return res.redirect(ADMIN_PATH + '/media');
    res.redirect(ADMIN_PATH + '/media?folder=' + encodeURIComponent(parentFolder || '/'));
  } catch (err) {
    res.redirect(ADMIN_PATH + '/media');
  }
};

exports.delete = async (req, res) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return res.redirect(ADMIN_PATH + '/media');
    const publicId = media.filename?.replace(/\.[^.]+$/, '');
    if (publicId) {
      try { await cloudinary.uploader.destroy('ishfaq-ali-and-sons/' + publicId); } catch (e) { }
    }
    await Media.destroy({ where: { id: req.params.id } });
    res.redirect(ADMIN_PATH + '/media?folder=' + encodeURIComponent(media.folder));
  } catch (err) {
    res.redirect(ADMIN_PATH + '/media');
  }
};

exports.apiList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const folder = req.query.folder || '';
    const where = {};
    if (search) where.originalName = { [Op.like]: `%${search}%` };
    if (folder) where.folder = folder;
    const { count: total, rows: media } = await Media.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset: skip, limit
    });
    res.json({ success: true, data: media, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};