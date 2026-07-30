const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const { protect } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (!req.cookies.guest_sid) {
    req.guestSessionId = crypto.randomUUID();
    res.cookie('guest_sid', req.guestSessionId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
  } else {
    req.guestSessionId = req.cookies.guest_sid;
  }
  next();
});

app.use(passport.initialize());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(protect);

// Maintenance mode check — non-admin visitors see maintenance page
app.use(async (req, res, next) => {
  if (req.path.startsWith('/admin-auth-x9k2') || req.path.startsWith('/ishfaq-control-panel-x7k9')) return next();
  if (req.cookies && req.cookies.admin_token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(req.cookies.admin_token, process.env.JWT_SECRET_ADMIN);
      if (decoded && decoded.id) {
        const User = require('./models/User');
        const admin = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
        if (admin && (admin.role === 'admin' || admin.role === 'super_admin' || admin.role === 'staff')) {
          return next();
        }
      }
    } catch (e) {}
  }
  try {
    const Setting = require('./models/Setting');
    const setting = await Setting.findOne({ where: { key: 'maintenance_mode' } });
    if (setting && setting.value === 'true') {
      return res.status(503).render('pages/maintenance');
    }
  } catch (e) {}
  next();
});

const constants = require('./config/constants');
const ADMIN_PATH = require('./config/adminPath');
const { getActivePromotions } = require('./controllers/promotionController');
const passportConfig = require('./config/passport');
app.use(getActivePromotions);
app.use(async (req, res, next) => {
  try {
    const Setting = require('./models/Setting');
    const dbSettings = await Setting.findAll();
    const s = {};
    dbSettings.forEach(setting => { s[setting.key] = setting.value; });
    res.locals.siteName = s.site_name || constants.siteName;
    res.locals.siteUrl = constants.siteUrl;
    res.locals.contactPhone = s.contact_phone || constants.contactPhone;
    res.locals.whatsappNumber = s.whatsapp_number || constants.whatsappNumber;
    res.locals.contactEmail = s.contact_email || constants.contactEmail;
    res.locals.currency = s.currency || constants.currency;
    res.locals.currencySymbol = s.currency_symbol || constants.currencySymbol;
    res.locals.address = s.address || constants.address;
    res.locals.googleMapsUrl = s.google_maps_url || constants.googleMapsUrl;
    res.locals.socialLinks = {
      facebook: s.facebook_url || constants.socialLinks.facebook,
      instagram: s.instagram_url || constants.socialLinks.instagram,
      tiktok: s.tiktok_url || constants.socialLinks.tiktok,
      whatsapp: `https://wa.me/${s.whatsapp_number || constants.whatsappNumber}`,
      youtube: s.youtube_url || constants.socialLinks.youtube
    };
  } catch (e) {
    res.locals.siteName = constants.siteName;
    res.locals.siteUrl = constants.siteUrl;
    res.locals.contactPhone = constants.contactPhone;
    res.locals.whatsappNumber = constants.whatsappNumber;
    res.locals.contactEmail = constants.contactEmail;
    res.locals.currency = constants.currency;
    res.locals.currencySymbol = constants.currencySymbol;
    res.locals.address = constants.address;
    res.locals.googleMapsUrl = constants.googleMapsUrl;
    res.locals.socialLinks = constants.socialLinks;
  }
  res.locals.currentUrl = req.originalUrl;
  res.locals.user = req.user || null;
  res.locals.isGoogleConfigured = passportConfig.isGoogleConfigured;
  res.locals.adminPath = ADMIN_PATH;
  try {
    const Category = require('./models/Category');
    const allCategories = await Category.findAll({
      include: [{ model: Category, as: 'children' }],
      order: [['sortOrder', 'ASC']]
    });
    const topLevel = allCategories.filter(c => !c.parentId);
    res.locals.navCategories = topLevel.map(c => {
      const plain = c.get({ plain: true });
      plain.children = (plain.children || []).map(child => {
        child.children = allCategories.filter(gc => gc.parentId === child.id).map(gc => gc.get({ plain: true }));
        return child;
      });
      return plain;
    });
  } catch (e) { res.locals.navCategories = []; }
  next();
});

// Block old /admin path — show 404 (must be before admin routes)
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin/') {
    return res.status(404).render('pages/404', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
  }
  next();
});

app.use('/', require('./routes/page'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/product'));
app.use('/', require('./routes/cart'));
app.use('/', require('./routes/wishlist'));
app.use('/', require('./routes/search'));
app.use('/', require('./routes/contact'));
app.use('/', require('./routes/order'));
app.use('/', require('./routes/newsletter'));
app.use('/', require('./routes/seo'));
// Temporary migration endpoint (remove after running)
app.get('/__migrate__', async (req, res) => {
  if (req.query.key !== 'ias_migrate_2024') return res.status(403).json({ error: 'invalid key' });
  const sequelize = require('./config/sequelize');
  const addCol = async (table, col, def) => {
    try { await sequelize.query('ALTER TABLE `' + table + '` ADD COLUMN `' + col + '` ' + def); return 'added'; }
    catch (e) { return e.message.includes('Duplicate column') ? 'exists' : 'error: ' + e.message; }
  };
  var tables = ['Orders', 'orders'];
  var result = {};
  for (var t of tables) {
    result[t] = {};
    result[t].accountName = await addCol(t, 'accountName', 'VARCHAR(255) DEFAULT NULL AFTER notes');
    result[t].transactionId = await addCol(t, 'transactionId', 'VARCHAR(255) DEFAULT NULL AFTER accountName');
  }
  res.json(result);
});

app.use('/', require('./routes/admin'));

app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.path);
  if (require('fs').existsSync(filePath)) {
    express.static(path.join(__dirname, 'public/uploads'))(req, res, next);
  } else {
    res.redirect('/images/newlogo.png');
  }
});

// Redirect old /category/ URLs to /collection/
app.use((req, res, next) => {
  if (req.path.startsWith('/category/')) {
    return res.redirect(301, req.path.replace('/category/', '/collection/'));
  }
  next();
});

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
});

app.use(errorHandler);

module.exports = app;
