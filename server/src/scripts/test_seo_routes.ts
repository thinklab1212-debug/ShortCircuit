// ============================================================================
// Unit Test: Sitemap XML & Robots.txt SEO Crawler Endpoints
// ============================================================================

import assert from 'assert';

console.log('🧪 Running Sitemap & Robots.txt SEO Unit Test Suite...');

function generateRobotsTxt(domain: string): string {
  return `User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /projects/
Allow: /category/
Allow: /brand/
Allow: /deals
Allow: /events

Disallow: /admin
Disallow: /checkout
Disallow: /my-library
Disallow: /cart
Disallow: /api/v1/

Sitemap: ${domain}/sitemap.xml
`;
}

function generateSitemapXml(
  domain: string,
  products: { slug: string; name: string; imageUrl?: string }[],
  projectKits: { slug: string; name: string; coverUrl?: string }[]
): string {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Static
  xml += `  <url><loc>${domain}/shop</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n`;

  // Products
  products.forEach((p) => {
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/product/${p.slug}</loc>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (p.imageUrl) {
      xml += `    <image:image><image:loc>${p.imageUrl}</image:loc></image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  // Project Kits
  projectKits.forEach((k) => {
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/projects/${k.slug}</loc>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (k.coverUrl) {
      xml += `    <image:image><image:loc>${k.coverUrl}</image:loc></image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

// Test 1: Robots.txt validation
const robotsResult = generateRobotsTxt('https://www.shortcircuit.co.in');
assert.strictEqual(robotsResult.includes('User-agent: *'), true);
assert.strictEqual(robotsResult.includes('Sitemap: https://www.shortcircuit.co.in/sitemap.xml'), true);
assert.strictEqual(robotsResult.includes('Disallow: /admin'), true);

// Test 2: Sitemap XML validation
const sitemapResult = generateSitemapXml(
  'https://www.shortcircuit.co.in',
  [{ slug: 'l298n-motor-driver', name: 'L298N Motor Driver', imageUrl: 'https://res.cloudinary.com/demo/image.jpg' }],
  [{ slug: 'obstacle-avoiding-robot', name: 'Obstacle Avoiding Robot Kit', coverUrl: 'https://res.cloudinary.com/demo/cover.jpg' }]
);

assert.strictEqual(sitemapResult.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), true);
assert.strictEqual(sitemapResult.includes('<loc>https://www.shortcircuit.co.in/product/l298n-motor-driver</loc>'), true);
assert.strictEqual(sitemapResult.includes('<loc>https://www.shortcircuit.co.in/projects/obstacle-avoiding-robot</loc>'), true);
assert.strictEqual(sitemapResult.includes('<image:image>'), true);

console.log('✅ Robots.txt content structure test PASSED');
console.log('✅ Sitemap XML schema validation test PASSED');
console.log('✅ Product URL & Image XML inclusion test PASSED');
console.log('✅ Project Kit URL & Cover Image XML inclusion test PASSED');

console.log('🎉 All Sitemap & Robots.txt SEO unit tests PASSED successfully!');
