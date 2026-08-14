import { Router } from 'express';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import ProjectKit from '../models/ProjectKit.model.js';

const router = Router();

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const hostHeader = req.headers['x-forwarded-host'] || req.get('host') || 'www.shortcircuit.co.in';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const DOMAIN = `${protocol}://${hostHeader}`.replace(/\/$/, '');

    // Fetch active and approved models with slugs and media
    const [products, categories, brands, projectKits] = await Promise.all([
      Product.find({ approvalStatus: 'approved', isActive: true }, 'name slug updatedAt images'),
      Category.find({}, 'slug updatedAt'),
      Brand.find({}, 'slug updatedAt'),
      ProjectKit.find({ isActive: true }, 'name slug updatedAt coverImage'),
    ]);

    // Define core static routes
    const staticRoutes = [
      '',
      '/shop',
      '/deals',
      '/categories',
      '/brands',
      '/events',
      '/projects',
      '/about',
      '/contact',
      '/faq',
      '/shipping',
      '/returns',
      '/privacy',
      '/terms',
    ];

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // 1. Static Routes
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}${route}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.7'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Dynamic Categories
    categories.forEach((cat) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/category/${cat.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // 3. Dynamic Brands
    brands.forEach((br) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/brand/${br.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    // 4. Dynamic Products (with Google Image Search XML tags)
    products.forEach((prod) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/product/${prod.slug}</loc>\n`;
      const dateStr = prod.updatedAt ? prod.updatedAt.toISOString().split('T')[0] : today;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      if (prod.images && prod.images.length > 0 && prod.images[0].url) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${prod.images[0].url}</image:loc>\n`;
        xml += `      <image:title>${prod.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    });

    // 5. Dynamic Project Kits (Smart Project Builder)
    projectKits.forEach((kit) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/projects/${kit.slug}</loc>\n`;
      const dateStr = kit.updatedAt ? kit.updatedAt.toISOString().split('T')[0] : today;
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      if (kit.coverImage && kit.coverImage.url) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${kit.coverImage.url}</image:loc>\n`;
        xml += `      <image:title>${kit.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
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
