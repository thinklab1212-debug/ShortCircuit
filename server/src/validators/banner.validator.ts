// ============================================================================
// ElectroKart — Banner Validators
// ============================================================================
// Defines input validation schemas for homepage slider banners creation.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Sub-document Schemas
// ---------------------------------------------------------------------------

const bannerImageSchema = z.object({
  url: z.string({ required_error: 'Banner image URL is required' }).url('Image must be a valid URL'),
  publicId: z.string({ required_error: 'Image public ID is required' }).min(1),
});

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a banner.
 */
const bannerBaseSchema = z
  .object({
    title: z
      .string({ required_error: 'Banner title is required' })
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(150, 'Title must not exceed 150 characters'),
      
    subtitle: z
      .string()
      .trim()
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional(),
      
    description: z
      .string()
      .trim()
      .max(300, 'Description must not exceed 300 characters')
      .optional(),
      
    image: bannerImageSchema,
    
    mobileImage: bannerImageSchema.optional(),
    
    link: z
      .string()
      .trim()
      .optional(),
      
    linkText: z
      .string()
      .trim()
      .max(50)
      .optional()
      .default('Shop Now'),
      
    category: objectIdSchema.optional(),
    
    backgroundColor: z
      .string()
      .trim()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Background color must be a valid HEX color code')
      .optional()
      .default('#000000'),
      
    textColor: z
      .string()
      .trim()
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Text color must be a valid HEX color code')
      .optional()
      .default('#FFFFFF'),
      
    position: z
      .number()
      .int()
      .optional()
      .default(0),
      
    isActive: z
      .boolean()
      .optional()
      .default(true),
      
    startDate: z
      .string()
      .datetime({ message: 'Start date must be a valid ISO date-time string' })
      .transform((val) => new Date(val))
      .optional(),
      
    endDate: z
      .string()
      .datetime({ message: 'End date must be a valid ISO date-time string' })
      .transform((val) => new Date(val))
      .optional(),
  });

const bannerDateRefinement = (data: { startDate?: Date; endDate?: Date }) => {
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    return false;
  }
  return true;
};

const bannerDateRefinementOptions = {
  message: 'End date must be after the start date',
  path: ['endDate'],
};

/**
 * Schema for creating a banner.
 */
export const createBannerSchema = bannerBaseSchema.refine(
  bannerDateRefinement,
  bannerDateRefinementOptions
);

/**
 * Schema for updating an existing banner.
 */
export const updateBannerSchema = bannerBaseSchema.partial().refine(
  bannerDateRefinement,
  bannerDateRefinementOptions
);

export default {
  createBannerSchema,
  updateBannerSchema,
};
