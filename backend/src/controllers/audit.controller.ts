import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { getAuditLogs } from '../services/audit.service';

/**
 * GET /api/audit
 * List audit logs with filters
 */
export const listAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAuditLogs({
      entityType: req.query.entityType as any,
      entityId: req.query.entityId as string,
      actorId: req.query.actorId as string,
      action: req.query.action as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    sendSuccess(res, result, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
