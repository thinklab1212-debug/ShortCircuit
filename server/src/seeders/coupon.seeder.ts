// ============================================================================
// ElectroKart — Coupon Seeder
// ============================================================================
// Seeds default discount codes.
// ============================================================================

import Coupon from '../models/Coupon.model.js';

export async function seedCoupons(): Promise<void> {
  console.log('🎟️ Seeding promotional coupons...');

  const couponCount = await Coupon.countDocuments();
  if (couponCount > 0) {
    console.log('ℹ️ Coupons already populated. Skipping...');
    return;
  }

  const today = new Date();
  const validFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const validUntil = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()); // Valid for 1 year

  await Coupon.create([
    {
      code: 'WELCOME100',
      description: 'Get flat ₹100 off on your first electronics components order!',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 499,
      validFrom,
      validUntil,
      usageLimit: 1000,
      perUserLimit: 1,
      isActive: true,
    },
    {
      code: 'DIYSTUDENT',
      description: '10% discount on DIY microcontroller starter kits. Capped at ₹250.',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 999,
      maxDiscount: 250,
      validFrom,
      validUntil,
      usageLimit: 500,
      perUserLimit: 2,
      isActive: true,
    },
    {
      code: 'FESTIVE15',
      description: 'Festive season discount. 15% off on orders above ₹1999. Capped at ₹500.',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 1999,
      maxDiscount: 500,
      validFrom,
      validUntil,
      usageLimit: 200,
      perUserLimit: 1,
      isActive: true,
    },
  ]);

  console.log('✅ Coupons seeded successfully.');
}

export default seedCoupons;
