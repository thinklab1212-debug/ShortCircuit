// ============================================================================
// ShortCircuit — Workshop Validators
// ============================================================================
// Defines input validation schemas for Workshops, Experience, and Inquiries.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ─── Workshop Card Validation ──────────────────────────────────────────────────

export const createWorkshopSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description must not exceed 500 characters'),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters'),
  displayOrder: z.coerce.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

// ─── Workshop Experience (Institution) Validation ──────────────────────────────

export const workshopExperienceLogoSchema = z.object({
  url: z.string({ required_error: 'Logo URL is required' }).url('Invalid logo URL'),
  publicId: z.string({ required_error: 'Logo public ID is required' }).min(1),
});

export const createWorkshopExperienceSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must not exceed 120 characters'),
  logo: workshopExperienceLogoSchema,
  displayOrder: z.coerce.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateWorkshopExperienceSchema = createWorkshopExperienceSchema.partial();

// ─── Workshop Inquiry Validation ───────────────────────────────────────────────

export const createWorkshopInquirySchema = z.object({
  institutionName: z
    .string({ required_error: 'Institution name is required' })
    .trim()
    .min(2, 'Institution name must be at least 2 characters')
    .max(150, 'Institution name cannot exceed 150 characters'),
  institutionType: z.enum(['School', 'College', 'University', 'Other'], {
    required_error: 'Please select an institution type',
  }),
  contactPerson: z
    .string({ required_error: 'Contact person name is required' })
    .trim()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(100, 'Contact person name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Please enter a valid email address'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number cannot exceed 20 characters'),
  workshopArea: z
    .string({ required_error: 'Workshop area is required' })
    .trim()
    .min(2, 'Please select a workshop area')
    .max(100),
  expectedStudents: z.enum(
    ['Less than 30', '30–50', '50–100', '100–200', '200+'],
    { required_error: 'Please select expected number of students' }
  ),
  location: z
    .string({ required_error: 'City/Location is required' })
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(120, 'Location cannot exceed 120 characters'),
  preferredDate: z.coerce.date().optional(),
  message: z
    .string()
    .trim()
    .max(1500, 'Message cannot exceed 1500 characters')
    .optional(),
});

export const updateWorkshopInquiryStatusSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'], {
    required_error: 'Status is required',
  }),
});

export const workshopIdParamSchema = z.object({
  id: objectIdSchema,
});
