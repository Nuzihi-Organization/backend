import express from 'express';
import * as therapistController from '../controllers/therapistController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', therapistController.getAllTherapists);
router.post('/filter', therapistController.filterTherapists);
router.get('/:id', therapistController.getTherapistById);
router.get('/:id/availability', therapistController.getTherapistAvailability);
router.post('/:id/review', protect, restrictTo('user'), therapistController.addReview);

export default router;