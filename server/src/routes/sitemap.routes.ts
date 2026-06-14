import { Router } from 'express';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';

const router = Router();

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const rawClientUrl = process.env.CLIENT_URL || 'https://www.shortcircuit.co.in';
    const DOMAIN = rawClientUrl.replace(/\/$/, '');

    // Fetch active and approved models with slugs
    const products = await Product.find({ approvalStatus: 'approved', isActive: true }, 'slug updatedAt');
    const categories = await Category.find({}, 'slug updatedAt');
    const brands = await Brand.find({}, 'slug updatedAt');

    // Define core static routes
    const staticRoutes = [
      '',
      '/shop',
      '/deals',
      '/about',
      '/contact',
      '/faq',
      '/shipping',
      '/returns',
      '/privacy',
      '/terms'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Static Routes
    staticRoutes.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}${route}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.7'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Dynamic Categories
    categories.forEach(cat => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/category/${cat.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // 3. Dynamic Brands
    brands.forEach(br => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/brand/${br.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    // 4. Dynamic Products
    products.forEach(prod => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/product/${prod.slug}</loc>\n`;
      const dateStr = prod.updatedAt ? prod.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
});

export default router;
