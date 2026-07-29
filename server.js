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
  db.sync({ alter: false }).then(async () => {
    console.log('Database tables synced');
    // Ensure slug column exists — safe to run repeatedly
    try {
      await db.query("ALTER TABLE Products ADD COLUMN slug VARCHAR(255) UNIQUE AFTER name");
      console.log('Added slug column to Products table');
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.error('Slug column check:', e.message);
      }
    }
    // Backfill missing slugs for existing products
    try {
      const [rows] = await db.query("SELECT id, name FROM Products WHERE slug IS NULL OR slug = ''");
      for (const row of rows) {
        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await db.query("UPDATE Products SET slug = ? WHERE id = ?", { replacements: [slug, row.id] });
      }
      if (rows.length > 0) console.log(`Backfilled ${rows.length} missing slugs`);
    } catch (e) {
      console.error('Slug backfill error:', e.message);
    }
    // Ensure Reviews table has all required columns
    const reviewColumns = [
      ['name', 'VARCHAR(255) NOT NULL'],
      ['rating', 'INT NOT NULL'],
      ['title', 'VARCHAR(255)'],
      ['comment', 'TEXT NOT NULL'],
      ['adminReply', 'TEXT'],
      ['repliedAt', 'DATETIME'],
      ['repliedBy', 'INT']
    ];
    for (const [col, def] of reviewColumns) {
      try {
        await db.query(`ALTER TABLE Reviews ADD COLUMN ${col} ${def}`);
        console.log(`Added ${col} column to Reviews table`);
      } catch (e) {
        if (!e.message.includes('Duplicate column')) {
          console.error(`Reviews ${col} column check:`, e.message);
        }
      }
    }
    const seedDatabase = require('./scripts/auto-seed');
    await seedDatabase();
  }).catch(err => console.error('Sync error:', err.message));
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
