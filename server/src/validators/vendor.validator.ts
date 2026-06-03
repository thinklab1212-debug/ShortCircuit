// ============================================================================
// ElectroKart — Vendor Validators
// ============================================================================
// Zod schemas for vendor operations: creating vendor accounts, updating
// vendor profiles, vendor product CRUD, and admin product review.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Admin: Create Vendor Account
// ---------------------------------------------------------------------------

export const createVendorSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),

  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name cannot exceed 50 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),

  businessName: z
    .string({ required_error: 'Business name is required' })
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(150, 'Business name cannot exceed 150 characters'),

  contactPerson: z
    .string({ required_error: 'Contact person is required' })
    .trim()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(100, 'Contact person name cannot exceed 100 characters'),

  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),

  gstin: z
    .string()
    .trim()
    .max(15, 'GSTIN cannot exceed 15 characters')
    .optional(),
});

// ---------------------------------------------------------------------------
// Vendor: Update Own Profile
// ---------------------------------------------------------------------------

export const updateVendorProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(150, 'Business name cannot exceed 150 characters')
    .optional(),

  contactPerson: z
    .string()
    .trim()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(100, 'Contact person name cannot exceed 100 characters')
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .optional(),

  gstin: z
    .string()
    .trim()
    .max(15, 'GSTIN cannot exceed 15 characters')
    .optional(),
});

// ---------------------------------------------------------------------------
// Vendor: Create Product
// ---------------------------------------------------------------------------

const productImageSchema = z.object({
  url: z.string().url('Product image must be a valid URL'),
  publicId: z.string().min(1, 'Public ID is required'),
  alt: z.string().max(200).optional(),
  isPrimary: z.boolean().optional().default(false),
});

const specificationSchema = z.object({
  key: z.string().trim().min(1, 'Specification key cannot be empty'),
  value: z.string().trim().min(1, 'Specification value cannot be empty'),
  group: z.string().trim().max(100).optional().default('General'),
});

const variantOptionSchema = z.object({
  value: z.string().trim(),
  priceModifier: z.number().default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().trim().regex(/^[A-Z0-9-]+$/).optional(),
});

const productVariantSchema = z.object({
  name: z.string().trim().min(1),
  options: z.array(variantOptionSchema).min(1),
});

const dimensionsSchema = z.object({
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

const APPLICATION_AREAS = [
  'IoT', 'Robotics', 'Drones', 'Home Automation', 'Wearables',
  'Industrial', 'Education', 'Prototyping', 'Agriculture',
  'Healthcare', 'Automotive', 'Environmental Monitoring',
] as const;

const CERTIFICATIONS = [
  'CE', 'FCC', 'RoHS', 'UL', 'ISO 9001', 'BIS', 'REACH', 'WEEE',
] as const;

export const vendorCreateProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),

  description: z
    .string({ required_error: 'Product description is required' })
    .trim()
    .min(10, 'Product description must be at least 10 characters'),

  shortDescription: z.string().trim().max(300).optional(),

  sku: z
    .string({ required_error: 'Product SKU is required' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase alphanumeric characters and hyphens'),

  vendorPrice: z
    .number({ required_error: 'Vendor price is required' })
    .positive('Vendor price must be a positive number'),

  category: objectIdSchema,
  brand: objectIdSchema,

  tags: z.array(z.string().trim().toLowerCase()).optional().default([]),
  images: z.array(productImageSchema).max(8).optional().default([]),

  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(5),

  variants: z.array(productVariantSchema).optional().default([]),
  specifications: z.array(specificationSchema).optional().default([]),

  // Extended fields
  manufacturer: z.string().trim().max(150).optional(),
  warranty: z.string().trim().max(200).optional(),
  datasheetUrl: z.string().trim().url().regex(/\.pdf$/i, 'Must be a PDF URL').optional(),
  packageContents: z.array(z.string().trim()).optional().default([]),
  applicationAreas: z.array(z.enum(APPLICATION_AREAS)).optional().default([]),
  voltageRating: z.string().trim().max(100).optional(),
  currentRating: z.string().trim().max(100).optional(),
  weight: z.number().positive().optional(),
  dimensions: dimensionsSchema.optional(),
  compatibility: z.array(z.string().trim()).optional().default([]),
  certifications: z.array(z.enum(CERTIFICATIONS)).optional().default([]),

  vendorNote: z.string().trim().max(500).optional(),
});

export const vendorUpdateProductSchema = vendorCreateProductSchema.partial();

// ---------------------------------------------------------------------------
// Admin: Review Product
// ---------------------------------------------------------------------------

export const reviewProductSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    price: z.number({ required_error: 'Price is required to approve' }).positive('Price must be positive'),
    salePrice: z.number().positive().optional(),
    images: z.array(z.string().url('Product image must be a valid URL')).max(15).optional(),
    imageMergeMode: z.enum(['append', 'replace']).optional().default('append'),
  }),
  z.object({
    action: z.literal('reject'),
    reason: z.string({ required_error: 'Rejection reason is required' }).trim().min(5, 'Reason must be at least 5 characters').max(1000),
  }),
]);

export default {
  createVendorSchema,
  updateVendorProfileSchema,
  vendorCreateProductSchema,
  vendorUpdateProductSchema,
  reviewProductSchema,
};
