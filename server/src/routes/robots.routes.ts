import { Router } from 'express';

const router = Router();

router.get('/robots.txt', (req, res) => {
  const hostHeader = req.headers['x-forwarded-host'] || req.get('host') || 'www.shortcircuit.co.in';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const DOMAIN = `${protocol}://${hostHeader}`.replace(/\/$/, '');

  const robotsTxt = `User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /projects/
Allow: /category/
Allow: /brand/
Allow: /deals
Allow: /events

Allow: /api/v1/products
Allow: /api/v1/categories
Allow: /api/v1/brands
Allow: /api/v1/project-kits

Disallow: /admin
Disallow: /checkout
Disallow: /my-library
Disallow: /cart
Disallow: /api/v1/auth
Disallow: /api/v1/orders
Disallow: /api/v1/payments
Disallow: /api/v1/admin

Sitemap: ${DOMAIN}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.status(200).send(robotsTxt);
});

export default router;
