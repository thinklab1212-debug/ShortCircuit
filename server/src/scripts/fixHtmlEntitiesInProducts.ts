import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Product from '../models/Product.model.js';

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function fixProductNames() {
  console.log('🔧 Checking MongoDB products for HTML entity artifacts (&quot;, &#x27;, &amp;)...');
  await connectDatabase();

  const products = await Product.find({
    $or: [
      { name: { $regex: '&quot;' } },
      { name: { $regex: '&#x27;' } },
      { name: { $regex: '&amp;' } },
      { description: { $regex: '&quot;' } },
      { description: { $regex: '&#x27;' } },
    ],
  });

  console.log(`Found ${products.length} products with HTML entity artifacts.`);

  let updatedCount = 0;
  for (const p of products) {
    const cleanName = decodeHtmlEntities(p.name);
    const cleanDescription = decodeHtmlEntities(p.description);

    if (cleanName !== p.name || cleanDescription !== p.description) {
      console.log(`  - Cleaning: "${p.name}" ➔ "${cleanName}"`);
      await Product.findByIdAndUpdate(p._id, {
        name: cleanName,
        description: cleanDescription,
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully cleaned ${updatedCount} products in MongoDB.`);
  await disconnectDatabase();
  process.exit(0);
}

fixProductNames().catch(console.error);
