const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'ishfaqaliandsons',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? false : false,
    define: { timestamps: true },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Database Connected: ${process.env.MYSQL_HOST || 'localhost'}/${process.env.MYSQL_DATABASE || 'ishfaqaliandsons'}`);
  } catch (error) {
    console.error('Database Connection Error:', error.message);
    console.log('Make sure MySQL is running and MYSQL_* env vars are set correctly.');
    console.log('App will start without database connection.');
  }
};

module.exports = sequelize;
module.exports.connectDB = connectDB;
