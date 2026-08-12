import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getDashboardStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.user!.role;
    const stats = await dashboardService.getStats(role);
    sendSuccess(res, stats, 'Dashboard stats fetched successfully');
  } catch (error) {
    next(error);
  }
}
