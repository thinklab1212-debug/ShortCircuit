// ============================================================================
// ElectroKart — Phase 1 Schema Verification Script
// ============================================================================
// Validates:
// 1. Standalone Product creation (default mode)
// 2. Product Family creation (productMode: 'family')
// 3. Category attribute definitions schema
// 4. ProductVariant creation with generic attributes & numerical attributes
// 5. Mongoose model compilation and validation rules
// ============================================================================

import mongoose from 'mongoose';
import { Category, Product, ProductVariant } from '../models/index.js';

async function verifyPhase1() {
  console.log('--- STARTING PHASE 1 SCHEMA VERIFICATION ---');

  // 1. Verify Category Attribute Definitions
  const testCategory = new Category({
    name: 'Test Resistors Category',
    description: 'Category for testing resistor specifications',
    attributeDefinitions: [
      {
        key: 'resistance',
        label: 'Resistance',
        type: 'number',
        unit: 'Ω',
        isFilterable: true,
        isRequired: true,
      },
      {
        key: 'tolerance',
        label: 'Tolerance',
        type: 'enum',
        unit: '%',
        options: ['0.1%', '1%', '5%'],
        isFilterable: true,
      },
      {
        key: 'package',
        label: 'Package',
        type: 'enum',
        options: ['0603', '0805', '1206'],
        isFilterable: true,
      },
    ],
  });

  const catValErr = testCategory.validateSync();
  if (catValErr) {
    throw new Error(`Category validation failed: ${catValErr.message}`);
  }
  console.log('✔ Category attributeDefinitions validation PASSED');

  // 2. Verify Standalone Product (e.g. Arduino Board)
  const standaloneProduct = new Product({
    name: 'Arduino Uno R3 Dev Board',
    description: 'Microcontroller development board',
    sku: 'ARD-UNO-R3',
    price: 499,
    stock: 50,
    category: new mongoose.Types.ObjectId(),
    brand: new mongoose.Types.ObjectId(),
  });

  const standaloneValErr = standaloneProduct.validateSync();
  if (standaloneValErr) {
    throw new Error(`Standalone Product validation failed: ${standaloneValErr.message}`);
  }
  if (standaloneProduct.productMode !== 'standalone') {
    throw new Error(`Expected default productMode to be 'standalone', got '${standaloneProduct.productMode}'`);
  }
  console.log('✔ Standalone Product validation PASSED (productMode defaulted to "standalone")');

  // 3. Verify Product Family (e.g. Resistor Family)
  const familyProduct = new Product({
    name: '0805 SMD Resistors 1% Family',
    description: 'Surface mount chip resistor family',
    sku: 'FAMILY-RES-0805',
    price: 2,
    stock: 0,
    productMode: 'family',
    category: testCategory._id,
    brand: new mongoose.Types.ObjectId(),
    variantCount: 144,
    priceRange: { min: 1.5, max: 3.5 },
  });

  const familyValErr = familyProduct.validateSync();
  if (familyValErr) {
    throw new Error(`Product Family validation failed: ${familyValErr.message}`);
  }
  if (familyProduct.productMode !== 'family') {
    throw new Error(`Expected productMode to be 'family', got '${familyProduct.productMode}'`);
  }
  console.log('✔ Product Family validation PASSED (productMode: "family")');

  // 4. Verify Linked ProductVariant (Resistor SKU)
  const resistorVariant = new ProductVariant({
    productId: familyProduct._id,
    sku: 'RES-0805-10K',
    mpn: 'RC0805JR-0710KL',
    attributes: new Map([
      ['resistance', '10 kΩ'],
      ['tolerance', '1%'],
      ['package', '0805'],
    ]),
    numericalAttributes: new Map([
      ['resistance_ohms', 10000],
      ['tolerance_pct', 1],
    ]),
    price: 2.50,
    stock: 1000,
    isActive: true,
  });

  const variantValErr = resistorVariant.validateSync();
  if (variantValErr) {
    throw new Error(`ProductVariant validation failed: ${variantValErr.message}`);
  }
  console.log('✔ Resistor ProductVariant validation PASSED');

  // 5. Verify Linked ProductVariant for LED (Generic Test)
  const ledVariant = new ProductVariant({
    productId: new mongoose.Types.ObjectId(),
    sku: 'LED-5MM-RED',
    attributes: new Map([
      ['color', 'Red'],
      ['size', '5mm'],
      ['forwardVoltage', '2.1V'],
    ]),
    numericalAttributes: new Map([
      ['size_mm', 5],
      ['voltage_v', 2.1],
    ]),
    price: 5.00,
    stock: 250,
    isActive: true,
  });

  const ledValErr = ledVariant.validateSync();
  if (ledValErr) {
    throw new Error(`LED ProductVariant validation failed: ${ledValErr.message}`);
  }
  console.log('✔ LED ProductVariant validation PASSED');

  console.log('\n--- ALL PHASE 1 SCHEMA VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

verifyPhase1().catch((err) => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
