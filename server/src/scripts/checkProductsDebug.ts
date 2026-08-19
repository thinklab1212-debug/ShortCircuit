import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Product from '../models/Product.model.js';

async function check() {
  await connectDatabase();

  const total = await Product.countDocuments({});
  console.log(`Total products in MongoDB: ${total}`);

  // Check for duplicate SKUs
  const skuCounts = await Product.aggregate([
    { $group: { _id: '$sku', count: { $sum: 1 }, ids: { $push: '$_id' }, names: { $push: '$name' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (skuCounts.length > 0) {
    console.log(`⚠️ Found ${skuCounts.length} DUPLICATE SKUs:`);
    for (const d of skuCounts) {
      console.log(`  - SKU "${d._id}": ${d.count} occurrences (${d.names.join(', ')})`);
    }
  } else {
    console.log('✅ Zero duplicate SKUs found.');
  }

  // Check approvalStatus & isActive distribution
  const statusDist = await Product.aggregate([
    { $group: { _id: { isActive: '$isActive', approvalStatus: '$approvalStatus' }, count: { $sum: 1 } } },
  ]);
  console.log('\nStatus Distribution:');
  for (const s of statusDist) {
    console.log(`  - isActive: ${s._id.isActive}, approvalStatus: ${s._id.approvalStatus} ➔ ${s.count} products`);
  }

  await disconnectDatabase();
  process.exit(0);
}

check().catch(console.error);
