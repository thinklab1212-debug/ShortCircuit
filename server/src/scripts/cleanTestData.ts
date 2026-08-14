// ============================================================================
// ElectroKart — Database Test Data Cleanup Script
// ============================================================================
// Wipes test transaction data, non-admin accounts, test events, carts, wishlists.
// PRESERVES: Products, Categories, Brands, ProjectKits, Banners, Admin Users.
// ============================================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing from environment variables.');
  process.exit(1);
}

async function cleanDatabase() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log(`✅ Connected to Database: ${mongoose.connection.name}\n`);

  console.log('🧹 Beginning Database Cleanup...\n');

  // Import models
  const Order = (await import('../models/Order.model.js')).default;
  const EventOrder = (await import('../models/EventOrder.model.js')).default;
  const Event = (await import('../models/Event.model.js')).default;
  const OrganizerApp = (await import('../models/OrganizerApplication.model.js')).default;
  const Cart = (await import('../models/Cart.model.js')).default;
  const Wishlist = (await import('../models/Wishlist.model.js')).default;
  const Address = (await import('../models/Address.model.js')).default;
  const Token = (await import('../models/Token.model.js')).default;
  const User = (await import('../models/User.model.js')).default;
  const Coupon = (await import('../models/Coupon.model.js')).default;
  const Product = (await import('../models/Product.model.js')).default;
  const Category = (await import('../models/Category.model.js')).default;
  const Brand = (await import('../models/Brand.model.js')).default;

  // 1. Delete Orders
  const ordersDeleted = await Order.deleteMany({});
  console.log(`📦 Orders deleted: ${ordersDeleted.deletedCount}`);

  // 2. Delete Event Orders
  const eventOrdersDeleted = await EventOrder.deleteMany({});
  console.log(`🎟️ Event Orders deleted: ${eventOrdersDeleted.deletedCount}`);

  // 3. Delete Events
  const eventsDeleted = await Event.deleteMany({});
  console.log(`📅 Events deleted: ${eventsDeleted.deletedCount}`);

  // 4. Delete Organizer Applications
  const organizerAppsDeleted = await OrganizerApp.deleteMany({});
  console.log(`📝 Organizer Applications deleted: ${organizerAppsDeleted.deletedCount}`);

  // 5. Clear Carts & Wishlists
  const cartsDeleted = await Cart.deleteMany({});
  console.log(`🛒 Carts cleared: ${cartsDeleted.deletedCount}`);

  const wishlistsDeleted = await Wishlist.deleteMany({});
  console.log(`❤️ Wishlists cleared: ${wishlistsDeleted.deletedCount}`);

  // 6. Clear Security & Session Tokens
  const tokensDeleted = await Token.deleteMany({});
  console.log(`🔑 Tokens cleared: ${tokensDeleted.deletedCount}`);

  // 7. Delete Vendor Profiles & non-admin Users (including test vendors)
  const VendorProfile = (await import('../models/VendorProfile.model.js')).default;
  const vendorsDeleted = await VendorProfile.deleteMany({});
  console.log(`🏬 Vendor Profiles deleted: ${vendorsDeleted.deletedCount}`);

  const usersDeleted = await User.deleteMany({
    role: { $ne: 'admin' },
  });
  console.log(`👤 Non-Admin Users deleted (including test vendors): ${usersDeleted.deletedCount}`);

  // 8. Delete user addresses (preserve default admin addresses if any)
  const remainingUserIds = (await User.find({}).select('_id')).map((u) => u._id);
  const addressesDeleted = await Address.deleteMany({
    user: { $nin: remainingUserIds },
  });
  console.log(`🏠 Test User Addresses deleted: ${addressesDeleted.deletedCount}`);

  // 9. Reset Coupon Usage Metrics
  const couponsUpdated = await Coupon.updateMany(
    {},
    { $set: { usedCount: 0, usedBy: [] } }
  );
  console.log(`🏷️ Coupons reset: ${couponsUpdated.modifiedCount} coupons updated`);

  // Verification Audit of Preserved Data
  console.log('\n==================================================');
  console.log('🛡️ VERIFICATION AUDIT — PRESERVED DATA STATUS');
  console.log('==================================================');
  const productCount = await Product.countDocuments();
  const categoryCount = await Category.countDocuments();
  const brandCount = await Brand.countDocuments();
  const adminCount = await User.countDocuments({ role: 'admin' });
  const remainingUsers = await User.countDocuments();

  console.log(`✅ Total Products Intact:  ${productCount}`);
  console.log(`✅ Total Categories Intact: ${categoryCount}`);
  console.log(`✅ Total Brands Intact:     ${brandCount}`);
  console.log(`✅ Preserved Admin Users:   ${adminCount}`);
  console.log(`✅ Total Remaining Users:   ${remainingUsers}`);
  console.log('==================================================\n');

  console.log('✨ Cleanup completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

cleanDatabase().catch((err) => {
  console.error('❌ Error executing database cleanup:', err);
  process.exit(1);
});
