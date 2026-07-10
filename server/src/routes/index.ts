// ============================================================================
// ElectroKart — Central Route Aggregator
// ============================================================================
// Mounts all modular route segments under standard namespace identifiers.
// Aggregated router is mounted under /api/v1 inside app.ts.
// ============================================================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import addressRoutes from './address.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import brandRoutes from './brand.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import orderRoutes from './order.routes.js';
import couponRoutes from './coupon.routes.js';
import paymentRoutes from './payment.routes.js';
import bannerRoutes from './banner.routes.js';
import analyticsRoutes from './analytics.routes.js';
import uploadRoutes from './upload.routes.js';
import searchRoutes from './search.routes.js';
import vendorRoutes from './vendor.routes.js';
import adminVendorRoutes from './adminVendor.routes.js';
import invoiceSettingsRoutes from './invoiceSettings.routes.js';
import adminCancellationRoutes from './adminCancellation.routes.js';
import contactRoutes from './contact.routes.js';
import projectKitRoutes from './projectKit.routes.js';
import organizerRoutes from './organizer.routes.js';
import adminOrganizerRoutes from './adminOrganizer.routes.js';
import adminEventRoutes from './adminEvent.routes.js';
import eventRoutes from './event.routes.js';

const router = Router();

// Route mappings
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/addresses', addressRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/payments', paymentRoutes);
router.use('/banners', bannerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/search', searchRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin/vendors', adminVendorRoutes);
router.use('/admin/invoice-settings', invoiceSettingsRoutes);
router.use('/admin/cancellation-requests', adminCancellationRoutes);
router.use('/contact', contactRoutes);
router.use('/project-kits', projectKitRoutes);

// Event Commerce Module
router.use('/organizer', organizerRoutes);
router.use('/admin/organizer-applications', adminOrganizerRoutes);
router.use('/admin/events', adminEventRoutes);
router.use('/events', eventRoutes);

export default router;
