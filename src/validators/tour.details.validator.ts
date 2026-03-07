import { z } from 'zod';

// ─── Create ────────────────────────────────────────────────────────────────
export const createTourDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
  }),
  body: z.object({
    overview: z.string().min(1, 'Overview is required'),
    highlights: z
      .array(z.string().min(1))
      .min(1, 'At least one highlight is required'),
    inclusions: z
      .array(z.string().min(1))
      .min(1, 'At least one inclusion is required'),
    exclusions: z
      .array(z.string().min(1))
      .min(1, 'At least one exclusion is required'),
    accommodationDescription: z.string().min(1).optional().nullable(),
    accommodationMediaUrl: z.string().url('Accommodation media URL must be a valid URL').optional().nullable(),
    featureTitle: z.string().min(1).optional().nullable(),
    featureDescription: z.string().min(1).optional().nullable(),
    featureMediaUrl: z.string().url('Feature media URL must be a valid URL').optional().nullable(),
    featureIsVideo: z.boolean().optional().default(false),
    routeDescription: z.string().min(1).optional().nullable(),
    routePhotoUrl: z.string().url('Route photo URL must be a valid URL').optional().nullable(),
  }),
});

// ─── Update ────────────────────────────────────────────────────────────────
export const updateTourDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
  }),
  body: z
    .object({
      overview: z.string().min(1).optional(),
      highlights: z.array(z.string().min(1)).min(1).optional(),
      inclusions: z.array(z.string().min(1)).min(1).optional(),
      exclusions: z.array(z.string().min(1)).min(1).optional(),
      accommodationDescription: z.string().min(1).optional().nullable(),
      accommodationMediaUrl: z.string().url().optional().nullable(),
      featureTitle: z.string().min(1).optional().nullable(),
      featureDescription: z.string().min(1).optional().nullable(),
      featureMediaUrl: z.string().url().optional().nullable(),
      featureIsVideo: z.boolean().optional(),
      routeDescription: z.string().min(1).optional().nullable(),
      routePhotoUrl: z.string().url().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

// ─── Get ───────────────────────────────────────────────────────────────────
export const getTourDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
  }),
});

// ─── Type exports ──────────────────────────────────────────────────────────
export type CreateTourDetailsInput = z.infer<typeof createTourDetailsSchema>['body'];
export type UpdateTourDetailsInput = z.infer<typeof updateTourDetailsSchema>['body'];
