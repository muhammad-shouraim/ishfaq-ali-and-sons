const Media = require('../models/Media');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;
    const folder = req.query.folder || '/';

    const query = { folder };
    const [media, total, folders] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Media.countDocuments(query),
      Media.distinct('folder', { folder: { $ne: '/' } })
    ]);

    res.render('admin/media', {
      title: 'Media Library',
      media,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      currentFolder: folder,
      folders: [...new Set(folders)]
    });
  } catch (err) {
    // msg: 'error', 'Error loading media');
    res.redirect('/admin');
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      // msg: 'error', 'No files uploaded');
      return res.redirect('/admin/media');
    }

    const folder = req.body.folder || '/';
    const uploaded = [];

    for (const file of req.files) {
      const media = await Media.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path.replace(/\\/g, '/'),
        url: '/uploads/' + file.filename,
        folder,
        uploadedBy: req.user._id
      });
      uploaded.push(media);
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'upload_media',
      resource: 'Media',
      details: { count: uploaded.length, files: uploaded.map(m => m.originalName) }
    });

    // msg: 'success', `${uploaded.length} file(s) uploaded successfully`);
    res.redirect('/admin/media?folder=' + encodeURIComponent(folder));
  } catch (err) {
    // msg: 'error', 'Error uploading files: ' + err.message);
    res.redirect('/admin/media');
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { folderName, parentFolder } = req.body;
    if (!folderName || !folderName.trim()) {
      // msg: 'error', 'Folder name is required');
      return res.redirect('/admin/media');
    }

    const sanitized = folderName.trim().replace(/[<>:"/\\|?*]/g, '');
    if (!sanitized) {
      // msg: 'error', 'Invalid folder name');
      return res.redirect('/admin/media');
    }

    const fullPath = parentFolder && parentFolder !== '/'
      ? parentFolder + '/' + sanitized
      : '/' + sanitized;

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const dirPath = path.join(uploadsDir, fullPath.replace(/^\//, ''));
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'create_media_folder',
      resource: 'Media',
      details: { folder: fullPath }
    });

    // msg: 'success', 'Folder created successfully');
    res.redirect('/admin/media?folder=' + encodeURIComponent(parentFolder || '/'));
  } catch (err) {
    // msg: 'error', 'Error creating folder');
    res.redirect('/admin/media');
  }
};

exports.delete = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      // msg: 'error', 'File not found');
      return res.redirect('/admin/media');
    }

    const filePath = path.join(__dirname, '..', 'public', media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_media',
      resource: 'Media',
      resourceId: media._id,
      details: { filename: media.originalName }
    });

    // msg: 'success', 'File deleted successfully');
    res.redirect('/admin/media?folder=' + encodeURIComponent(media.folder));
  } catch (err) {
    // msg: 'error', 'Error deleting file');
    res.redirect('/admin/media');
  }
};

exports.apiList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const folder = req.query.folder || '';

    const query = {};
    if (search) query.originalName = { $regex: search, $options: 'i' };
    if (folder) query.folder = folder;

    const [media, total] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


