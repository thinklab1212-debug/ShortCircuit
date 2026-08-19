// ============================================================================
// ElectroKart — Variant & Attribute Validators
// ============================================================================
// Defines Zod validation schemas for Category Attribute Definitions, single
// ProductVariant creation/updates, batch variant imports, and variant queries.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Category Attribute Definition Schemas
// ---------------------------------------------------------------------------

export const attributeDefinitionSchema = z.object({
  key: z
    .string({ required_error: 'Attribute key is required' })
    .trim()
    .toLowerCase()
    .min(1, 'Attribute key cannot be empty')
    .max(50, 'Attribute key must not exceed 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Key can only contain lowercase letters, numbers, and underscores'),

  label: z
    .string({ required_error: 'Attribute label is required' })
    .trim()
    .min(1, 'Attribute label cannot be empty')
    .max(100, 'Attribute label must not exceed 100 characters'),

  type: z.enum(['string', 'number', 'boolean', 'enum'], {
    required_error: 'Attribute type is required',
  }),

  unit: z.string().trim().optional(),
  options: z.array(z.string().trim()).optional().default([]),
  isFilterable: z.boolean().optional().default(true),
  isRequired: z.boolean().optional().default(false),
});

export const updateCategoryAttributeDefsSchema = z.object({
  attributeDefinitions: z
    .array(attributeDefinitionSchema, {
      required_error: 'attributeDefinitions array is required',
    })
    .refine(
      (defs) => {
        const keys = defs.map((d) => d.key);
        return new Set(keys).size === keys.length;
      },
      { message: 'Duplicate attribute definition keys are not allowed.' }
    ),
});

// ---------------------------------------------------------------------------
// ProductVariant Schemas
// ---------------------------------------------------------------------------

export const variantImageSchema = z.object({
  url: z.string().url('Image must be a valid URL'),
  publicId: z.string().min(1, 'Image public ID is required'),
  alt: z.string().trim().optional(),
});

export const createVariantSchema = z.object({
  sku: z
    .string({ required_error: 'Variant SKU is required' })
    .trim()
    .toUpperCase()
    .min(1, 'SKU cannot be empty')
    .max(100, 'SKU must not exceed 100 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU can only contain uppercase letters, numbers, and hyphens'),

  mpn: z.string().trim().optional(),

  attributes: z.record(z.string(), z.string()).optional().default({}),
  numericalAttributes: z.record(z.string(), z.number()).optional().default({}),

  price: z
    .number({ required_error: 'Variant price is required' })
    .min(0, 'Price cannot be negative'),

  salePrice: z.number().min(0, 'Sale price cannot be negative').optional(),
  costPrice: z.number().min(0, 'Cost price cannot be negative').optional(),

  stock: z
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .default(0),

  lowStockThreshold: z.number().int().min(0).optional().default(5),
  isActive: z.boolean().optional().default(true),

  image: variantImageSchema.optional(),
  datasheetUrl: z.string().url('Datasheet must be a valid URL').optional(),
});

export const batchCreateVariantSchema = z.object({
  variants: z
    .array(createVariantSchema, { required_error: 'variants array is required' })
    .min(1, 'At least one variant must be provided'),
  dryRun: z.boolean().optional().default(false),
});

export const updateVariantSchema = createVariantSchema.partial();

export const variantFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sort: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});
