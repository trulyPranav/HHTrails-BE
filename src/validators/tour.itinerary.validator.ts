import { z } from 'zod';

// ─── Add day ───────────────────────────────────────────────────────────────
export const createItineraryDaySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
  }),
  body: z.object({
    dayNumber: z
      .number({ invalid_type_error: 'Day number must be a number' })
      .int('Day number must be an integer')
      .positive('Day number must be a positive integer'),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Image URL must be a valid URL'),
    imageTitle: z.string().min(1).optional().nullable(),
  }),
});

// ─── Update day ────────────────────────────────────────────────────────────
export const updateItineraryDaySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
    dayNumber: z.string().regex(/^\d+$/, 'Day number must be a positive integer'),
  }),
  body: z
    .object({
      description: z.string().min(1).optional(),
      imageUrl: z.string().url().optional(),
      imageTitle: z.string().min(1).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

// ─── Delete day ────────────────────────────────────────────────────────────
export const deleteItineraryDaySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
    dayNumber: z.string().regex(/^\d+$/, 'Day number must be a positive integer'),
  }),
});

// ─── Get itinerary ─────────────────────────────────────────────────────────
export const getItinerarySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tour ID'),
  }),
});

// ─── Type exports ──────────────────────────────────────────────────────────
export type CreateItineraryDayInput = z.infer<typeof createItineraryDaySchema>['body'];
export type UpdateItineraryDayInput = z.infer<typeof updateItineraryDaySchema>['body'];
