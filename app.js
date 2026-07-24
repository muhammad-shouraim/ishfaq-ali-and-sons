const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const { protect } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport initialization
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global middleware - protect adds req.user
app.use(protect);

// Make constants available to all views
const constants = require('./config/constants');
app.use((req, res, next) => {
  res.locals.siteName = constants.siteName;
  res.locals.siteUrl = constants.siteUrl;
  res.locals.contactPhone = constants.contactPhone;
  res.locals.whatsappNumber = constants.whatsappNumber;
  res.locals.contactEmail = constants.contactEmail;
  res.locals.currency = constants.currency;
  res.locals.currencySymbol = constants.currencySymbol;
  res.locals.socialLinks = constants.socialLinks;
  res.locals.address = constants.address;
  res.locals.googleMapsUrl = constants.googleMapsUrl;
  res.locals.currentUrl = req.originalUrl;
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', require('./routes/page'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/product'));
app.use('/', require('./routes/cart'));
app.use('/', require('./routes/wishlist'));
app.use('/', require('./routes/search'));
app.use('/', require('./routes/contact'));
app.use('/', require('./routes/order'));

// Admin routes
app.use('/', require('./routes/admin'));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
});

// Error handler
app.use(errorHandler);

module.exports = app;