// ============================================================================
// ElectroKart — Address Controller
// ============================================================================
// Processes incoming address requests, delegating calculations to the service.
// ============================================================================

import { Request, Response } from 'express';
import { AddressService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const addresses = await AddressService.getAddresses(userId);
  res.status(200).json(new ApiResponse(200, addresses, 'Addresses fetched successfully.'));
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const address = await AddressService.createAddress(userId, req.body);
  res.status(201).json(new ApiResponse(201, address, 'Address added successfully.'));
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const addressId = req.params.id;
  const address = await AddressService.updateAddress(userId, addressId, req.body);
  res.status(200).json(new ApiResponse(200, address, 'Address updated successfully.'));
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const addressId = req.params.id;
  await AddressService.deleteAddress(userId, addressId);
  res.status(200).json(new ApiResponse(200, null, 'Address deleted successfully.'));
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const addressId = req.params.id;
  const address = await AddressService.setDefaultAddress(userId, addressId);
  res.status(200).json(new ApiResponse(200, address, 'Default address changed successfully.'));
});
