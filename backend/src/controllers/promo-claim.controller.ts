/**
 * Promo Claim Controller
 *
 * Handles HTTP requests for claiming promotions
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as promoClaimService from '../services/promo-claim.service';

/**
 * POST /api/promotions/claim
 * Claim a promotion (creates guest account, chat conversation)
 * Public endpoint - no authentication required
 */
export const claimPromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      promotion_id,
      property_id,
      guest_name,
      guest_email,
      guest_phone,
    } = req.body;

    console.log('🎟️ [PromoClaimController] Received claim request:', {
      promotion_id,
      property_id,
      guest_email,
    });

    const result = await promoClaimService.handlePromoClaim({
      promotion_id,
      property_id,
      guest_name,
      guest_email,
      guest_phone,
    });

    console.log('✅ [PromoClaimController] Claim successful:', result.conversationId);

    sendSuccess(res, {
      message: 'Promo claimed successfully. Please check your email to verify your account.',
      conversation_id: result.conversationId,
      guest_user_id: result.guestUserId,
      is_new_user: result.isNewUser,
    });
  } catch (error) {
    console.error('❌ [PromoClaimController] Error claiming promo:', error);
    next(error);
  }
};
