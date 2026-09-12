// ============================================================================
// ShortCircuit — Workshops Seeder
// ============================================================================
// Seeds initial workshop programs for schools & colleges into MongoDB.
// ============================================================================

import { Workshop } from '../models/index.js';
import { logger } from '../utils/index.js';

export const INITIAL_WORKSHOPS = [
  {
    title: 'Robotics: Line Follower, Obstacle Avoidance & Bluetooth Robot',
    description:
      'Comprehensive hands-on robotics workshop covering autonomous chassis assembly, infrared sensor arrays for line following, ultrasonic obstacle detection, and wireless Bluetooth smartphone motor control.',
    category: 'Robotics',
    displayOrder: 1,
    isActive: true,
  },
  {
    title: 'Internet of Things (IoT) & Smart Automation',
    description:
      'Hands-on workshop using ESP32/NodeMCU microcontrollers, environmental sensor integration, cloud telemetry, MQTT protocols, and real-time remote monitoring dashboards.',
    category: 'IoT',
    displayOrder: 2,
    isActive: true,
  },
  {
    title: 'Drone Technology & UAV Flight Dynamics',
    description:
      'Practical engineering workshop on quadcopter aerodynamics, frame assembly, brushless DC motors, electronic speed controllers (ESC), flight controller calibration, and safe piloting.',
    category: 'Drone Technology',
    displayOrder: 3,
    isActive: true,
  },
  {
    title: 'Embedded Systems & Microcontroller Firmware',
    description:
      'Low-level firmware development, GPIO registers, hardware timers, interrupts, and communication protocols (UART, SPI, I2C) for engineering students.',
    category: 'Embedded Systems',
    displayOrder: 4,
    isActive: true,
  },
  {
    title: 'Arduino & Basic Electronics Prototyping',
    description:
      'Fundamental electronics and breadboard circuit design, active/passive components, sensor interfacing, relay modules, and Arduino C++ programming designed for schools and early college students.',
    category: 'Arduino / Electronics',
    displayOrder: 5,
    isActive: true,
  },
];

export async function seedWorkshops() {
  try {
    const existingCount = await Workshop.countDocuments();
    if (existingCount > 0) {
      logger.info(`ℹ️ Workshops collection already has ${existingCount} records. Skipping seeder.`);
      return;
    }

    await Workshop.insertMany(INITIAL_WORKSHOPS);
    logger.info(`✅ Successfully seeded ${INITIAL_WORKSHOPS.length} initial workshops.`);
  } catch (error) {
    logger.error('❌ Error seeding workshops:', error);
    throw error;
  }
}

export default seedWorkshops;
