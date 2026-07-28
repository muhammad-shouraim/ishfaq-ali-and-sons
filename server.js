const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('./config/sequelize');
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message, err.stack);
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message, err.stack);
  console.error('UNCAUGHT EXCEPTION:', err);
});

connectDB().then(() => {
  require('./models');
  const db = require('./config/sequelize');
  db.sync({ alter: false }).then(() => {
    console.log('Database tables synced');
  }).catch(err => console.error('Sync error:', err.message));
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
