import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
  customerQuerySchema,
} from './customers.validation';
import * as customerService from './customers.service';

export async function createCustomerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(input);
    sendSuccess(res, customer, 'Customer created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getCustomersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = customerQuerySchema.parse(req.query);
    const result = await customerService.getCustomers(query);
    sendSuccess(res, result.customers, 'Customers retrieved.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getCustomerByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.getCustomerById(req.params.id as string);
    sendSuccess(res, customer, 'Customer detail retrieved.');
  } catch (error) {
    next(error);
  }
}

export async function updateCustomerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(req.params.id as string, input);
    sendSuccess(res, customer, 'Customer updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function addFollowUpNoteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = addNoteSchema.parse(req.body);
    const note = await customerService.addFollowUpNote(req.params.id as string, req.user!.userId, input);
    sendSuccess(res, note, 'Follow-up note added.', 201);
  } catch (error) {
    next(error);
  }
}
