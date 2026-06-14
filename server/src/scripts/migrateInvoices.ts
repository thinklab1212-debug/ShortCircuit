// ============================================================================
// ElectroKart — Legacy Invoice Migration Script
// ============================================================================
// Run once manually to assign invoice numbers and generate invoiceSnapshots
// for legacy Delivered + Paid orders that do not have them.
//
// Usage: npx tsx src/scripts/migrateInvoices.ts (from server directory)
// ============================================================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Order from '../models/Order.model.js';
import InvoiceSettings from '../models/InvoiceSettings.model.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('🏁 Starting legacy invoice migration...');
  
  // Establish connection
  await connectDatabase();

  try {
    // Query legacy orders
    const legacyOrders = await Order.find({
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      $or: [
        { invoiceNumber: { $exists: false } },
        { invoiceNumber: null },
        { invoiceSnapshot: { $exists: false } },
        { invoiceSnapshot: null }
      ]
    });

    console.log(`🔍 Found ${legacyOrders.length} legacy Delivered + Paid orders missing invoice numbers/snapshots.`);

    if (legacyOrders.length > 0) {
      let migratedCount = 0;
      for (const order of legacyOrders) {
        console.log(`⚙️ Migrating order ID: ${order.orderId} (DB _id: ${order._id})...`);
        // Saving the order triggers the model pre-save hook,
        // which assigns the invoiceNumber and populates the invoiceSnapshot.
        await order.save();
        migratedCount++;
        console.log(`✅ Order ${order.orderId} migrated. Assigned Invoice No: ${order.invoiceNumber}`);
      }
      console.log(`🎉 Successfully migrated ${migratedCount} legacy orders.`);
    } else {
      console.log('💡 No legacy orders require migration.');
    }
  } catch (err) {
    console.error('❌ Migration failed with error:', err);
  } finally {
    await disconnectDatabase();
    console.log('👋 Migration run complete.');
  }
}

runMigration();
