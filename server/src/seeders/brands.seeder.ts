// ============================================================================
// ElectroKart — Brand Seeder
// ============================================================================
// Seeds default manufacturers and popular makers brands.
// ============================================================================

import Brand from '../models/Brand.model.js';

export async function seedBrands(): Promise<void> {
  console.log('🏭 Seeding electronics manufacturers and brands...');

  const brandCount = await Brand.countDocuments();
  if (brandCount > 0) {
    console.log('ℹ️ Brands already populated. Skipping...');
    return;
  }

  await Brand.create([
    {
      name: 'Arduino',
      description: 'Open-source electronic prototyping platform enabling users to create interactive electronic objects.',
      website: 'https://www.arduino.cc',
      countryOfOrigin: 'Italy',
      isActive: true,
    },
    {
      name: 'Raspberry Pi',
      description: 'Single-board computers designed to promote teaching of basic computer science in schools and in developing countries.',
      website: 'https://www.raspberrypi.com',
      countryOfOrigin: 'United Kingdom',
      isActive: true,
    },
    {
      name: 'Adafruit',
      description: 'Open-source hardware company designed to be the best place online for learning electronics and making the best designed products.',
      website: 'https://www.adafruit.com',
      countryOfOrigin: 'United States',
      isActive: true,
    },
    {
      name: 'SparkFun',
      description: 'Producer of electronics parts, boards, kits, and tutorials.',
      website: 'https://www.sparkfun.com',
      countryOfOrigin: 'United States',
      isActive: true,
    },
    {
      name: 'Espressif',
      description: 'Semiconductor company that manufactures WiFi & Bluetooth low-power SoCs and modules.',
      website: 'https://www.espressif.com',
      countryOfOrigin: 'China',
      isActive: true,
    },
  ]);

  console.log('✅ Manufacturers and brands seeded successfully.');
}

export default seedBrands;
