const Category = require('../models/Category');

const subCategories = {
  'rings': 'Rings',
  'ring': 'Ring',
  'ear-rings': 'Ear Rings',
  'ear-ring': 'Ear Ring',
  'necklace': 'Necklace',
  'bracelet': 'Bracelet',
  'bengal': 'Bengal',
  'clutch': 'Clutch',
  'bridal-necklace': 'Bridal Necklace',
  'partywear-necklace': 'Partywear Necklace',
  'party-wear-necklace': 'Party-wear Necklace'
};

const mainCategories = {
  'turkish-jewellery': { name: 'Turkish Jewellery', icon: 'fa-gem', description: 'Discover our exquisite Turkish Jewellery collection, featuring timeless designs crafted with precision and elegance.' },
  '1-carat': { name: '1 Carat', icon: 'fa-crown', description: 'Explore our stunning 1 Carat collection, where brilliance meets sophistication.' },
  'south-indian': { name: 'South Indian', icon: 'fa-ring', description: 'Explore our exclusive South Indian jewelry collection, crafted with traditional elegance.' }
};

exports.getCategoryLanding = (req, res) => {
  const mainSlug = req.path.split('/')[2];
  const sub = req.params.sub;
  const nested = req.params.nested;
  const mainCat = mainCategories[mainSlug];
  if (!mainCat) return res.redirect('/');

  const subName = sub ? subCategories[sub] : null;
  const nestedName = nested ? subCategories[nested] : null;

  if (sub && subName && nested && nestedName) {
    const category = {
      name: `${mainCat.name} ${subName} - ${nestedName}`,
      slug: `${mainSlug}/${sub}/${nested}`,
      description: `Explore our ${mainCat.name.toLowerCase()} ${subName.toLowerCase()} - ${nestedName.toLowerCase()}.`,
      icon: mainCat.icon,
      mainCategory: mainSlug
    };
    return res.render('pages/category-detail', { title: category.name, category });
  }

  if (sub && subName) {
    const category = {
      name: `${mainCat.name} ${subName}`,
      slug: `${mainSlug}/${sub}`,
      description: `Explore our exclusive collection of ${mainCat.name.toLowerCase()} ${subName.toLowerCase()}.`,
      icon: mainCat.icon,
      mainCategory: mainSlug
    };
    return res.render('pages/category-detail', { title: category.name, category });
  }

  const category = {
    name: mainCat.name,
    slug: mainSlug,
    description: mainCat.description,
    icon: mainCat.icon
  };

  const subs = Object.entries(subCategories).filter(([slug]) => !slug.includes('-necklace')).map(([slug, name]) => ({
    slug: `${mainSlug}/${slug}`,
    name,
    image: `/images/categories/${mainSlug}-${slug}.jpg`,
    description: `Exquisite ${mainCat.name.toLowerCase()} ${name.toLowerCase()}`
  }));

  res.render('pages/category-landing', { title: category.name, category, subcategories: subs });
};

exports.getCategoryDetail = async (req, res) => {
  const category = await Category.findOne({ where: { slug: req.params.slug } });
  if (!category) return res.redirect('/');
  res.render('pages/category-detail', { title: category.name, category });
};