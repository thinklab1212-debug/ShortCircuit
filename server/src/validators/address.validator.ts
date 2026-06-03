// ============================================================================
// ElectroKart — Address Validators
// ============================================================================
// Defines input validation schemas for user address creation and editing.
// Supports specific formats for Indian pincodes, phone numbers, and states.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants & Enums
// ---------------------------------------------------------------------------

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const ADDRESS_TYPES = ['home', 'office', 'other'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a user address.
 */
export const createAddressSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
    
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be a valid 10-digit Indian mobile number.'),
    
  addressLine1: z
    .string({ required_error: 'Address line 1 is required' })
    .trim()
    .min(5, 'Address must be at least 5 characters long')
    .max(200, 'Address must not exceed 200 characters'),
    
  addressLine2: z
    .string()
    .trim()
    .max(200, 'Address must not exceed 200 characters')
    .optional(),
    
  landmark: z
    .string()
    .trim()
    .max(100, 'Landmark must not exceed 100 characters')
    .optional(),
    
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
    
  state: z.enum(INDIAN_STATES, {
    errorMap: () => ({ message: 'Invalid Indian state or union territory.' }),
  }),
  
  pincode: z
    .string({ required_error: 'Pincode is required' })
    .trim()
    .regex(/^[1-9]\d{5}$/, 'Invalid pincode. Must be a valid 6-digit Indian postal code.'),
    
  type: z
    .enum(ADDRESS_TYPES, {
      errorMap: () => ({ message: "Address type must be 'home', 'office', or 'other'." }),
    })
    .default('home'),
    
  isDefault: z
    .boolean()
    .optional()
    .default(false),
});

/**
 * Schema for updating an existing user address.
 */
export const updateAddressSchema = createAddressSchema.partial();

export default {
  createAddressSchema,
  updateAddressSchema,
  INDIAN_STATES,
  ADDRESS_TYPES,
};
