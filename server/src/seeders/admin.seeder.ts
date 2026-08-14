// ============================================================================
// ElectroKart — Admin User Seeder
// ============================================================================
// Creates the default system administrator account if it does not already exist.
// ============================================================================

import User from '../models/User.model.js';
import { env } from '../config/env.js';

export async function seedAdminUser(): Promise<void> {
  console.log('👤 Seeding default administrative account...');
  const email = env.ADMIN_EMAIL || 'sales.shortcircuit@gmail.com';
  const password = env.ADMIN_PASSWORD || 'ShortCircuit@Ram1212';

  // Clear existing admin accounts to ensure clean credential update
  await User.deleteMany({ role: 'admin' });

  const admin = new User({
    firstName: 'System',
    lastName: 'Administrator',
    email,
    password, // Auto-hashed by pre-save hook in User model
    phone: '9219998403',
    role: 'admin',
    isEmailVerified: true,
  });

  await admin.save();

  console.log(`✅ Admin account created: ${email}`);
}

export default seedAdminUser;
