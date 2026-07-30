const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    cb(null, timestamp + '-' + random + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, allowed.test(ext));
  }
});

upload.fixPaths = (req, res, next) => {
  if (req.files) {
    Object.keys(req.files).forEach(field => {
      req.files[field].forEach(f => {
        f.secure_url = '/uploads/' + path.basename(f.path);
        f.path = '/uploads/' + path.basename(f.path);
      });
    });
  }
  if (req.file) {
    req.file.secure_url = '/uploads/' + path.basename(req.file.path);
    req.file.path = '/uploads/' + path.basename(req.file.path);
  }
  next();
};

module.exports = upload;