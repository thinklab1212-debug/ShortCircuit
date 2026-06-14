// ============================================================================
// ElectroKart — ProjectKit Validators
// ============================================================================
// Zod validation schemas for Smart Project Builder CRUD operations.
// Validates project metadata, BOM items, instruction steps, wiring
// diagrams (Drive URLs), and document links (Drive URLs).
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const cloudinaryAssetSchema = z.object({
  url: z.string({ required_error: 'Image URL is required' }).url('Must be a valid URL'),
  publicId: z.string({ required_error: 'Image public ID is required' }).min(1),
});

const driveUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine((url) => url.startsWith('https://'), { message: 'URL must use HTTPS' });

const bomItemSchema = z.object({
  product: objectIdSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity cannot exceed 50').default(1),
  note: z.string().trim().max(200, 'Note cannot exceed 200 characters').optional(),
  isOptional: z.boolean().default(false),
});

const instructionStepSchema = z.object({
  stepNumber: z.number().int().min(1, 'Step number must be at least 1'),
  title: z
    .string({ required_error: 'Step title is required' })
    .trim()
    .min(1, 'Step title is required')
    .max(200, 'Step title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Step content is required' })
    .min(1, 'Step content is required')
    .max(3000, 'Step content cannot exceed 3000 characters'),
  imageUrl: driveUrlSchema.optional(),
  tip: z.string().trim().max(500, 'Tip cannot exceed 500 characters').optional(),
});

const wiringDiagramSchema = z.object({
  imageUrl: driveUrlSchema,
  title: z.string().trim().max(150, 'Title cannot exceed 150 characters').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
});

const driveDocumentSchema = z.object({
  title: z
    .string({ required_error: 'Document title is required' })
    .trim()
    .min(1, 'Document title is required')
    .max(150, 'Document title cannot exceed 150 characters'),
  url: driveUrlSchema,
  type: z
    .enum(['schematic', 'datasheet', 'report', 'presentation', 'other'])
    .optional(),
});

// ---------------------------------------------------------------------------
// Application areas (mirrors Product model enum)
// ---------------------------------------------------------------------------

const applicationAreaEnum = z.enum([
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
]);

// ---------------------------------------------------------------------------
// Create ProjectKit schema
// ---------------------------------------------------------------------------

export const createProjectKitSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(1, 'Project name is required')
    .max(150, 'Project name cannot exceed 150 characters'),

  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),

  shortDescription: z
    .string()
    .trim()
    .max(300, 'Short description cannot exceed 300 characters')
    .optional(),

  coverImage: cloudinaryAssetSchema,

  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Difficulty level is required',
  }),

  applicationArea: applicationAreaEnum,

  tags: z
    .array(z.string().trim().max(50))
    .max(20, 'Cannot have more than 20 tags')
    .optional()
    .default([]),

  estimatedTime: z
    .string()
    .trim()
    .max(50, 'Estimated time cannot exceed 50 characters')
    .optional(),

  components: z
    .array(bomItemSchema)
    .min(1, 'At least one component is required')
    .max(30, 'Cannot have more than 30 components'),

  instructions: z
    .array(instructionStepSchema)
    .max(50, 'Cannot have more than 50 steps')
    .optional()
    .default([]),

  wiringDiagrams: z
    .array(wiringDiagramSchema)
    .max(10, 'Cannot have more than 10 wiring diagrams')
    .optional()
    .default([]),

  documents: z
    .array(driveDocumentSchema)
    .max(10, 'Cannot have more than 10 documents')
    .optional()
    .default([]),

  isActive: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
});

// ---------------------------------------------------------------------------
// Update ProjectKit schema (all fields optional)
// ---------------------------------------------------------------------------

export const updateProjectKitSchema = createProjectKitSchema.partial();

// ---------------------------------------------------------------------------
// Query params for public listing
// ---------------------------------------------------------------------------

export const projectKitQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, Math.min(50, parseInt(val, 10))) : 12))
    .pipe(z.number().int().min(1).max(50)),
  applicationArea: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'popular', 'featured']).optional().default('newest'),
});

export default {
  createProjectKitSchema,
  updateProjectKitSchema,
  projectKitQuerySchema,
};
