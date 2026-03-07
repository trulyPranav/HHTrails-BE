import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ValidationError, InternalError, ConflictError } from '../utils/errors';
import { CreateItineraryDayInput, UpdateItineraryDayInput } from '../validators/tour.itinerary.validator';

// ─── Mapper ────────────────────────────────────────────────────────────────
const mapItineraryRow = (row: Record<string, any>) => ({
  id: row.id,
  tourId: row.tour_id,
  dayNumber: row.day_number,
  description: row.description,
  imageUrl: row.image_url,
  imageTitle: row.image_title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class TourItineraryController {
  /**
   * GET /api/v1/tours/:id/itinerary  (Public)
   * Returns all itinerary days for a tour, ordered by day_number.
   */
  static async getItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Confirm parent tour exists
      const { data: tour, error: tourError } = await supabaseAdmin
        .from('tours')
        .select('id')
        .eq('id', id)
        .single();

      if (tourError || !tour) {
        throw new NotFoundError('Tour not found');
      }

      const { data, error } = await supabaseAdmin
        .from('tour_itinerary')
        .select('*')
        .eq('tour_id', id)
        .order('day_number', { ascending: true });

      if (error) {
        throw new InternalError('Failed to fetch itinerary');
      }

      sendSuccess(res, { itinerary: (data ?? []).map(mapItineraryRow) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tours/:id/itinerary  (Admin only)
   * Add a single day to a tour's itinerary.
   * Day number must not exceed the tour's duration_days.
   */
  static async addItineraryDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as CreateItineraryDayInput;

      // Confirm parent tour exists and get duration_days for validation
      const { data: tour, error: tourError } = await supabaseAdmin
        .from('tours')
        .select('id, duration_days')
        .eq('id', id)
        .single();

      if (tourError || !tour) {
        throw new NotFoundError('Tour not found');
      }

      if (body.dayNumber > tour.duration_days) {
        throw new ValidationError(
          `Day number ${body.dayNumber} exceeds the tour duration of ${tour.duration_days} days`,
        );
      }

      const { data, error } = await supabaseAdmin
        .from('tour_itinerary')
        .insert({
          tour_id: id,
          day_number: body.dayNumber,
          description: body.description,
          image_url: body.imageUrl,
          image_title: body.imageTitle ?? null,
        })
        .select()
        .single();

      if (error) {
        // Unique constraint violation (duplicate day_number for this tour)
        if (error.code === '23505') {
          throw new ConflictError(`Day ${body.dayNumber} already exists. Use PUT to update it.`);
        }
        console.error('Database error adding itinerary day:', error);
        throw new ValidationError(error.message);
      }

      if (!data) {
        throw new InternalError('Failed to add itinerary day');
      }

      sendSuccess(res, { day: mapItineraryRow(data) }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/tours/:id/itinerary/:dayNumber  (Admin only)
   * Update description or imageUrl for a specific day.
   */
  static async updateItineraryDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, dayNumber } = req.params;
      const body = req.body as UpdateItineraryDayInput;
      const dayNum = parseInt(dayNumber, 10);

      const dbPatch: Record<string, unknown> = {};
      if (body.description !== undefined) dbPatch.description = body.description;
      if (body.imageUrl !== undefined) dbPatch.image_url = body.imageUrl;
      if (body.imageTitle !== undefined) dbPatch.image_title = body.imageTitle;

      const { data, error } = await supabaseAdmin
        .from('tour_itinerary')
        .update(dbPatch)
        .eq('tour_id', id)
        .eq('day_number', dayNum)
        .select()
        .single();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          throw new NotFoundError(`Itinerary day ${dayNum} not found`);
        }
        throw new ValidationError(error?.message ?? 'Failed to update itinerary day');
      }

      sendSuccess(res, { day: mapItineraryRow(data) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/tours/:id/itinerary/:dayNumber  (Admin only)
   * Remove a specific day from the itinerary.
   */
  static async deleteItineraryDay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, dayNumber } = req.params;
      const dayNum = parseInt(dayNumber, 10);

      const { error, count } = await supabaseAdmin
        .from('tour_itinerary')
        .delete({ count: 'exact' })
        .eq('tour_id', id)
        .eq('day_number', dayNum);

      if (error) {
        throw new InternalError(error.message);
      }

      if (!count || count === 0) {
        throw new NotFoundError(`Itinerary day ${dayNum} not found`);
      }

      sendSuccess(res, { message: `Day ${dayNum} deleted successfully` });
    } catch (error) {
      next(error);
    }
  }
}
