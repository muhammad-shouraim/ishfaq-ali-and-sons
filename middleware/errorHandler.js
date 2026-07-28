const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(statusCode).json({ message });
  }
  res.status(statusCode).render('pages/404', { message });
};

module.exports = errorHandler;