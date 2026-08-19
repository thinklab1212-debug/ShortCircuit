import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Product, ProductVariant } from '../models/index.js';

const targetProductIds = [
  '6a26ae67ca6314efd75e52da',
];

async function removeTargetProducts() {
  console.log('--- Removing Target Product from Database ---');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  for (const idStr of targetProductIds) {
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      console.warn(`⚠️ Invalid ObjectId format: ${idStr}`);
      continue;
    }

    const objId = new mongoose.Types.ObjectId(idStr);

    // Find product details before deletion
    const product = await Product.findById(objId);
    if (!product) {
      console.log(`ℹ️ Product ID ${idStr} not found in database (already removed).`);
      continue;
    }

    console.log(`\nDeleting Product: "${product.name}" (SKU: ${product.sku}, ID: ${idStr})...`);

    // Delete linked variants
    const variantDeleteRes = await ProductVariant.deleteMany({ productId: objId });
    console.log(`  - Deleted ${variantDeleteRes.deletedCount} linked specification variants.`);

    // Delete product document
    await Product.findByIdAndDelete(objId);
    console.log(`  - Product "${product.name}" successfully deleted from MongoDB.`);
  }

  await mongoose.disconnect();
  console.log('\n================================================================');
  console.log('--- TARGET PRODUCT REMOVAL COMPLETED ---');
  console.log('================================================================');
}

removeTargetProducts().catch((err) => {
  console.error('❌ Error removing target product:', err);
  process.exit(1);
});
