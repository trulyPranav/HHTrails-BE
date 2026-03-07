import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller';
import { validate } from '../../middleware/validator';
import { adminLoginSchema } from '../../validators/admin.validator';

const router = Router();

// POST /api/v1/admin/login
router.post('/login', validate(adminLoginSchema), AdminController.login);

export default router;
