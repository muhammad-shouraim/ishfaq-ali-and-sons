const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let storage, useCloudinary = false;

if (isCloudinaryConfigured) {
  useCloudinary = true;
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ishfaq-ali-and-sons',
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    }
  });
} else {
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, allowed.test(ext));
  }
});

// Middleware to fix file paths for local storage
upload.fixPaths = (req, res, next) => {
  if (req.files) {
    Object.keys(req.files).forEach(field => {
      req.files[field].forEach(f => {
        if (!useCloudinary) {
          f.secure_url = '/uploads/' + path.basename(f.path);
          f.path = '/uploads/' + path.basename(f.path);
        }
      });
    });
  }
  if (req.file && !useCloudinary) {
    req.file.secure_url = '/uploads/' + path.basename(req.file.path);
    req.file.path = '/uploads/' + path.basename(req.file.path);
  }
  next();
};

module.exports = upload;