import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ConflictError, InternalError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

export class SavedToursController {
  /**
   * GET /api/v1/saved-tours  (Authenticated)
   * Returns all tours saved by the requesting user, with full tour data.
   */
  static async getSavedTours(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const { data, error } = await supabaseAdmin
        .from('saved_tours')
        .select(
          `
          id,
          created_at,
          tour:tours (
            id,
            title,
            description,
            region,
            types,
            season,
            duration_days,
            duration_nights,
            photo_url,
            is_custom,
            is_description_filled,
            created_at,
            updated_at
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching saved tours:', error);
        throw new InternalError('Failed to fetch saved tours');
      }

      const savedTours = (data ?? []).map((row: any) => ({
        savedId: row.id,
        savedAt: row.created_at,
        tour: row.tour
          ? {
              id: row.tour.id,
              title: row.tour.title,
              description: row.tour.description,
              region: row.tour.region,
              types: row.tour.types,
              season: row.tour.season,
              durationDays: row.tour.duration_days,
              durationNights: row.tour.duration_nights,
              photoUrl: row.tour.photo_url,
              isCustom: row.tour.is_custom,
              isDescriptionFilled: row.tour.is_description_filled,
              createdAt: row.tour.created_at,
              updatedAt: row.tour.updated_at,
            }
          : null,
      }));

      sendSuccess(res, { savedTours });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/saved-tours/:tourId  (Authenticated)
   * Save a tour for the requesting user.
   */
  static async saveTour(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { tourId } = req.params;

      // Confirm the tour exists
      const { data: tour, error: tourError } = await supabaseAdmin
        .from('tours')
        .select('id')
        .eq('id', tourId)
        .single();

      if (tourError || !tour) {
        throw new NotFoundError('Tour not found');
      }

      const { data, error } = await supabaseAdmin
        .from('saved_tours')
        .insert({ user_id: userId, tour_id: tourId })
        .select('id, created_at')
        .single();

      if (error) {
        // Unique constraint violation — already saved
        if (error.code === '23505') {
          throw new ConflictError('Tour is already saved');
        }
        console.error('Database error saving tour:', error);
        throw new InternalError('Failed to save tour');
      }

      sendSuccess(res, { savedId: data.id, tourId, savedAt: data.created_at }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/saved-tours/:tourId  (Authenticated)
   * Remove a saved tour for the requesting user.
   */
  static async removeSavedTour(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { tourId } = req.params;

      const { error, count } = await supabaseAdmin
        .from('saved_tours')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .eq('tour_id', tourId);

      if (error) {
        throw new InternalError(error.message);
      }

      if (!count || count === 0) {
        throw new NotFoundError('Saved tour not found');
      }

      sendSuccess(res, { message: 'Tour removed from saved list' });
    } catch (error) {
      next(error);
    }
  }
}
