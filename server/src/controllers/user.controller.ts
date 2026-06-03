// ============================================================================
// ElectroKart — User Controller
// ============================================================================
// Processes profile query updates, avatar changes, and admin user status blocks.
// ============================================================================

import { Request, Response } from 'express';
import { UserService, UploadService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const user = await UserService.getProfile(userId);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully.'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const user = await UserService.updateProfile(userId, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully.'));
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  if (!req.file) {
    throw ApiError.badRequest('No avatar image file was uploaded.');
  }

  // 1. Fetch user to delete old avatar if exists
  const userObj = await UserService.getProfile(userId);
  if (userObj.avatar && userObj.avatar.publicId) {
    await UploadService.deleteAsset(userObj.avatar.publicId);
  }

  // 2. Upload new image
  const uploadResult = await UploadService.uploadBuffer(req.file.buffer, 'avatars');

  // 3. Update database
  const updatedUser = await UserService.updateAvatar(userId, {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
  });

  res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar updated successfully.'));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Users listed successfully.', result.pagination)
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'User details retrieved.'));
});

export const toggleBlockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.toggleBlockUser(req.params.id);
  const status = user.isBlocked ? 'suspended' : 'activated';
  res.status(200).json(new ApiResponse(200, user, `User account successfully ${status}.`));
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.changeUserRole(req.params.id, req.body.role);
  res.status(200).json(new ApiResponse(200, user, `User role changed to ${user.role}.`));
});
