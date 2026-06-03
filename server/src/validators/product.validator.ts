// ============================================================================
// ElectroKart — Product Validators
// ============================================================================
// Defines input validation schemas for creating products, updating products,
// filtering product listings, and performing full-text search.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Constants & Allowed Enums
// ---------------------------------------------------------------------------

export const APPLICATION_AREAS = [
  'IoT',
  'Robotics',
  'Drones',
  'Home Automation',
  'Wearables',
  'Industrial',
  'Education',
  'Prototyping',
  'Agriculture',
  'Healthcare',
  'Automotive',
  'Environmental Monitoring',
] as const;

export const CERTIFICATIONS = [
  'CE',
  'FCC',
  'RoHS',
  'UL',
  'ISO 9001',
  'BIS',
  'REACH',
  'WEEE',
] as const;

// ---------------------------------------------------------------------------
// Product Sub-document Schemas
// ---------------------------------------------------------------------------

const productImageSchema = z.object({
  url: z.string().url('Product image must be a valid URL'),
  publicId: z.string().min(1, 'Public ID is required'),
  alt: z.string().max(200).optional(),
  isPrimary: z.boolean().optional().default(false),
});

const specificationSchema = z.object({
  key: z
    .string({ required_error: 'Specification key is required' })
    .trim()
    .min(1, 'Specification key cannot be empty'),
  value: z
    .string({ required_error: 'Specification value is required' })
    .trim()
    .min(1, 'Specification value cannot be empty'),
  group: z
    .string()
    .trim()
    .max(100)
    .optional()
    .default('General'),
});

const variantOptionSchema = z.object({
  value: z.string({ required_error: 'Variant option value is required' }).trim(),
  priceModifier: z
    .number({ required_error: 'Variant option price modifier is required' })
    .default(0),
  stock: z
    .number({ required_error: 'Variant option stock is required' })
    .int('Variant stock must be an integer')
    .min(0, 'Variant stock cannot be negative')
    .default(0),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]+$/, 'Variant SKU must contain only uppercase alphanumeric characters and hyphens')
    .optional(),
});

const productVariantSchema = z.object({
  name: z.string({ required_error: 'Variant name is required' }).trim().min(1),
  options: z
    .array(variantOptionSchema)
    .min(1, 'A variant must have at least one option'),
});

const dimensionsSchema = z.object({
  length: z.number().positive('Dimension length must be positive').optional(),
  width: z.number().positive('Dimension width must be positive').optional(),
  height: z.number().positive('Dimension height must be positive').optional(),
});

// ---------------------------------------------------------------------------
// Main Product Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new product.
 */
const productBaseSchema = z
  .object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(3, 'Product name must be at least 3 characters')
      .max(200, 'Product name must not exceed 200 characters'),
      
    description: z
      .string({ required_error: 'Product description is required' })
      .trim()
      .min(10, 'Product description must be at least 10 characters'),
      
    shortDescription: z
      .string()
      .trim()
      .max(300, 'Short description must not exceed 300 characters')
      .optional(),
      
    sku: z
      .string({ required_error: 'Product SKU is required' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase alphanumeric characters and hyphens'),
      
    price: z
      .number({ required_error: 'Product price is required' })
      .positive('Price must be a positive number'),
      
    salePrice: z
      .number()
      .positive('Sale price must be a positive number')
      .optional(),
      
    costPrice: z
      .number()
      .positive('Cost price must be a positive number')
      .optional(),
      
    category: objectIdSchema,
    brand: objectIdSchema,
    
    tags: z
      .array(z.string().trim().toLowerCase())
      .optional()
      .default([]),
      
    images: z
      .array(productImageSchema)
      .max(8, 'A product can have at most 8 images')
      .optional()
      .default([]),
      
    stock: z
      .number({ required_error: 'Stock quantity is required' })
      .int()
      .min(0, 'Stock cannot be negative')
      .default(0),
      
    lowStockThreshold: z
      .number()
      .int()
      .min(0, 'Low stock threshold cannot be negative')
      .optional()
      .default(5),
      
    isFeatured: z
      .boolean()
      .optional()
      .default(false),
      
    isActive: z
      .boolean()
      .optional()
      .default(true),
      
    variants: z
      .array(productVariantSchema)
      .optional()
      .default([]),
      
    specifications: z
      .array(specificationSchema)
      .optional()
      .default([]),
      
    // Extended Engineering Fields
    manufacturer: z
      .string()
      .trim()
      .max(150, 'Manufacturer name must not exceed 150 characters')
      .optional(),
      
    warranty: z
      .string()
      .trim()
      .max(200, 'Warranty description must not exceed 200 characters')
      .optional(),
      
    datasheetUrl: z
      .string()
      .trim()
      .url('Datasheet URL must be a valid URL')
      .regex(/\.pdf$/i, 'Datasheet URL must point to a PDF document')
      .optional(),
      
    packageContents: z
      .array(z.string().trim())
      .optional()
      .default([]),
      
    applicationAreas: z
      .array(z.enum(APPLICATION_AREAS))
      .optional()
      .default([]),
      
    voltageRating: z
      .string()
      .trim()
      .max(100, 'Voltage rating must not exceed 100 characters')
      .optional(),
      
    currentRating: z
      .string()
      .trim()
      .max(100, 'Current rating must not exceed 100 characters')
      .optional(),
      
    weight: z
      .number()
      .positive('Weight must be positive')
      .optional(),
      
    dimensions: dimensionsSchema.optional(),
    
    compatibility: z
      .array(z.string().trim())
      .optional()
      .default([]),
      
    certifications: z
      .array(z.enum(CERTIFICATIONS))
      .optional()
      .default([]),
  });

const salePriceRefinement = (data: { price?: number; salePrice?: number }) => {
  if (data.salePrice !== undefined && data.price !== undefined && data.salePrice >= data.price) {
    return false;
  }
  return true;
};

const salePriceRefinementOptions = {
  message: 'Sale price must be less than the regular price',
  path: ['salePrice'],
};

/**
 * Schema for creating a new product.
 */
export const createProductSchema = productBaseSchema.refine(
  salePriceRefinement,
  salePriceRefinementOptions
);

/**
 * Schema for updating an existing product.
 * Extends the create schema but makes all fields optional.
 */
export const updateProductSchema = productBaseSchema.partial().refine(
  salePriceRefinement,
  salePriceRefinementOptions
);

/**
 * Schema for validating product filtering query parameters.
 *
 * NOTE: Values are intentionally kept as strings and passed through to the
 * `buildProductFilters` utility, which performs the numeric/boolean parsing and
 * MongoDB filter assembly. The field names here MUST match what the filter
 * builder reads (search, minPrice, maxPrice, inStock, isFeatured, rating, tags,
 * applicationArea, certification, category, brand, sort).
 */
export const productFilterSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional().default('-createdAt'),
  search: z.string().trim().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  rating: z.string().optional(),
  inStock: z.string().optional(),
  isFeatured: z.string().optional(),
  tags: z.string().optional(),
  applicationArea: z.string().optional(),
  certification: z.string().optional(),
});

/**
 * Schema for full-text search parameters.
 */
export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query cannot be empty'),
    
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
});

export default {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  searchQuerySchema,
  APPLICATION_AREAS,
  CERTIFICATIONS,
};
