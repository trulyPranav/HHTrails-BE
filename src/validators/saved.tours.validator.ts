import { z } from 'zod';

export const saveTourSchema = z.object({
  params: z.object({
    tourId: z.string().uuid('Invalid tour ID'),
  }),
});

export const removeSavedTourSchema = z.object({
  params: z.object({
    tourId: z.string().uuid('Invalid tour ID'),
  }),
});
