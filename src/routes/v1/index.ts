import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import docsRoutes from './docs.routes';
import tourRoutes from './tour.routes';
import blogRoutes from './blog.routes';
import savedToursRoutes from './saved.tours.routes';
import homeRoutes from './home.routes';

const router = Router();

// Mount v1 routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/docs', docsRoutes);
router.use('/tours', tourRoutes);
router.use('/blogs', blogRoutes);
router.use('/saved-tours', savedToursRoutes);
router.use('/home', homeRoutes);

export default router;
