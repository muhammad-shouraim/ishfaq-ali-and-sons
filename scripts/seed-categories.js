require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sequelize = require('../config/sequelize');
const Category = require('../models/Category');

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

(async () => {
  try {
    await sequelize.sync();
    await sequelize.query('DELETE FROM categories');
    await sequelize.query('ALTER TABLE categories AUTO_INCREMENT = 1');

    const slugMap = {};

    for (const m of mainCategories) {
      const cat = await Category.create({ name: m.name, slug: m.slug, sortOrder: m.sortOrder, parentId: null });
      slugMap[m.slug] = cat.id;
      console.log('Main:', cat.name, cat.id);
    }

    for (const [parentSlug, children] of Object.entries(childrenByParent)) {
      for (const child of children) {
        const cat = await Category.create({ name: child.name, slug: child.slug, sortOrder: child.sortOrder, parentId: slugMap[parentSlug] });
        slugMap[child.slug] = cat.id;
        console.log('  Child:', cat.name, cat.id, '->', parentSlug);
      }
    }

    for (const [parentSlug, gchildren] of Object.entries(grandchildren)) {
      for (const gc of gchildren) {
        const cat = await Category.create({ name: gc.name, slug: gc.slug, sortOrder: gc.sortOrder, parentId: slugMap[parentSlug] });
        slugMap[gc.slug] = cat.id;
        console.log('    Grandchild:', cat.name, cat.id, '->', parentSlug);
      }
    }

    console.log('Categories seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding categories:', err.name, err.message);
    if (err.errors) err.errors.forEach(e => console.error('  -', e.path, e.message, e.type));
    process.exit(1);
  }
})();
