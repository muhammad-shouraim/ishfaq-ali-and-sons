require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sequelize = require('../config/sequelize');
const User = require('../models/User');

(async () => {
  try {
    await sequelize.sync();
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@ishfaqaliandsons.com' },
      defaults: {
        name: 'Admin',
        email: 'admin@ishfaqaliandsons.com',
        password: 'ishfaq@666',
        role: 'admin',
        isActive: true
      }
    });
    if (!created) {
      user.password = 'ishfaq@666';
      user.role = 'admin';
      await user.save();
      console.log('Admin user updated');
    } else {
      console.log('Admin user created');
    }
    console.log('Email: admin@ishfaqaliandsons.com / Password: ishfaq@666');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
