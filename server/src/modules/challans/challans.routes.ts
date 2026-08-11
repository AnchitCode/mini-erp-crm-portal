import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createChallanHandler,
  getChallansHandler,
  getChallanByIdHandler,
  confirmChallanHandler,
  cancelChallanHandler,
} from './challans.controller';

const router = Router();

// Read routes are available to Admin, Sales, and Accounts.
// Write/state-change routes are limited to Admin and Sales.
router.use(authenticate);

router.use(authorize('Admin', 'Sales', 'Accounts'));

router.route('/')
  .get(getChallansHandler)
  .post(authorize('Admin', 'Sales'), createChallanHandler);

router.route('/:id')
  .get(getChallanByIdHandler);

router.patch('/:id/confirm', authorize('Admin', 'Sales'), confirmChallanHandler);
router.patch('/:id/cancel', authorize('Admin', 'Sales'), cancelChallanHandler);

export default router;
