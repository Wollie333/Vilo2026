import { Request, Response } from 'express';
import { getFailedCheckoutAnalytics, FailedCheckoutFilters } from '../services/dashboard.service';
import { AppError } from '../utils/errors';

/**
 * Get failed checkout analytics
 * GET /api/analytics/failed-checkouts
 */
export const getFailedCheckoutAnalyticsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    // Parse filters from query params
    const filters: FailedCheckoutFilters = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      propertyId: req.query.propertyId as string | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
    };

    const analytics = await getFailedCheckoutAnalytics(userId, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Error fetching failed checkout analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
      });
    }
  }
};
