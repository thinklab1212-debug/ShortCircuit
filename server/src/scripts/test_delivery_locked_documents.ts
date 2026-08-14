// ============================================================================
// Unit Test: Delivery-Gated Project Kit Access Control
// ============================================================================

import assert from 'assert';

console.log('🧪 Running Delivery-Gated Project Document Access Unit Test...');

interface AccessResult {
  isUnlocked: boolean;
  reason: 'admin' | 'delivered' | 'not_purchased' | 'not_delivered' | 'unauthenticated';
}

function simulateProjectAccess(
  userRole?: string,
  userId?: string,
  userOrders?: { status: string; productIds: string[] }[],
  kitProductIds: string[] = ['prod_1', 'prod_2']
): AccessResult {
  if (userRole === 'admin') {
    return { isUnlocked: true, reason: 'admin' };
  }

  if (!userId) {
    return { isUnlocked: false, reason: 'unauthenticated' };
  }

  if (!userOrders || userOrders.length === 0) {
    return { isUnlocked: false, reason: 'not_purchased' };
  }

  // Check if any delivered order contains kit products
  const hasDeliveredOrder = userOrders.some(
    (order) =>
      order.status === 'delivered' &&
      order.productIds.some((pId) => kitProductIds.includes(pId))
  );

  if (hasDeliveredOrder) {
    return { isUnlocked: true, reason: 'delivered' };
  }

  // Check if any active order contains kit products
  const hasActiveOrder = userOrders.some(
    (order) =>
      ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(order.status) &&
      order.productIds.some((pId) => kitProductIds.includes(pId))
  );

  if (hasActiveOrder) {
    return { isUnlocked: false, reason: 'not_delivered' };
  }

  return { isUnlocked: false, reason: 'not_purchased' };
}

function sanitizePublicDocuments(documents: { title: string; url: string; type: string }[], isUnlocked: boolean) {
  if (!isUnlocked) {
    return documents.map((doc) => ({
      title: doc.title,
      type: doc.type,
      url: '', // Stripped URL
      isLocked: true,
    }));
  }
  return documents.map((doc) => ({ ...doc, isLocked: false }));
}

// Test 1: Unauthenticated Visitor
const res1 = simulateProjectAccess(undefined, undefined);
assert.strictEqual(res1.isUnlocked, false, 'Unauthenticated visitor MUST NOT have unlocked access');
assert.strictEqual(res1.reason, 'unauthenticated');

// Test 2: Non-buyer Customer
const res2 = simulateProjectAccess('customer', 'usr_1', []);
assert.strictEqual(res2.isUnlocked, false, 'Non-buyer customer MUST NOT have unlocked access');
assert.strictEqual(res2.reason, 'not_purchased');

// Test 3: Customer with active processing/shipped order (not delivered yet)
const res3 = simulateProjectAccess('customer', 'usr_1', [{ status: 'shipped', productIds: ['prod_1'] }]);
assert.strictEqual(res3.isUnlocked, false, 'Customer with unshipped/undelivered order MUST NOT have access yet');
assert.strictEqual(res3.reason, 'not_delivered');

// Test 4: Customer with DELIVERED order
const res4 = simulateProjectAccess('customer', 'usr_1', [{ status: 'delivered', productIds: ['prod_1'] }]);
assert.strictEqual(res4.isUnlocked, true, 'Customer with DELIVERED order MUST have unlocked access');
assert.strictEqual(res4.reason, 'delivered');

// Test 5: Admin Role Override
const res5 = simulateProjectAccess('admin', 'admin_1', []);
assert.strictEqual(res5.isUnlocked, true, 'Admin MUST have unlocked preview access');
assert.strictEqual(res5.reason, 'admin');

// Test 6: Document URL Sanitization
const rawDocs = [
  { title: 'Guide PDF', url: 'https://drive.google.com/file/d/123/view', type: 'guide' },
  { title: 'Source Code', url: 'https://github.com/myrepo', type: 'code' },
];

const sanitizedPublic = sanitizePublicDocuments(rawDocs, false);
assert.strictEqual(sanitizedPublic[0].url, '', 'Raw Guide URL MUST be stripped for public/non-buyer');
assert.strictEqual(sanitizedPublic[1].url, '', 'Raw Source Code URL MUST be stripped for public/non-buyer');
assert.strictEqual(sanitizedPublic[0].isLocked, true);

const sanitizedUnlocked = sanitizePublicDocuments(rawDocs, true);
assert.strictEqual(sanitizedUnlocked[0].url, 'https://drive.google.com/file/d/123/view', 'Guide URL MUST be delivered when unlocked');
assert.strictEqual(sanitizedUnlocked[1].url, 'https://github.com/myrepo', 'Source Code URL MUST be delivered when unlocked');

console.log('✅ Unauthenticated visitor access gate test PASSED');
console.log('✅ Non-buyer customer access gate test PASSED');
console.log('✅ Undelivered order gate test PASSED');
console.log('✅ Delivered order unlock verification test PASSED');
console.log('✅ Admin preview override test PASSED');
console.log('✅ Public document URL sanitization test PASSED');

console.log('🎉 All Delivery-Gated Project Access unit tests PASSED successfully!');
