import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { createChallanSchema, challanQuerySchema } from './challans.validation';
import * as challanService from './challans.service';

export async function createChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("INCOMING PAYLOAD:", JSON.stringify(req.body));
    const input = createChallanSchema.parse(req.body);
    const challan = await challanService.createChallan(input, req.user!.userId);
    sendSuccess(res, challan, 'Challan created as Draft.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getChallansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = challanQuerySchema.parse(req.query);
    const result = await challanService.getChallans(query);
    sendSuccess(res, result.challans, 'Challans retrieved.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getChallanByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.getChallanById(req.params.id as string);
    sendSuccess(res, challan, 'Challan detail retrieved.');
  } catch (error) {
    next(error);
  }
}

export async function confirmChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.confirmChallan(req.params.id as string, req.user!.userId);
    sendSuccess(res, challan, 'Challan confirmed. Stock has been deducted.');
  } catch (error) {
    next(error);
  }
}

export async function cancelChallanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.cancelChallan(req.params.id as string, req.user!.userId);
    sendSuccess(res, challan, 'Challan cancelled.');
  } catch (error) {
    next(error);
  }
}
