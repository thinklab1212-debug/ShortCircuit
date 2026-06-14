// ============================================================================
// ElectroKart — Authentication & Session Verification Script
// ============================================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Token from '../models/Token.model.js';
import SecurityLog from '../models/SecurityLog.model.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/generateTokens.js';
import { ROLE_SESSION_CONFIG } from '../interfaces/auth.interface.js';
import { UserService } from '../services/user.service.js';
import { AuthService } from '../services/auth.service.js';

dotenv.config();

async function runTests() {
  console.log('=== AUTH SECURITY HARDENING VERIFICATION ===\n');

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in env variables');
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Clean up any test user if exists
  const testEmail = 'auth_verify_test_user@electrokart.com';
  await User.deleteMany({ email: testEmail });
  await SecurityLog.deleteMany({});

  // 2. Test Case 1: Create a test user
  console.log('\n--- 1. Creating Test User ---');
  const testUser = await User.create({
    firstName: 'Security',
    lastName: 'Verifier',
    email: testEmail,
    password: 'TestPassword@123',
    role: 'customer',
  });
  console.log(`Created test user with ID: ${testUser._id}, Role: ${testUser.role}`);

  // 3. Test Case 2: Role-based Expiration Configuration
  console.log('\n--- 2. Checking Role-based Expirations ---');
  console.log('ROLE_SESSION_CONFIG:', JSON.stringify(ROLE_SESSION_CONFIG, null, 2));
  
  if (
    ROLE_SESSION_CONFIG.customer.accessExpiry === '15m' &&
    ROLE_SESSION_CONFIG.customer.refreshExpiry === '30d' &&
    ROLE_SESSION_CONFIG.vendor.accessExpiry === '15m' &&
    ROLE_SESSION_CONFIG.vendor.refreshExpiry === '14d' &&
    ROLE_SESSION_CONFIG.admin.accessExpiry === '10m' &&
    ROLE_SESSION_CONFIG.admin.refreshExpiry === '7d'
  ) {
    console.log('✅ Role-based session configurations are correct.');
  } else {
    throw new Error('❌ Role-based configurations are incorrect.');
  }

  // 4. Test Case 3: Token Generation & Rotation
  console.log('\n--- 3. Testing Token Pair Generation & Rotation ---');
  const mockReq = {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    ip: '127.0.0.1',
  } as any;

  const tokens1 = await generateTokenPair(testUser, mockReq);
  console.log('Generated Token Pair 1.');
  
  // Verify active token exists in DB
  const storedTokensAfterGen = await Token.find({ userId: testUser._id });
  console.log(`Stored tokens after generation: ${storedTokensAfterGen.length}`);
  if (storedTokensAfterGen.length !== 1) {
    throw new Error('❌ Expected 1 token in database after generation.');
  }
  if (storedTokensAfterGen[0].status !== 'active') {
    throw new Error('❌ Expected token status to be active.');
  }
  console.log('✅ Token stored with status: active.');

  // Perform rotation
  console.log('Rotating Token Pair 1...');
  const tokens2 = await AuthService.rotateTokens(
    tokens1.accessToken,
    tokens1.refreshToken,
    { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' }
  );
  console.log('Generated Token Pair 2.');

  // Verify status of old token and presence of new token
  const storedTokensAfterRotation = await Token.find({ userId: testUser._id });
  console.log(`Stored tokens after rotation: ${storedTokensAfterRotation.length}`);
  
  const rotatedToken = storedTokensAfterRotation.find((t) => t.status === 'rotated');
  const activeToken = storedTokensAfterRotation.find((t) => t.status === 'active');

  if (!rotatedToken || !activeToken) {
    throw new Error('❌ Expected 1 rotated token and 1 active token in DB.');
  }
  if (!rotatedToken.rotatedAt) {
    throw new Error('❌ Expected rotatedAt timestamp to be set on rotated token.');
  }
  console.log('✅ Old token marked as rotated with timestamp:', rotatedToken.rotatedAt);
  console.log('✅ New token created with status: active.');

  // 5. Test Case 4: Refresh Token Reuse Detection
  console.log('\n--- 4. Testing Refresh Token Reuse Detection ---');
  
  // A. Test within grace period (should return the active token and succeed)
  console.log('Attempting reuse within 10-second grace period (simulating multi-tab race)...');
  const graceResult = await verifyRefreshToken(
    testUser._id.toString(),
    tokens1.refreshToken,
    { ip: '127.0.0.1', userAgent: 'Browser-Tab-2/1.0' }
  );
  if (!graceResult || graceResult.status !== 'active') {
    throw new Error('❌ Expected reuse within grace period to return the active token.');
  }
  console.log('✅ Reuse within grace period successfully bypassed and returned active token.');

  // B. Test outside grace period (should trigger reuse detection and revoke everything)
  try {
    console.log('Simulating delay: backdating rotatedAt by 15 seconds...');
    rotatedToken.rotatedAt = new Date(Date.now() - 15000);
    await rotatedToken.save();

    console.log('Attempting reuse outside grace period...');
    await verifyRefreshToken(
      testUser._id.toString(),
      tokens1.refreshToken,
      { ip: '127.0.0.1', userAgent: 'Malicious-Hijacker/1.0' }
    );
    throw new Error('❌ Expected verifyRefreshToken to throw on rotated token reuse!');
  } catch (error: any) {
    console.log('Caught expected error:', error.message);
    if (!error.message.includes('Potential session hijacking')) {
      throw error;
    }
    console.log('✅ Session hijacking successfully blocked outside grace period.');

    // Verify all sessions revoked
    const remainingTokens = await Token.find({ userId: testUser._id });
    console.log(`Remaining tokens in DB for user: ${remainingTokens.length}`);
    if (remainingTokens.length !== 0) {
      throw new Error('❌ Expected all tokens to be revoked on reuse detection!');
    }
    console.log('✅ All sessions for the user successfully revoked.');

    // Verify security log created
    const logs = await SecurityLog.find({ userId: testUser._id });
    console.log(`Security logs created: ${logs.length}`);
    if (logs.length !== 1 || logs[0].eventType !== 'refresh_token_reuse') {
      throw new Error('❌ Expected 1 refresh_token_reuse SecurityLog.');
    }
    console.log('✅ SecurityLog successfully created:', JSON.stringify(logs[0], null, 2));
  }

  // 6. Test Case 5: Session Revocation on Block
  console.log('\n--- 5. Testing Session Revocation on Account Block ---');
  // Re-generate a valid active token
  await generateTokenPair(testUser, mockReq);
  const activeTokensBeforeBlock = await Token.find({ userId: testUser._id });
  console.log(`Active tokens before block: ${activeTokensBeforeBlock.length}`);
  
  // Toggle block
  console.log('Toggling block status to true...');
  await UserService.toggleBlockUser(testUser._id.toString());
  
  // Verify user is blocked and has 0 active sessions
  const updatedUser = await User.findById(testUser._id).select('+isBlocked');
  console.log(`User isBlocked status: ${updatedUser?.isBlocked}`);
  if (!updatedUser?.isBlocked) {
    throw new Error('❌ Expected user to be blocked.');
  }

  const activeTokensAfterBlock = await Token.find({ userId: testUser._id });
  console.log(`Active tokens after block: ${activeTokensAfterBlock.length}`);
  if (activeTokensAfterBlock.length !== 0) {
    throw new Error('❌ Expected 0 tokens in database after blocking user.');
  }
  console.log('✅ Sessions proactively cleared on account block.');

  // 7. Test Case 6: Session Revocation on Password Change
  console.log('\n--- 6. Testing Session Revocation on Password Change ---');
  // Unblock user first
  await UserService.toggleBlockUser(testUser._id.toString());
  
  // Simulate active sessions on multiple devices (Browser A and Browser B)
  await generateTokenPair(testUser, mockReq);
  await generateTokenPair(testUser, { ...mockReq, ip: '192.168.1.50' });
  
  const tokensBeforePasswordChange = await Token.find({ userId: testUser._id });
  console.log(`Active tokens before password change: ${tokensBeforePasswordChange.length}`);
  if (tokensBeforePasswordChange.length !== 2) {
    throw new Error('❌ Expected 2 active tokens for Browser A and Browser B.');
  }

  console.log('Changing password...');
  await AuthService.changePassword(testUser._id.toString(), 'TestPassword@123', 'NewSecurePassword@123');
  
  const tokensAfterPasswordChange = await Token.find({ userId: testUser._id });
  console.log(`Active tokens after password change: ${tokensAfterPasswordChange.length}`);
  if (tokensAfterPasswordChange.length !== 0) {
    throw new Error('❌ Expected 0 tokens in database after password change.');
  }
  console.log('✅ All sessions successfully revoked on password change.');

  // Clean up
  await User.deleteMany({ email: testEmail });
  await SecurityLog.deleteMany({});
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Phase 1 Authentication Security Hardening is verified.');
}

runTests()
  .then(() => {
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
    process.exit(1);
  });
