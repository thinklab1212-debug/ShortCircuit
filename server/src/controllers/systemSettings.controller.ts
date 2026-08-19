// ============================================================================
// ElectroKart — System Settings Controller
// ============================================================================
// Manages retrieval and mutation of global system flags, maintenance mode state,
// and storefront feature controls.
// ============================================================================

import { Request, Response } from 'express';
import SystemSettings from '../models/SystemSettings.model.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

/**
 * @desc    Get public system settings (unauthenticated)
 * @route   GET /api/v1/settings/public
 * @access  Public
 */
export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await SystemSettings.getSettings();

  const publicData = {
    isMaintenanceMode: settings.isMaintenanceMode,
    maintenanceTitle: settings.maintenanceTitle,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceETA: settings.maintenanceETA || '',
    codEnabled: settings.codEnabled,
    guestCheckoutEnabled: settings.guestCheckoutEnabled,
  };

  res.status(200).json(
    new ApiResponse(200, publicData, 'Public system settings retrieved successfully')
  );
});

/**
 * @desc    Get complete system settings (admin only)
 * @route   GET /api/v1/settings/admin
 * @access  Private (Admin)
 */
export const getAdminSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await SystemSettings.getSettings();

  res.status(200).json(
    new ApiResponse(200, settings, 'Admin system settings retrieved successfully')
  );
});

/**
 * @desc    Update system settings (admin only)
 * @route   PATCH /api/v1/settings/admin
 * @access  Private (Admin)
 */
export const updateAdminSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SystemSettings.getSettings();

  const {
    isMaintenanceMode,
    maintenanceTitle,
    maintenanceMessage,
    maintenanceETA,
    codEnabled,
    guestCheckoutEnabled,
    emailNotificationsEnabled,
  } = req.body;

  if (typeof isMaintenanceMode === 'boolean') {
    settings.isMaintenanceMode = isMaintenanceMode;
  }
  if (typeof maintenanceTitle === 'string') {
    settings.maintenanceTitle = maintenanceTitle;
  }
  if (typeof maintenanceMessage === 'string') {
    settings.maintenanceMessage = maintenanceMessage;
  }
  if (typeof maintenanceETA === 'string') {
    settings.maintenanceETA = maintenanceETA;
  }
  if (typeof codEnabled === 'boolean') {
    settings.codEnabled = codEnabled;
  }
  if (typeof guestCheckoutEnabled === 'boolean') {
    settings.guestCheckoutEnabled = guestCheckoutEnabled;
  }
  if (typeof emailNotificationsEnabled === 'boolean') {
    settings.emailNotificationsEnabled = emailNotificationsEnabled;
  }

  await settings.save();

  res.status(200).json(
    new ApiResponse(200, settings, 'System settings updated successfully')
  );
});
