/**
 * Promo Claim Service
 *
 * Handles the claiming of promotions by guests, including:
 * - Guest account creation
 * - Chat conversation creation
 * - Email verification
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import * as chatService from './chat.service';
import { createNotification } from './notifications.service';

export interface PromoClaimInput {
  promotion_id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
}

export interface PromoClaimResult {
  conversationId: string;
  guestUserId: string;
  isNewUser: boolean;
}

/**
 * Handle a promo claim request
 * Creates guest account, chat conversation, and sends verification email
 */
export const handlePromoClaim = async (input: PromoClaimInput): Promise<PromoClaimResult> => {
  console.log('🎟️ [PromoClaimService] Processing claim for promotion:', input.promotion_id);

  const supabase = getAdminClient();

  // 1. Validate promotion exists and is claimable
  const { data: promotion, error: promoError } = await supabase
    .from('room_promotions')
    .select('*')
    .eq('id', input.promotion_id)
    .single();

  if (promoError || !promotion) {
    console.error('❌ [PromoClaimService] Promotion not found:', promoError);
    throw new AppError('NOT_FOUND', 'Promotion not found');
  }

  if (!promotion.is_claimable) {
    console.error('❌ [PromoClaimService] Promotion is not claimable');
    throw new AppError('BAD_REQUEST', 'This promotion is not claimable');
  }

  if (!promotion.is_active) {
    console.error('❌ [PromoClaimService] Promotion is not active');
    throw new AppError('BAD_REQUEST', 'This promotion is no longer active');
  }

  console.log('✅ [PromoClaimService] Promotion validated:', promotion.name);

  // 2. Check if user exists and get/create user ID
  let guestUserId: string;
  let isNewUser = false;

  // First check if user profile exists in users table
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.guest_email.trim().toLowerCase())
    .single();

  if (existingProfile) {
    // User profile exists - use it
    console.log('✅ [PromoClaimService] User profile exists:', existingProfile.id);
    guestUserId = existingProfile.id;
  } else {
    // User profile doesn't exist - need to create auth account and profile
    console.log('📝 [PromoClaimService] Creating new guest account...');
    isNewUser = true;

    // Get user type (use 'free' for guest users)
    const { data: userType } = await supabase
      .from('user_types')
      .select('id')
      .eq('name', 'free')
      .single();

    if (!userType) {
      console.error('❌ [PromoClaimService] Free user type not found');
      throw new AppError('INTERNAL_ERROR', 'System configuration error - user type not found');
    }

    // Try to create Supabase Auth account
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: input.guest_email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: false,
      user_metadata: { full_name: input.guest_name },
    });

    if (authError) {
      // Check if error is because user already exists in auth
      if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
        console.log('⚠️ [PromoClaimService] Auth account exists but profile missing, fetching user...');

        // User exists in auth but not in users table - find them
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users.find(
          (u) => u.email?.toLowerCase() === input.guest_email.trim().toLowerCase()
        );

        if (!existingAuthUser) {
          console.error('❌ [PromoClaimService] Could not find existing auth user');
          throw new AppError('INTERNAL_ERROR', 'Failed to create or find guest account');
        }

        guestUserId = existingAuthUser.id;
        console.log('✅ [PromoClaimService] Found existing auth user:', guestUserId);

        // Create the missing profile
        console.log('📝 [PromoClaimService] Creating missing user profile...');
        const { error: profileError } = await supabase.from('users').insert({
          id: guestUserId,
          email: input.guest_email.trim().toLowerCase(),
          full_name: input.guest_name,
          phone: input.guest_phone,
          user_type_id: userType.id,
        });

        if (profileError) {
          console.error('❌ [PromoClaimService] Failed to create profile:', profileError);
          throw new AppError('INTERNAL_ERROR', 'Failed to create user profile');
        }

        console.log('✅ [PromoClaimService] User profile created for existing auth user');
      } else {
        // Some other auth error
        console.error('❌ [PromoClaimService] Failed to create auth account:', authError);
        throw new AppError('INTERNAL_ERROR', 'Failed to create guest account');
      }
    } else if (authUser.user) {
      // Auth account created (or already existed)
      guestUserId = authUser.user.id;
      console.log('✅ [PromoClaimService] Auth account created/found:', guestUserId);

      // Check if profile already exists (in case auth user existed but returned no error)
      const { data: existingProfileCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', guestUserId)
        .single();

      if (existingProfileCheck) {
        console.log('✅ [PromoClaimService] User profile already exists, using it');
        isNewUser = false; // User already exists, don't send verification email
      } else {
        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: guestUserId,
          email: input.guest_email.trim().toLowerCase(),
          full_name: input.guest_name,
          phone: input.guest_phone,
          user_type_id: userType.id,
        });

        if (profileError) {
          console.error('❌ [PromoClaimService] Failed to create profile:', profileError);
          throw new AppError('INTERNAL_ERROR', 'Failed to create user profile');
        }

        console.log('✅ [PromoClaimService] User profile created');
      }
    } else {
      // Unexpected state
      console.error('❌ [PromoClaimService] Unexpected auth response');
      throw new AppError('INTERNAL_ERROR', 'Failed to create guest account');
    }
  }

  // 5. Get property owner ID and company ID (needed for customer record and chat)
  console.log('🔍 [PromoClaimService] Looking up property owner...');
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('company_id, name')
    .eq('id', input.property_id)
    .single();

  if (propertyError || !property) {
    console.error('❌ [PromoClaimService] Property not found:', propertyError);
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  const companyId = property.company_id;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    console.error('❌ [PromoClaimService] Property owner not found:', companyError);
    throw new AppError('NOT_FOUND', 'Property owner not found');
  }

  const propertyOwnerId = company.user_id;
  console.log('✅ [PromoClaimService] Property owner found:', propertyOwnerId);

  // 6. Create customer record (always create if doesn't exist - track all promo claimers as leads)
  // Check if customer record already exists for this company
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, tags')
    .eq('user_id', guestUserId)
    .eq('company_id', companyId)
    .single();

  if (!existingCustomer) {
    // Create new customer record marked as lead with promo_claim tag
    const { error: customerError } = await supabase.from('customers').insert({
      user_id: guestUserId,
      company_id: companyId,
      email: input.guest_email.trim().toLowerCase(),
      full_name: input.guest_name,
      phone: input.guest_phone,
      source: 'chat',
      status: 'lead', // Mark as lead (new potential customer)
      first_property_id: input.property_id, // Track which property they inquired about
      tags: ['promo_claim'], // Special tag to identify promo claimers
      last_contact_date: new Date().toISOString(),
    });

    if (customerError) {
      console.error('⚠️ [PromoClaimService] Failed to create customer record:', customerError);
      // Don't fail the entire operation
    } else {
      console.log('✅ [PromoClaimService] Customer record created as NEW LEAD with promo_claim tag');
    }
  } else {
    // Customer exists - add promo_claim tag if not already present
    const currentTags = existingCustomer.tags || [];
    if (!currentTags.includes('promo_claim')) {
      const updatedTags = [...currentTags, 'promo_claim'];
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          tags: updatedTags,
          last_contact_date: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id);

      if (updateError) {
        console.error('⚠️ [PromoClaimService] Failed to update customer tags:', updateError);
      } else {
        console.log('✅ [PromoClaimService] Added promo_claim tag to existing customer');
      }
    } else {
      console.log('✅ [PromoClaimService] Customer already has promo_claim tag');
    }
  }

  // 7. Create chat conversation
  console.log('💬 [PromoClaimService] Creating chat conversation...');
  const promoDetails = `${promotion.name} - ${
    promotion.discount_type === 'percentage'
      ? `${promotion.discount_value}% OFF`
      : promotion.discount_type === 'fixed_amount'
      ? `$${promotion.discount_value} OFF`
      : `${promotion.discount_value} Free Nights`
  }`;

  const initialMessage = `I would like to claim the promo: ${promoDetails}.\n\n${
    promotion.description ? `Details: ${promotion.description}\n\n` : ''
  }Please send me the promo code and instructions on how to use it for my booking.`;

  const { conversation } = await chatService.createConversation(
    {
      type: 'guest_inquiry',
      title: `Promo Claim: ${promotion.name}`,
      property_id: input.property_id,
      participant_user_ids: [propertyOwnerId],
      initial_message: initialMessage,
    },
    guestUserId
  );

  console.log('✅ [PromoClaimService] Chat conversation created:', conversation.id);

  // Note: Metadata column doesn't exist in chat_conversations table yet
  // For now, promo claims can be identified by the conversation title "Promo Claim: {promo_name}"
  // TODO: Add metadata column to chat_conversations table if needed for advanced filtering

  // 8. Send notification to property owner
  try {
    console.log('🔔 [PromoClaimService] Sending notification to property owner...');
    await createNotification({
      user_id: propertyOwnerId,
      title: 'New Promo Claim Lead',
      message: `${input.guest_name} has claimed the "${promotion.name}" promotion. Check your messages to send them the promo code.`,
      variant: 'success',
      priority: 'high',
      action_url: `/manage/chat/conversations/${conversation.id}`,
      action_label: 'View Message',
      send_email: false, // Don't send email, just in-app notification
    });
    console.log('✅ [PromoClaimService] Notification sent to property owner');
  } catch (notifError) {
    console.error('⚠️ [PromoClaimService] Failed to send notification:', notifError);
    // Don't fail the entire operation if notification fails
  }

  // 9. Send email verification (if new user)
  if (isNewUser) {
    try {
      console.log('📧 [PromoClaimService] Generating email verification link...');
      const { data: verifyData, error: verifyError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: input.guest_email,
      });

      if (!verifyError && verifyData?.properties?.action_link) {
        console.log('✅ [PromoClaimService] Email verification link generated');
        // TODO: Send email using email service
        // For now, just log the link
        console.log('🔗 [PromoClaimService] Verification link:', verifyData.properties.action_link);

        // Note: In production, you would call:
        // await sendEmail({
        //   to: input.guest_email,
        //   subject: `Verify your email - ${property.name} Promo Claim`,
        //   html: emailTemplate(verifyData.properties.action_link, input.guest_name, property.name)
        // });
      }
    } catch (emailError) {
      console.error('⚠️ [PromoClaimService] Failed to send verification email:', emailError);
      // Don't fail the entire operation if email fails
    }
  }

  console.log('🎉 [PromoClaimService] Promo claim completed successfully');

  return {
    conversationId: conversation.id,
    guestUserId,
    isNewUser,
  };
};
