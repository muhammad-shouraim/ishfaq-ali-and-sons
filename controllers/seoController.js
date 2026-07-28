const Product = require('../models/Product');
const Category = require('../models/Category');
const constants = require('../config/constants');

exports.getSitemap = async (req, res) => {
  const baseUrl = constants.siteUrl;
  const products = await Product.findAll({ where: { isActive: true }, attributes: ['slug', 'updatedAt'] });
  const categories = await Category.findAll({ where: { isActive: true }, attributes: ['slug'] });

  const staticUrls = ['/', '/shop', '/privacy-policy', '/terms-conditions', '/refund-policy', '/shipping-policy'];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  staticUrls.forEach(url => {
    xml += `  <url><loc>${baseUrl}${url}</loc><priority>${url === '/' ? '1.0' : '0.8'}</priority></url>\n`;
  });

  categories.forEach(cat => {
    xml += `  <url><loc>${baseUrl}/collection/${cat.slug}</loc><priority>0.7</priority></url>\n`;
  });

  products.forEach(p => {
    xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><priority>0.6</priority></url>\n`;
  });

  xml += '</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
};

exports.getRobots = (req, res) => {
  const baseUrl = constants.siteUrl;
  const txt = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(txt);
};
