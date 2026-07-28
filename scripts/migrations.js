require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sequelize = require('../config/sequelize');

const addColumn = async (table, column, definition) => {
  try {
    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ✓ ${table}.${column}`);
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log(`  - ${table}.${column} already exists`);
    } else {
      console.error(`  ✗ ${table}.${column}: ${e.message}`);
    }
  }
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Running migrations...');

    await sequelize.query(`CREATE TABLE IF NOT EXISTS adminactivitylogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      adminId INT NOT NULL,
      adminName VARCHAR(255) DEFAULT '',
      action VARCHAR(100) NOT NULL,
      targetType VARCHAR(50) DEFAULT '',
      targetId INT DEFAULT NULL,
      targetName VARCHAR(255) DEFAULT '',
      description TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    console.log('  ✓ adminactivitylogs table');

    await addColumn('orders', 'internalNotes', 'TEXT DEFAULT NULL AFTER notes');
    await addColumn('orders', 'packingSlipPrinted', 'TINYINT(1) DEFAULT 0');

    await addColumn('users', 'internalNotes', 'TEXT DEFAULT NULL');
    await addColumn('users', 'tags', 'VARCHAR(500) DEFAULT \'\'');
    await addColumn('users', 'isBlocked', 'TINYINT(1) DEFAULT 0');

    await addColumn('coupons', 'usedCount', 'INT DEFAULT 0');
    await addColumn('coupons', 'totalDiscount', 'DECIMAL(12,2) DEFAULT 0');

    console.log('All migrations completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
})();
