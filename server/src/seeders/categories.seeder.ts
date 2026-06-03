// ============================================================================
// ElectroKart — Category Seeder
// ============================================================================
// Seeds top-level parent categories and sub-categories.
// ============================================================================

import Category from '../models/Category.model.js';

export async function seedCategories(): Promise<void> {
  console.log('📂 Seeding product categories...');

  const categoryCount = await Category.countDocuments();
  if (categoryCount > 0) {
    console.log('ℹ️ Categories already populated. Skipping...');
    return;
  }

  // 1. Seed Top-Level Categories
  const microcontrollers = await Category.create({
    name: 'Microcontrollers & Dev Boards',
    description: 'Microcontroller boards, developmental platforms, and components.',
    icon: '🔌',
    isActive: true,
  });

  const sensors = await Category.create({
    name: 'Sensors & Modules',
    description: 'Analog and digital sensing modules for physical calculations.',
    icon: '📡',
    isActive: true,
  });

  const power = await Category.create({
    name: 'Power Supplies',
    description: 'Batteries, regulators, adapters, and charging modules.',
    icon: '🔋',
    isActive: true,
  });

  const wireless = await Category.create({
    name: 'IoT & Wireless',
    description: 'Bluetooth, WiFi, LoRa, and RF communications modules.',
    icon: '📶',
    isActive: true,
  });

  // 2. Seed Sub-Categories (using parent field)
  await Category.create([
    {
      name: 'Arduino',
      description: 'Arduino developmental boards and shields.',
      parent: microcontrollers._id,
      isActive: true,
    },
    {
      name: 'Raspberry Pi',
      description: 'Single board computers and accessories.',
      parent: microcontrollers._id,
      isActive: true,
    },
    {
      name: 'ESP Modules',
      description: 'Espressif WiFi and Bluetooth microcontrollers.',
      parent: microcontrollers._id,
      isActive: true,
    },
    {
      name: 'Environmental Sensors',
      description: 'Gas, pressure, temperature, and humidity sensors.',
      parent: sensors._id,
      isActive: true,
    },
    {
      name: 'Motion & Inertial',
      description: 'Accelerometers, gyroscopes, and distance sensors.',
      parent: sensors._id,
      isActive: true,
    },
  ]);

  console.log('✅ Product categories hierarchy seeded successfully.');
}

export default seedCategories;
