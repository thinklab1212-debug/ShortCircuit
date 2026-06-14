// ============================================================================
// Short Circuit — Database Seeder Runner
// ============================================================================
// Establishes database connection, executes all seeders sequentially, and closes
// database connections gracefully.
// ============================================================================

import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedAdminUser } from './admin.seeder.js';
import { seedCategories } from './categories.seeder.js';
import { seedBrands } from './brands.seeder.js';
import { seedCoupons } from './coupon.seeder.js';

async function runSeeders() {
  console.log('🌱 Starting Short Circuit Database Seeding...');
  
  try {
    // 1. Connect to MongoDB database
    await connectDatabase();
    
    // 2. Execute seeders in sequential dependency order
    await seedAdminUser();
    await seedCategories();
    await seedBrands();
    await seedCoupons();

    console.log('🌱 Database Seeding Completed Successfully!');
    
    // 3. Close database connection
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Failed:', error);
    try {
      await disconnectDatabase();
    } catch (disError) {
      console.error('❌ Failed to disconnect database after error:', disError);
    }
    process.exit(1);
  }
}

runSeeders();
