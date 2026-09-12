import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import '../models/index.js';
import EventOrder from '../models/EventOrder.model.js';
import Event from '../models/Event.model.js';

async function deleteTestEventOrders() {
  console.log('================================================================');
  console.log('🧹 DELETING TEST EVENT ORDERS FROM DATABASE');
  console.log('================================================================\n');

  await connectDatabase();

  try {
    // 1. Find all current event orders
    const orders = await EventOrder.find({}).lean();
    console.log(`Found ${orders.length} Event Order(s) in DB:`);
    orders.forEach((o) => {
      console.log(`  - Order ID: ${o.orderId}, Team: ${o.teamId}, Leader: ${o.leaderName}, Total: ₹${o.priceBreakdown?.totalPrice}`);
    });

    // 2. Delete all Event Orders
    const deleteResult = await EventOrder.deleteMany({});
    console.log(`\n✔ Deleted ${deleteResult.deletedCount} Event Order(s).`);

    // 3. Reset any teams on Events that were marked purchased by the simulation
    const resetResult = await Event.updateMany(
      { 'teams.purchased': true },
      { $set: { 'teams.$[elem].purchased': false, 'teams.$[elem].purchasedAt': null } },
      { arrayFilters: [{ 'elem.purchased': true }] }
    );
    console.log(`✔ Reset purchased status for teams on events: matched ${resetResult.matchedCount}, modified ${resetResult.modifiedCount}`);

    // 4. Verify count
    const remainingCount = await EventOrder.countDocuments();
    console.log(`\nVerification:`);
    console.log(`  - Remaining Event Orders in DB: ${remainingCount}`);

    console.log('\n================================================================');
    console.log('✅ TEST EVENT ORDERS DELETED SUCCESSFULLY');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error deleting event orders:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

deleteTestEventOrders();
