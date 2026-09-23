import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shortcircuit_billing_super_secure_key_2026';

// Seed default admin if none exists
export async function ensureDefaultAdmin() {
  try {
    const count = await AdminUser.countDocuments();
    if (count === 0) {
      const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@shortcircuit.in';
      const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'ShortCircuit@2026';
      await AdminUser.create({
        email: defaultEmail,
        password: defaultPass,
        name: 'Administrator',
      });
      console.log(`🔑 [Auth] Default admin initialized: ${defaultEmail}`);
    }
  } catch (err: any) {
    console.warn('⚠️ [Auth] Admin check error:', err.message);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await AdminUser.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await AdminUser.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
}
