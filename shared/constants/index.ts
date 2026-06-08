// ============================================================================
// ElectroKart — Shared Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Product Categories — Pre-defined for the electronics domain
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = [
  { name: 'Arduino Boards', slug: 'arduino-boards', icon: '🔌' },
  { name: 'ESP32 Boards', slug: 'esp32-boards', icon: '📡' },
  { name: 'Raspberry Pi', slug: 'raspberry-pi', icon: '🍓' },
  { name: 'Sensors', slug: 'sensors', icon: '📏' },
  { name: 'Robotics Kits', slug: 'robotics-kits', icon: '🤖' },
  { name: 'Drone Components', slug: 'drone-components', icon: '🚁' },
  { name: 'Flight Controllers', slug: 'flight-controllers', icon: '🎮' },
  { name: 'ESCs', slug: 'escs', icon: '⚡' },
  { name: 'Motors', slug: 'motors', icon: '⚙️' },
  { name: 'Batteries', slug: 'batteries', icon: '🔋' },
  { name: 'DIY Electronics Kits', slug: 'diy-electronics-kits', icon: '🛠️' },
  { name: 'IoT Components', slug: 'iot-components', icon: '🌐' },
  { name: 'Development Boards', slug: 'development-boards', icon: '💻' },
  { name: 'Engineering Tools', slug: 'engineering-tools', icon: '🔧' },
  { name: 'Cables & Connectors', slug: 'cables-connectors', icon: '🔗' },
  { name: 'Displays & LEDs', slug: 'displays-leds', icon: '💡' },
  { name: 'Power Supplies', slug: 'power-supplies', icon: '🔌' },
  { name: '3D Printing', slug: '3d-printing', icon: '🖨️' },
] as const;

// ---------------------------------------------------------------------------
// Product Brands — Pre-defined for the electronics domain
// ---------------------------------------------------------------------------

export const PRODUCT_BRANDS = [
  { name: 'Arduino', slug: 'arduino' },
  { name: 'Espressif', slug: 'espressif' },
  { name: 'Raspberry Pi Foundation', slug: 'raspberry-pi-foundation' },
  { name: 'Adafruit', slug: 'adafruit' },
  { name: 'SparkFun', slug: 'sparkfun' },
  { name: 'Seeed Studio', slug: 'seeed-studio' },
  { name: 'DFRobot', slug: 'dfrobot' },
  { name: 'Pololu', slug: 'pololu' },
  { name: 'Waveshare', slug: 'waveshare' },
  { name: 'Texas Instruments', slug: 'texas-instruments' },
  { name: 'STMicroelectronics', slug: 'stmicroelectronics' },
  { name: 'Microchip', slug: 'microchip' },
  { name: 'Bosch', slug: 'bosch' },
  { name: 'Holybro', slug: 'holybro' },
  { name: 'BetaFPV', slug: 'betafpv' },
  { name: 'TBS (Team BlackSheep)', slug: 'tbs' },
  { name: 'FlySky', slug: 'flysky' },
  { name: 'FrSky', slug: 'frsky' },
  { name: 'Generic', slug: 'generic' },
] as const;

// ---------------------------------------------------------------------------
// Order Status Progression
// ---------------------------------------------------------------------------

export const ORDER_STATUS_PROGRESSION = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

// ---------------------------------------------------------------------------
// Specification Groups (for organizing product specs)
// ---------------------------------------------------------------------------

export const SPECIFICATION_GROUPS = [
  'Electrical',
  'Mechanical',
  'Communication',
  'Environmental',
  'Performance',
  'Compatibility',
  'Physical',
  'General',
] as const;

// ---------------------------------------------------------------------------
// Application Areas (for product categorization)
// ---------------------------------------------------------------------------

export const APPLICATION_AREAS = [
  'IoT',
  'Robotics',
  'Drones',
  'Home Automation',
  'Wearables',
  'Industrial',
  'Education',
  'Prototyping',
  'Agriculture',
  'Healthcare',
  'Automotive',
  'Environmental Monitoring',
] as const;

// ---------------------------------------------------------------------------
// Certification Standards
// ---------------------------------------------------------------------------

export const CERTIFICATIONS = [
  'CE',
  'FCC',
  'RoHS',
  'UL',
  'ISO 9001',
  'BIS',
  'REACH',
  'WEEE',
] as const;
