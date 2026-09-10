

import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import OrganizerApplication from '../models/OrganizerApplication.model.js';

async function run() {
  await connectDatabase();
  const apps = await OrganizerApplication.find({});
  console.log('Organizer applications:', apps.map(a => ({ id: a._id.toString(), org: a.organizationName, college: a.collegeName, status: a.status })));
  await disconnectDatabase();
  process.exit(0);
}

run().catch(console.error);
