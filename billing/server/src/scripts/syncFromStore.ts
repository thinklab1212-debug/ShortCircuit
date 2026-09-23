import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const STORE_URI = process.env.STORE_MONGODB_URI;
const BILLING_URI = process.env.MONGODB_URI;

export async function syncComponentsFromStore() {
  console.log('🔄 Starting component sync from ShortCircuit store...');

  if (!STORE_URI || !BILLING_URI) {
    throw new Error('Both STORE_MONGODB_URI and MONGODB_URI must be provided in .env');
  }

  // 1. Connect to Store DB
  console.log('📡 Connecting to ShortCircuit store database...');
  const storeConn = await mongoose.createConnection(STORE_URI, {
    serverSelectionTimeoutMS: 15000,
  }).asPromise();
  console.log('✅ Connected to Store database:', storeConn.name);

  // 2. Connect to Billing DB
  console.log('📡 Connecting to Billing database...');
  const billingConn = await mongoose.createConnection(BILLING_URI, {
    serverSelectionTimeoutMS: 15000,
  }).asPromise();
  console.log('✅ Connected to Billing database:', billingConn.name);

  // 3. Define Schemas / Collections
  const storeProductsCol = storeConn.collection('products');
  const storeKitsCol = storeConn.collection('projectkits');
  const billingProductsCol = billingConn.collection('products');

  const storeProducts = await storeProductsCol.find({}).toArray();
  console.log(`📦 Found ${storeProducts.length} products in Store DB.`);

  let kitsCount = 0;
  let storeKits: any[] = [];
  try {
    storeKits = await storeKitsCol.find({}).toArray();
    kitsCount = storeKits.length;
    console.log(`🧰 Found ${kitsCount} project kits in Store DB.`);
  } catch (e) {
    console.log('ℹ️ No projectkits collection found or empty.');
  }

  let syncedProducts = 0;
  let syncedKits = 0;

  // Sync Products
  for (const p of storeProducts) {
    const name = p.name || 'Unnamed Product';
    const sku = p.sku || '';
    const description = p.shortDescription || p.description || '';
    const unitPrice = p.salePrice || p.price || 0;
    const packageContents = Array.isArray(p.packageContents) ? p.packageContents : [];
    const isKit = packageContents.length > 0;

    await billingProductsCol.updateOne(
      { name },
      {
        $set: {
          name,
          sku,
          description,
          hsn: p.hsn || '8542',
          unit: isKit ? 'SET' : 'NOS',
          unitPrice,
          gstRate: 18,
          packageContents,
          isKit,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    syncedProducts++;
  }

  // Sync Kits
  for (const k of storeKits) {
    const name = k.title || k.name || 'Project Kit';
    const description = k.shortDescription || k.description || '';
    const unitPrice = k.price || k.estimatedCost || 0;
    const packageContents: string[] = [];

    if (Array.isArray(k.bom)) {
      for (const b of k.bom) {
        if (b.note) {
          packageContents.push(`${b.quantity || 1}x ${b.note}`);
        } else if (b.productName) {
          packageContents.push(`${b.quantity || 1}x ${b.productName}`);
        }
      }
    }

    await billingProductsCol.updateOne(
      { name },
      {
        $set: {
          name,
          sku: k.slug || '',
          description,
          hsn: '8542',
          unit: 'SET',
          unitPrice,
          gstRate: 18,
          packageContents,
          isKit: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    syncedKits++;
  }

  console.log(`🎉 Sync Complete! Synced ${syncedProducts} products and ${syncedKits} kits into Billing DB.`);

  await storeConn.close();
  await billingConn.close();

  return { syncedProducts, syncedKits, total: syncedProducts + syncedKits };
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('syncFromStore.ts')) {
  syncComponentsFromStore()
    .then((res) => {
      console.log('Result:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Sync failed:', err);
      process.exit(1);
    });
}
