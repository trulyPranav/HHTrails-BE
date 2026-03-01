import { Router } from 'express';
import { SavedToursController } from '../../controllers/saved.tours.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { saveTourSchema, removeSavedTourSchema } from '../../validators/saved.tours.validator';

const router = Router();

// All saved-tour routes require an authenticated user
router.use(authenticate);

router.get('/', SavedToursController.getSavedTours);
router.post('/:tourId', validate(saveTourSchema), SavedToursController.saveTour);
router.delete('/:tourId', validate(removeSavedTourSchema), SavedToursController.removeSavedTour);

export default router;
