// ============================================================================
// ElectroKart — Admin User Seeder
// ============================================================================
// Creates the default system administrator account if it does not already exist.
// ============================================================================

import User from '../models/User.model.js';
import { env } from '../config/env.js';

export async function seedAdminUser(): Promise<void> {
  console.log('👤 Seeding default administrative account...');
  const email = env.ADMIN_EMAIL || 'admin@electrokart.com';
  const password = env.ADMIN_PASSWORD || 'AdminPass@12345';

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log('ℹ️ Admin user already exists. Skipping...');
    return;
  }

  await User.create({
    firstName: 'System',
    lastName: 'Administrator',
    email,
    password, // Auto-hashed by pre-save hook in User model
    phone: '9876543210',
    role: 'admin',
    isEmailVerified: true,
  });

  console.log(`✅ Admin account created: ${email}`);
}

export default seedAdminUser;
