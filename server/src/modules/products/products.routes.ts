import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  addMovementHandler,
} from './products.controller';

const router = Router();

// All product endpoints require authentication
router.use(authenticate);

// Read-only routes: Admin, Warehouse, AND Sales (Sales needs product data for Challans)
router.get('/', authorize('Admin', 'Warehouse', 'Sales'), getProductsHandler);
router.get('/:id', authorize('Admin', 'Warehouse', 'Sales'), getProductByIdHandler);

// Write routes: Admin and Warehouse only
router.post('/', authorize('Admin', 'Warehouse'), createProductHandler);
router.put('/:id', authorize('Admin', 'Warehouse'), updateProductHandler);
router.post('/:id/movements', authorize('Admin', 'Warehouse'), addMovementHandler);

export default router;

