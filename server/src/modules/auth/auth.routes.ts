import { Router } from 'express';
import { loginHandler, registerHandler, getMeHandler } from './auth.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public
router.post('/login', loginHandler);

// Protected — Admin only
router.post('/register', authenticate, authorize('Admin'), registerHandler);

// Protected — Any authenticated user
router.get('/me', authenticate, getMeHandler);

export default router;
