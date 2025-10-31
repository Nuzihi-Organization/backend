// routes/authRoutes.js (ES Modules)
import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/user/register', authController.userRegister);
router.post('/user/login', authController.userLogin);
router.post('/user/google-login', authController.googleLogin);

// Therapist routes
router.post('/therapist/login', authController.therapistLogin);

// Common routes
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);

// Therapist registration route
router.post('/therapist/register', authController.therapistRegister);

// Admin registration route  
router.post('/admin/register', authController.adminRegister);

export default router;