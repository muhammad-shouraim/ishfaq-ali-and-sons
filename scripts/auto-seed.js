const Category = require('../models/Category');
const User = require('../models/User');
const Setting = require('../models/Setting');

async function seedDatabase() {
  try {
    // Seed admin user
    const adminCount = await User.count();
    if (adminCount === 0) {
      await User.create({
        name: 'Admin',
        email: 'admin@ishfaqaliandsons.com',
        password: 'ishfaq@666',
        role: 'admin',
        isActive: true
      });
      console.log('✓ Admin user created (admin@ishfaqaliandsons.com / ishfaq@666)');
    }

    // Seed categories
    const catCount = await Category.count();
    if (catCount === 0) {
      const mainCategories = [
        { name: 'Turkish Jewellery', slug: 'turkish-jewellery', sortOrder: 1 },
        { name: '1 Carat', slug: '1-carat', sortOrder: 2 },
        { name: 'South Indian', slug: 'south-indian', sortOrder: 3 }
      ];
      const childrenByParent = {
        'turkish-jewellery': [
          { name: 'Rings', slug: 'turkish-jewellery-rings', sortOrder: 1 },
          { name: 'Ear Rings', slug: 'turkish-jewellery-ear-rings', sortOrder: 2 },
          { name: 'Necklace', slug: 'turkish-jewellery-necklace', sortOrder: 3 },
          { name: 'Bracelet', slug: 'turkish-jewellery-bracelet', sortOrder: 4 },
          { name: 'Bengal', slug: 'turkish-jewellery-bengal', sortOrder: 5 },
          { name: 'Clutch', slug: 'turkish-jewellery-clutch', sortOrder: 6 }
        ],
        '1-carat': [
          { name: 'Rings', slug: '1-carat-rings', sortOrder: 1 },
          { name: 'Ear Rings', slug: '1-carat-ear-rings', sortOrder: 2 },
          { name: 'Necklace', slug: '1-carat-necklace', sortOrder: 3 },
          { name: 'Bracelet', slug: '1-carat-bracelet', sortOrder: 4 },
          { name: 'Bengal', slug: '1-carat-bengal', sortOrder: 5 }
        ],
        'south-indian': [
          { name: 'Bengal', slug: 'south-indian-bengal', sortOrder: 1 },
          { name: 'Ring', slug: 'south-indian-ring', sortOrder: 2 },
          { name: 'Necklace', slug: 'south-indian-necklace', sortOrder: 3 },
          { name: 'Ear Ring', slug: 'south-indian-ear-ring', sortOrder: 4 }
        ]
      };
      const grandchildren = {
        'turkish-jewellery-necklace': [
          { name: 'Bridal Necklace', slug: 'turkish-jewellery-necklace-bridal', sortOrder: 1 },
          { name: 'Partywear Necklace', slug: 'turkish-jewellery-necklace-partywear', sortOrder: 2 }
        ],
        '1-carat-necklace': [
          { name: 'Bridal Necklace', slug: '1-carat-necklace-bridal', sortOrder: 1 },
          { name: 'Partywear Necklace', slug: '1-carat-necklace-partywear', sortOrder: 2 }
        ],
        'south-indian-necklace': [
          { name: 'Bridal Necklace', slug: 'south-indian-necklace-bridal', sortOrder: 1 },
          { name: 'Party-wear Necklace', slug: 'south-indian-necklace-party-wear', sortOrder: 2 }
        ]
      };
      const slugMap = {};
      for (const m of mainCategories) {
        const cat = await Category.create(m);
        slugMap[m.slug] = cat.id;
      }
      for (const [parentSlug, children] of Object.entries(childrenByParent)) {
        for (const child of children) {
          const cat = await Category.create({ ...child, parentId: slugMap[parentSlug] });
          slugMap[child.slug] = cat.id;
        }
      }
      for (const [parentSlug, gchildren] of Object.entries(grandchildren)) {
        for (const gc of gchildren) {
          await Category.create({ ...gc, parentId: slugMap[parentSlug] });
        }
      }
      console.log('✓ Categories seeded');
    }

    // Seed settings
    const settingCount = await Setting.count();
    if (settingCount === 0) {
      const settings = [
        { key: 'site_name', value: 'ISHFAQ ALI & SONS', description: 'Site name' },
        { key: 'contact_phone', value: '+92 332 9940666', description: 'Contact phone' },
        { key: 'whatsapp_number', value: '+923329940666', description: 'WhatsApp number' },
        { key: 'contact_email', value: 'ishfaqaliandsons123@gmail.com', description: 'Contact email' },
        { key: 'address', value: 'Piple Wehra, Near Aik Minar Wali Masjid, Shah Alam Mohalla, Takia Sadhu Market, Lahore, 54009, Pakistan', description: 'Address' },
        { key: 'currency', value: 'PKR', description: 'Currency code' },
        { key: 'currency_symbol', value: 'Rs.', description: 'Currency symbol' },
        { key: 'facebook_url', value: 'https://www.facebook.com/ishfaqali.sonsa', description: 'Facebook URL' },
        { key: 'instagram_url', value: '#', description: 'Instagram URL' },
        { key: 'tiktok_url', value: 'https://www.tiktok.com/@ishfaqalisons1', description: 'TikTok URL' },
        { key: 'youtube_url', value: '#', description: 'YouTube URL' },
        { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode' }
      ];
      await Setting.bulkCreate(settings);
      console.log('✓ Default settings seeded');
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

module.exports = seedDatabase;
