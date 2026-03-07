import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ValidationError, InternalError, ConflictError } from '../utils/errors';
import { CreateTourDetailsInput, UpdateTourDetailsInput } from '../validators/tour.details.validator';

// ─── Mapper ────────────────────────────────────────────────────────────────
const mapDetailsRow = (row: Record<string, any>) => ({
  id: row.id,
  tourId: row.tour_id,
  overview: row.overview,
  highlights: row.highlights,
  inclusions: row.inclusions,
  exclusions: row.exclusions,
  accommodationDescription: row.accommodation_description,
  accommodationMediaUrl: row.accommodation_media_url,
  featureTitle: row.feature_title,
  featureDescription: row.feature_description,
  featureMediaUrl: row.feature_media_url,
  featureIsVideo: row.feature_is_video,
  routeDescription: row.route_description,
  routePhotoUrl: row.route_photo_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class TourDetailsController {
  /**
   * GET /api/v1/tours/:id/details  (Public)
   * Fetch the details record for a tour.
   */
  static async getTourDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        .from('tour_details')
        .select('*')
        .eq('tour_id', id)
        .single();

      if (error || !data) {
        throw new NotFoundError('Tour details not found');
      }

      sendSuccess(res, { tourDetails: mapDetailsRow(data) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tours/:id/details  (Admin only)
   * Create the details record for a tour. One record per tour (unique constraint).
   */
  static async createTourDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as CreateTourDetailsInput;

      // Confirm parent tour exists
      const { data: tour, error: tourError } = await supabaseAdmin
        .from('tours')
        .select('id')
        .eq('id', id)
        .single();

      if (tourError || !tour) {
        throw new NotFoundError('Tour not found');
      }

      // Prevent duplicates — tell caller to use PUT instead
      const { data: existing } = await supabaseAdmin
        .from('tour_details')
        .select('id')
        .eq('tour_id', id)
        .maybeSingle();

      if (existing) {
        throw new ConflictError('Tour details already exist. Use PUT to update them.');
      }

      const { data, error } = await supabaseAdmin
        .from('tour_details')
        .insert({
          tour_id: id,
          overview: body.overview,
          highlights: body.highlights,
          inclusions: body.inclusions,
          exclusions: body.exclusions,
          accommodation_description: body.accommodationDescription ?? null,
          accommodation_media_url: body.accommodationMediaUrl ?? null,
          feature_title: body.featureTitle ?? null,
          feature_description: body.featureDescription ?? null,
          feature_media_url: body.featureMediaUrl ?? null,
          feature_is_video: body.featureIsVideo ?? false,
          route_description: body.routeDescription ?? null,
          route_photo_url: body.routePhotoUrl ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating tour details:', error);
        throw new ValidationError(error.message);
      }

      if (!data) {
        throw new InternalError('Failed to create tour details');
      }

      sendSuccess(res, { tourDetails: mapDetailsRow(data) }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/tours/:id/details  (Admin only)
   * Update the details record for a tour.
   */
  static async updateTourDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateTourDetailsInput;

      // Build snake_case patch object from only provided fields
      const dbPatch: Record<string, unknown> = {};
      if (body.overview !== undefined) dbPatch.overview = body.overview;
      if (body.highlights !== undefined) dbPatch.highlights = body.highlights;
      if (body.inclusions !== undefined) dbPatch.inclusions = body.inclusions;
      if (body.exclusions !== undefined) dbPatch.exclusions = body.exclusions;
      if (body.accommodationDescription !== undefined) dbPatch.accommodation_description = body.accommodationDescription;
      if (body.accommodationMediaUrl !== undefined) dbPatch.accommodation_media_url = body.accommodationMediaUrl;
      if (body.featureTitle !== undefined) dbPatch.feature_title = body.featureTitle;
      if (body.featureDescription !== undefined) dbPatch.feature_description = body.featureDescription;
      if (body.featureMediaUrl !== undefined) dbPatch.feature_media_url = body.featureMediaUrl;
      if (body.featureIsVideo !== undefined) dbPatch.feature_is_video = body.featureIsVideo;
      if (body.routeDescription !== undefined) dbPatch.route_description = body.routeDescription;
      if (body.routePhotoUrl !== undefined) dbPatch.route_photo_url = body.routePhotoUrl;

      const { data, error } = await supabaseAdmin
        .from('tour_details')
        .update(dbPatch)
        .eq('tour_id', id)
        .select()
        .single();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          throw new NotFoundError('Tour details not found. Create them first with POST.');
        }
        throw new ValidationError(error?.message ?? 'Failed to update tour details');
      }

      sendSuccess(res, { tourDetails: mapDetailsRow(data) });
    } catch (error) {
      next(error);
    }
  }
}
