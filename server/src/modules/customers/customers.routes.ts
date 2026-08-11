import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createCustomerHandler,
  getCustomersHandler,
  getCustomerByIdHandler,
  updateCustomerHandler,
  addFollowUpNoteHandler,
} from './customers.controller';

const router = Router();

// All customer routes require authentication and specific roles (Admin, Sales)
router.use(authenticate);
router.use(authorize('Admin', 'Sales'));

router.route('/')
  .get(getCustomersHandler)
  .post(createCustomerHandler);

router.route('/:id')
  .get(getCustomerByIdHandler)
  .put(updateCustomerHandler);

router.post('/:id/notes', addFollowUpNoteHandler);

export default router;
