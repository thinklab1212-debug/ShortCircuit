// ============================================================================
// Unit Test: Site-Wide Search Optimization & Hybrid Regex Matching
// ============================================================================

import assert from 'assert';

console.log('🧪 Running Search Optimization Unit Test Suite...');

interface ProductMock {
  id: string;
  name: string;
  sku: string;
  tags: string[];
  shortDescription?: string;
  manufacturer?: string;
}

const mockCatalog: ProductMock[] = [
  { id: '1', name: 'DC High Torque Gear Motor 12V', sku: 'MOT-DC-12V', tags: ['motor', 'robotics', '12v'] },
  { id: '2', name: 'L298N Dual H-Bridge Motor Driver Module', sku: 'DRV-L298N', tags: ['motor driver', 'arduino', 'driver'] },
  { id: '3', name: 'Mini Submersible Water Pump 5V', sku: 'PMP-5V-01', tags: ['pump', 'water', '5v'] },
  { id: '4', name: 'ESP8266 NodeMCU WiFi Module', sku: 'MCU-ESP8266', tags: ['wifi', 'esp8266', 'iot'] },
  { id: '5', name: 'Arduino Uno R3 Board', sku: 'MCU-UNO-R3', tags: ['arduino', 'microcontroller'] },
];

function searchMockProducts(queryStr: string): ProductMock[] {
  if (!queryStr || !queryStr.trim()) return [];

  const searchStr = queryStr.trim();
  const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchRegex = new RegExp(escaped, 'i');

  return mockCatalog.filter((p) => {
    return (
      searchRegex.test(p.name) ||
      searchRegex.test(p.sku) ||
      p.tags.some((tag) => searchRegex.test(tag)) ||
      (p.shortDescription && searchRegex.test(p.shortDescription)) ||
      (p.manufacturer && searchRegex.test(p.manufacturer))
    );
  });
}

// Test 1: Search partial keyword "motor"
const motorResults = searchMockProducts('motor');
assert.strictEqual(motorResults.length, 2, 'Searching "motor" MUST return both DC Motor and L298N Motor Driver');
assert.strictEqual(motorResults.some((p) => p.name.includes('DC High Torque Gear Motor')), true);
assert.strictEqual(motorResults.some((p) => p.name.includes('L298N Dual H-Bridge Motor Driver')), true);

// Test 2: Search partial part number "l298"
const l298Results = searchMockProducts('l298');
assert.strictEqual(l298Results.length, 1, 'Searching "l298" MUST match L298N Motor Driver module');
assert.strictEqual(l298Results[0].sku, 'DRV-L298N');

// Test 3: Search "pump"
const pumpResults = searchMockProducts('pump');
assert.strictEqual(pumpResults.length, 1, 'Searching "pump" MUST match Mini Submersible Water Pump');
assert.strictEqual(pumpResults[0].id, '3');

// Test 4: Search "esp"
const espResults = searchMockProducts('esp');
assert.strictEqual(espResults.length, 1, 'Searching "esp" MUST match ESP8266 NodeMCU WiFi Module');
assert.strictEqual(espResults[0].sku, 'MCU-ESP8266');

// Test 5: Search by SKU prefix "MOT-"
const skuResults = searchMockProducts('MOT-');
assert.strictEqual(skuResults.length, 1, 'Searching by SKU prefix "MOT-" MUST match DC Motor');

console.log('✅ Partial keyword "motor" search test PASSED (found 2 items)');
console.log('✅ Part number prefix "l298" search test PASSED');
console.log('✅ Substring "pump" search test PASSED');
console.log('✅ Microcontroller "esp" search test PASSED');
console.log('✅ SKU prefix search test PASSED');

console.log('🎉 All Search Optimization unit tests PASSED successfully!');
