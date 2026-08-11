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

// Implementation Assumption: Admin and Warehouse roles can fully manage products and stock.
// Sales read-access will be handled in Phase 4 when Challans are implemented.
router.use(authenticate);
router.use(authorize('Admin', 'Warehouse'));

router.route('/')
  .get(getProductsHandler)
  .post(createProductHandler);

router.route('/:id')
  .get(getProductByIdHandler)
  .put(updateProductHandler);

router.post('/:id/movements', addMovementHandler);

export default router;
