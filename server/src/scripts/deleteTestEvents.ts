import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import '../models/index.js';
import Event from '../models/Event.model.js';

async function deleteEvents() {
  console.log('================================================================');
  console.log('🧹 DELETING TEST EVENTS FROM DATABASE');
  console.log('================================================================\n');

  await connectDatabase();

  try {
    const events = await Event.find({}).lean();
    console.log(`Found ${events.length} Event(s) in DB:`);
    events.forEach((e) => {
      console.log(`  - Event ID: ${e._id}, Name: "${e.eventName}", Slug: ${e.slug}, Status: ${e.status}`);
    });

    const deleteResult = await Event.deleteMany({});
    console.log(`\n✔ Deleted ${deleteResult.deletedCount} Event(s).`);

    const remainingCount = await Event.countDocuments();
    console.log(`\nVerification:`);
    console.log(`  - Remaining Events in DB: ${remainingCount}`);

    console.log('\n================================================================');
    console.log('✅ TEST EVENTS DELETED SUCCESSFULLY');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error deleting events:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

deleteEvents();
