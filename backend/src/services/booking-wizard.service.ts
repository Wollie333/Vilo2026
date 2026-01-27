/**
 * Booking Wizard Service
 *
 * Handles guest booking flow with automatic account creation
 */

import { getAdminClient } from '../config/supabase';
import * as companyPaymentService from './company-payment-integration.service';
import { sendBookingConfirmationEmail } from './booking-notifications.service';
import { getBookingById } from './booking.service';
import { checkAvailability } from './room.service';
import { AppError } from '../utils/errors';
import { finalizeUserSetup } from './user-finalization.service';
import type {
  BookingWizardData,
  PricingBreakdown,
  ChatBookingResponse,
  PaymentProvider,
} from '../types/booking-wizard.types';
import crypto from 'crypto';

const supabase = getAdminClient();

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString('base64').slice(0, 16);
}

/**
 * Send password setup email to new guest
 * Uses email template system with fallback to hardcoded HTML
 */
async function sendPasswordSetupEmail(email: string, fullName: string, bookingReference: string): Promise<void> {
  console.log('📧 [BOOKING_WIZARD] Sending password setup email to:', email);

  // Generate password reset link (using Supabase's password reset flow)
  const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/auth/set-password?booking=${bookingReference}`,
    },
  });

  if (resetError || !resetData) {
    console.error('❌ [BOOKING_WIZARD] Failed to generate password setup link:', resetError);
    throw new AppError('INTERNAL_ERROR', 'Failed to send password setup email');
  }

  console.log('✅ [BOOKING_WIZARD] Generated password setup link');
  console.log('[BOOKING_WIZARD] Setup link:', resetData.properties.action_link);

  // Try to send using email template system first
  try {
    const emailTemplateService = await import('./email-template.service');

    console.log('[BOOKING_WIZARD] Attempting to send via email template system...');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'booking_guest_password_setup',
      recipient_email: email,
      recipient_name: fullName,
      variables: {
        full_name: fullName,
        booking_reference: bookingReference,
        setup_link: resetData.properties.action_link,
      },
      context_type: 'booking',
      context_id: undefined, // Booking not yet created at this point
    });

    console.log('✅ [BOOKING_WIZARD] Password setup email sent via template system');
    return;
  } catch (templateError) {
    console.warn('⚠️ [BOOKING_WIZARD] Template system failed, using fallback:', templateError);
  }

  // FALLBACK: Send with hardcoded email (backward compatibility)
  const { sendNotificationEmail, wrapInEmailTemplate } = await import('./email.service');

  const emailContent = `
    <h1>Welcome to Vilo!</h1>
    <p>Hi ${fullName},</p>
    <p>Thank you for your booking (Reference: <strong>${bookingReference}</strong>)!</p>
    <p>To access your booking details and manage your account, please set up your password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetData.properties.action_link}"
         style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Set Up Password
      </a>
    </p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't make this booking, please ignore this email.</p>
    <p>Best regards,<br>The Vilo Team</p>
  `;

  const html = wrapInEmailTemplate(emailContent, 'Set Up Your Vilo Account');

  const emailSent = await sendNotificationEmail({
    to: email,
    subject: `Set Up Your Vilo Account - Booking ${bookingReference}`,
    html,
  });

  if (!emailSent) {
    console.warn('⚠️ [BOOKING_WIZARD] Email service not configured, user will not receive setup email');
    console.log('[BOOKING_WIZARD] Manual setup link:', resetData.properties.action_link);
  } else {
    console.log('✅ [BOOKING_WIZARD] Password setup email sent via fallback');
  }
}

/**
 * Send booking confirmation email to existing user
 * Uses email template system with fallback to hardcoded HTML
 */
async function sendExistingUserBookingEmail(email: string, fullName: string, bookingReference: string): Promise<void> {
  console.log('📧 [BOOKING_WIZARD] Sending booking confirmation to existing user:', email);

  const loginUrl = `${process.env.FRONTEND_URL}/login?email=${encodeURIComponent(email)}`;

  // Try to send using email template system first
  try {
    const emailTemplateService = await import('./email-template.service');

    console.log('[BOOKING_WIZARD] Attempting to send via email template system...');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'booking_existing_user_confirmation',
      recipient_email: email,
      recipient_name: fullName,
      variables: {
        full_name: fullName,
        booking_reference: bookingReference,
        login_url: loginUrl,
      },
      context_type: 'booking',
      context_id: undefined, // Booking not yet created at this point
    });

    console.log('✅ [BOOKING_WIZARD] Booking confirmation email sent via template system');
    return;
  } catch (templateError) {
    console.warn('⚠️ [BOOKING_WIZARD] Template system failed, using fallback:', templateError);
  }

  // FALLBACK: Send with hardcoded email (backward compatibility)
  const { sendNotificationEmail, wrapInEmailTemplate } = await import('./email.service');

  const emailContent = `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${fullName},</p>
    <p>Thank you for your booking! Your booking reference is: <strong>${bookingReference}</strong></p>
    <p>To view your booking details and manage your reservation, please log in to your account:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}"
         style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Booking Details
      </a>
    </p>
    <p>You can also access your booking from the dashboard after logging in.</p>
    <p>If you have any questions about your booking, please don't hesitate to contact us.</p>
    <p>Best regards,<br>The Vilo Team</p>
  `;

  const html = wrapInEmailTemplate(emailContent, 'Booking Confirmation');

  const emailSent = await sendNotificationEmail({
    to: email,
    subject: `Booking Confirmed - ${bookingReference}`,
    html,
  });

  if (!emailSent) {
    console.warn('⚠️ [BOOKING_WIZARD] Email service not configured, user will not receive confirmation email');
    console.log('[BOOKING_WIZARD] Manual login URL:', loginUrl);
  } else {
    console.log('✅ [BOOKING_WIZARD] Booking confirmation email sent via fallback');
  }
}

/**
 * Get or create guest user account
 * - If user exists: return their ID and mark as existing
 * - If user doesn't exist: create account with auto-generated password and mark as new
 */
async function getOrCreateGuestUser(
  email: string,
  fullName: string,
  phone: string,
  bookingReference: string
): Promise<{ userId: string; isNewUser: boolean }> {
  console.log('=== [BOOKING_WIZARD] getOrCreateGuestUser called ===');
  console.log('[BOOKING_WIZARD] Email:', email);
  console.log('[BOOKING_WIZARD] Name:', fullName);

  // Check if user exists in our database
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    console.error('[BOOKING_WIZARD] Error checking user:', userError);
    throw new AppError('INTERNAL_ERROR', 'Failed to check user account');
  }

  if (existingUser) {
    console.log('✅ [BOOKING_WIZARD] User exists with ID:', existingUser.id);

    // Send booking confirmation email (they already have an account)
    await sendExistingUserBookingEmail(email, fullName, bookingReference);

    return {
      userId: existingUser.id,
      isNewUser: false,
    };
  }

  // User doesn't exist - create new account with auto-generated password
  console.log('🆕 [BOOKING_WIZARD] Creating new user account...');

  const autoPassword = generateSecurePassword();
  console.log('[BOOKING_WIZARD] Generated temporary password');

  // Create auth user with Supabase Admin API
  let authData;
  let authError;

  const createResult = await supabase.auth.admin.createUser({
    email,
    password: autoPassword,
    email_confirm: true, // Auto-confirm email so they can access immediately
    user_metadata: {
      full_name: fullName,
      phone,
      created_via: 'booking',
      booking_reference: bookingReference,
    },
  });

  authData = createResult.data;
  authError = createResult.error;

  // Handle case where auth user exists but profile doesn't (data inconsistency)
  if (authError && authError.message?.includes('already been registered')) {
    console.log('[BOOKING_WIZARD] Auth user exists, fetching existing auth user...');

    // Fetch the existing auth user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('[BOOKING_WIZARD] Failed to list users:', listError);
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch user account');
    }

    const existingAuthUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!existingAuthUser) {
      console.error('[BOOKING_WIZARD] Auth user not found after email_exists error');
      throw new AppError('INTERNAL_ERROR', 'User account in inconsistent state');
    }

    console.log('[BOOKING_WIZARD] Found existing auth user:', existingAuthUser.id);
    authData = { user: existingAuthUser };
    authError = null;
  } else if (authError || !authData?.user) {
    console.error('[BOOKING_WIZARD] Failed to create auth user:', authError);
    throw new AppError('INTERNAL_ERROR', 'Failed to create guest account');
  }

  console.log('✅ [BOOKING_WIZARD] Auth user ready:', authData.user.id);

  // Get user type (use 'free' for guest users)
  console.log('[BOOKING_WIZARD] Fetching free user type...');
  const { data: userType, error: userTypeError } = await supabase
    .from('user_types')
    .select('id')
    .eq('name', 'free')
    .single();

  if (userTypeError || !userType) {
    console.error('[BOOKING_WIZARD] Free user type not found:', userTypeError);
    // Try to clean up auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'System configuration error - user type not found');
  }

  console.log('[BOOKING_WIZARD] Free user type ID:', userType.id);

  // Create user profile in our database
  console.log('[BOOKING_WIZARD] Creating user profile...');
  let { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      phone,
      user_type_id: userType.id, // Use user_type_id, not user_type
    })
    .select('id')
    .single();

  // If profile already exists (might be created by a trigger), fetch it instead
  if (profileError && profileError.code === '23505') {
    console.log('[BOOKING_WIZARD] Profile already exists, fetching existing profile...');
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (fetchError || !existingProfile) {
      console.error('[BOOKING_WIZARD] Failed to fetch existing profile:', fetchError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new AppError('INTERNAL_ERROR', 'Failed to access guest profile');
    }

    userProfile = existingProfile;
    console.log('✅ [BOOKING_WIZARD] Using existing user profile:', userProfile.id);
  } else if (profileError || !userProfile) {
    console.error('[BOOKING_WIZARD] Failed to create user profile:', profileError);
    // Try to clean up auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'Failed to create guest profile');
  } else {
    console.log('✅ [BOOKING_WIZARD] User profile created:', userProfile.id);

    // Finalize guest user setup (create subscription)
    console.log('[BOOKING_WIZARD] Finalizing guest user setup...');
    try {
      await finalizeUserSetup({
        userId: userProfile.id,
      });
      console.log('✅ [BOOKING_WIZARD] Guest user finalization completed');
    } catch (finalizationError) {
      console.error('⚠️ [BOOKING_WIZARD] Guest user finalization failed:', finalizationError);
      console.warn('[BOOKING_WIZARD] Guest user created but finalization incomplete.');
    }
  }

  // Send password setup email
  await sendPasswordSetupEmail(email, fullName, bookingReference);

  return {
    userId: userProfile.id,
    isNewUser: true,
  };
}

export class BookingWizardService {
  /**
   * Calculate pricing breakdown for booking
   */
  async calculatePricing(data: {
    property_id: string;
    rooms: Array<{
      room_id: string;
      adults: number;
      children: number;
      unit_price: number;
      nights: number;
    }>;
    addons: Array<{
      addon_id: string;
      pricing_type: 'per_booking' | 'per_night' | 'per_guest' | 'per_guest_per_night';
      quantity: number;
      unit_price: number;
    }>;
    nights: number;
    total_guests: number;
    room_count: number;
  }): Promise<PricingBreakdown> {
    // Calculate room totals
    const rooms_detail = data.rooms.map((room) => ({
      room_name: '', // Will be filled by frontend
      nights: room.nights,
      price_per_night: room.unit_price,
      total: room.unit_price * room.nights,
    }));

    const room_total = rooms_detail.reduce((sum, room) => sum + room.total, 0);

    // Calculate add-on totals
    const addons_detail = data.addons.map((addon) => {
      let total = 0;
      switch (addon.pricing_type) {
        case 'per_booking':
          total = addon.unit_price * addon.quantity;
          break;
        case 'per_night':
          total = addon.unit_price * addon.quantity * data.nights;
          break;
        case 'per_guest':
          total = addon.unit_price * addon.quantity * data.total_guests;
          break;
        case 'per_guest_per_night':
          total = addon.unit_price * addon.quantity * data.total_guests * data.nights;
          break;
      }
      return {
        addon_name: '', // Will be filled by frontend
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total,
      };
    });

    const addons_total = addons_detail.reduce((sum, addon) => sum + addon.total, 0);
    const subtotal = room_total + addons_total;

    // TODO: Calculate taxes based on property location
    const tax_amount = 0;
    const discount_amount = 0;
    const total_amount = subtotal + tax_amount - discount_amount;

    // Get currency from property
    const { data: property } = await supabase
      .from('properties')
      .select('currency')
      .eq('id', data.property_id)
      .single();

    return {
      room_total,
      addons_total,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency: property?.currency || 'ZAR',
      rooms_detail,
      addons_detail,
    };
  }

  /**
   * Initiate booking (create pending booking before payment)
   */
  async initiateBooking(data: BookingWizardData): Promise<{
    booking_id: string;
    booking_reference: string;
    booking_status: 'pending';
  }> {
    // Generate booking reference
    const booking_reference = `VLO-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    // Get property details
    const { data: property } = await supabase
      .from('properties')
      .select('company_id')
      .eq('id', data.property_id)
      .single();

    if (!property) {
      throw new Error('Property not found');
    }

    // Get company's primary payment integration
    // This is optional - if not configured, property owner needs to set it up
    let companyPaymentIntegrationId: string | null = null;
    try {
      const primaryIntegration = await companyPaymentService.getPrimaryCompanyIntegration(
        property.company_id
      );
      if (primaryIntegration) {
        companyPaymentIntegrationId = primaryIntegration.id;
      }
    } catch (error) {
      // Log warning but don't fail booking creation
      console.warn(`No primary payment integration found for company ${property.company_id}`);
    }

    // Calculate total nights
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    const total_nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Check room availability for all selected rooms
    console.log('[BOOKING_WIZARD] Checking availability for', data.rooms.length, 'room(s)');
    for (const room of data.rooms) {
      console.log('[BOOKING_WIZARD] Checking room:', room.room_name, '(ID:', room.room_id, ')');
      console.log('[BOOKING_WIZARD] Dates:', data.check_in_date, 'to', data.check_out_date);

      const availability = await checkAvailability(room.room_id, {
        check_in: data.check_in_date,
        check_out: data.check_out_date,
        // No exclude_booking_id since this is a new booking
      });

      console.log('[BOOKING_WIZARD] Availability result for', room.room_name, ':', availability.is_available);

      if (!availability.is_available) {
        console.error('[BOOKING_WIZARD] ❌ Room NOT available:', room.room_name);
        console.error('[BOOKING_WIZARD] Conflicting bookings:', availability.conflicting_bookings);

        // Build detailed error message
        let errorMessage = `Room "${room.room_name}" is not available for the selected dates.`;

        if (availability.conflicting_bookings && availability.conflicting_bookings.length > 0) {
          errorMessage += ` There are ${availability.conflicting_bookings.length} conflicting booking(s).`;
        }

        throw new AppError('CONFLICT', errorMessage);
      }

      console.log('[BOOKING_WIZARD] ✅ Room available:', room.room_name, '- Available units:', availability.available_units);
    }
    console.log('[BOOKING_WIZARD] ✅ All rooms available - proceeding with booking creation');

    // Calculate pricing breakdown
    const room_total = data.rooms.reduce((sum, room) => sum + (room.unit_price * total_nights), 0);
    const addons_total = data.addons.reduce((sum, addon) => sum + addon.total_price, 0);
    const subtotal = room_total + addons_total;

    // Calculate guest counts
    const adults = data.rooms.reduce((sum, room) => sum + room.adults, 0);
    const children = data.rooms.reduce((sum, room) => sum + room.children, 0);
    const children_ages = data.rooms.flatMap((room) => room.children_ages || []);

    // Get or create guest user account (works for ALL payment methods)
    const guestFullName = `${data.guest.firstName} ${data.guest.lastName}`;
    const { userId: guestId, isNewUser } = await getOrCreateGuestUser(
      data.guest.email,
      guestFullName,
      data.guest.phone,
      booking_reference
    );

    console.log('[BOOKING_WIZARD] Guest user prepared:', {
      guestId,
      isNewUser: isNewUser ? 'NEW (password email sent)' : 'EXISTING (booking email sent)',
    });

    // Create pending booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_reference,
        property_id: data.property_id,
        guest_id: guestId, // Link booking to guest user
        guest_name: guestFullName,
        guest_email: data.guest.email,
        guest_phone: data.guest.phone,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        total_nights,
        adults,
        children,
        children_ages,
        room_total,
        addons_total,
        subtotal,
        total_amount: data.total_amount,
        currency: data.currency,
        booking_status: 'pending',
        payment_status: 'pending',
        source: 'vilo',
        special_requests: data.guest.specialRequests || null,
        company_payment_integration_id: companyPaymentIntegrationId,
      })
      .select()
      .single();

    if (error) throw error;

    // Get room details for booking_rooms
    const roomIds = data.rooms.map((r) => r.room_id);
    const { data: roomDetails } = await supabase
      .from('rooms')
      .select('id, name, room_code')
      .in('id', roomIds);

    // Insert booking rooms
    const roomInserts = data.rooms.map((room) => {
      const roomDetail = roomDetails?.find((r) => r.id === room.room_id);
      return {
        booking_id: booking.id,
        room_id: room.room_id,
        room_name: roomDetail?.name || room.room_name,
        room_code: roomDetail?.room_code || '',
        adults: room.adults,
        children: room.children,
        children_ages: room.children_ages || [],
        pricing_mode: 'per_unit',
        nightly_rates: [],
        room_subtotal: room.unit_price * total_nights,
        currency: data.currency,
      };
    });

    await supabase.from('booking_rooms').insert(roomInserts);

    // Insert booking add-ons (if any)
    if (data.addons.length > 0) {
      // Get addon details
      const addonIds = data.addons.map((a) => a.addon_id);
      const { data: addonDetails } = await supabase
        .from('add_ons')
        .select('id, name, pricing_type')
        .in('id', addonIds);

      const addonInserts = data.addons.map((addon) => {
        const addonDetail = addonDetails?.find((a) => a.id === addon.addon_id);
        return {
          booking_id: booking.id,
          addon_id: addon.addon_id,
          addon_name: addonDetail?.name || addon.addon_name,
          pricing_type: addonDetail?.pricing_type || addon.pricing_type,
          quantity: addon.quantity,
          unit_price: addon.unit_price,
          addon_total: addon.total_price,
          currency: data.currency,
        };
      });

      await supabase.from('booking_addons').insert(addonInserts);
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      booking_status: 'pending',
      is_new_user: isNewUser, // Flag to indicate if guest account was newly created
      guest_email: data.guest.email, // For frontend to use in confirmation step
    };
  }

  /**
   * Confirm booking after successful payment
   */
  async confirmBooking(data: {
    booking_id: string;
    user_id: string;
    payment_reference: string;
  }): Promise<{
    booking_id: string;
    booking_reference: string;
    booking_status: 'confirmed';
  }> {
    // Get current booking to fetch total_amount and currency
    const { data: currentBooking } = await supabase
      .from('bookings')
      .select('total_amount, currency')
      .eq('id', data.booking_id)
      .single();

    // Update booking with guest_id and confirm status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        guest_id: data.user_id,
        booking_status: 'confirmed',
        payment_status: 'paid',
      })
      .eq('id', data.booking_id)
      .select('id, booking_reference')
      .single();

    if (error) throw error;

    // Create payment record
    await supabase.from('booking_payments').insert({
      booking_id: data.booking_id,
      payment_reference: data.payment_reference,
      payment_method: 'online',
      payment_status: 'completed',
      amount: currentBooking?.total_amount || 0,
      currency: currentBooking?.currency || 'ZAR',
      paid_at: new Date().toISOString(),
    });

    // Fetch full booking details with all relationships
    try {
      const fullBooking = await getBookingById(data.booking_id, data.user_id);

      // Send confirmation email to guest
      await sendBookingConfirmationEmail(fullBooking);
    } catch (notifError) {
      // Log error but don't fail the booking confirmation
      console.error('Failed to send booking confirmation email:', notifError);
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      booking_status: 'confirmed',
    };
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(data: {
    booking_id: string;
    property_id: string;
    guest_email: string;
    amount: number;
    currency: string;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    // Get property details to find company
    const { data: property } = await supabase
      .from('properties')
      .select('company_id')
      .eq('id', data.property_id)
      .single();

    if (!property) {
      throw new AppError('NOT_FOUND', 'Property not found');
    }

    // Get company's primary payment integration
    const primaryIntegration = await companyPaymentService.getPrimaryCompanyIntegration(
      property.company_id
    );

    if (!primaryIntegration || primaryIntegration.provider !== 'paystack') {
      throw new AppError(
        'BAD_REQUEST',
        'Paystack payment is not configured for this property. Please contact the property owner.'
      );
    }

    const config = primaryIntegration.credentials as any;

    if (!config?.secret_key) {
      throw new AppError('INTERNAL_ERROR', 'Paystack is not properly configured');
    }

    // Generate reference
    const reference = `VLO-${data.booking_id.substring(0, 8)}-${Date.now()}`;

    // Call Paystack API to initialize transaction
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.guest_email,
          amount: data.amount * 100, // Paystack expects amount in cents
          currency: data.currency,
          reference,
          callback_url: `${process.env.FRONTEND_URL}/booking-wizard/payment-callback`,
          metadata: {
            booking_id: data.booking_id,
            property_id: data.property_id,
          },
        }),
      });

      const result = await response.json();

      if (!result.status || !result.data?.authorization_url) {
        throw new AppError('INTERNAL_ERROR', result.message || 'Failed to initialize payment');
      }

      return {
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      };
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to initialize payment gateway');
    }
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(data: {
    reference: string;
    booking_id: string;
    property_id: string;
  }): Promise<{
    is_valid: boolean;
    amount: number;
    currency: string;
    status: string;
  }> {
    // Get property details to find company
    const { data: property } = await supabase
      .from('properties')
      .select('company_id')
      .eq('id', data.property_id)
      .single();

    if (!property) {
      throw new AppError('NOT_FOUND', 'Property not found');
    }

    // Get company's primary payment integration
    const primaryIntegration = await companyPaymentService.getPrimaryCompanyIntegration(
      property.company_id
    );

    if (!primaryIntegration || primaryIntegration.provider !== 'paystack') {
      throw new AppError('BAD_REQUEST', 'Paystack payment is not configured');
    }

    const config = primaryIntegration.credentials as any;

    if (!config?.secret_key) {
      throw new AppError('INTERNAL_ERROR', 'Paystack is not properly configured');
    }

    // Verify payment with Paystack
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.secret_key}`,
          },
        }
      );

      const result = await response.json();

      if (!result.status || !result.data) {
        throw new AppError('INTERNAL_ERROR', 'Payment verification failed');
      }

      const paymentData = result.data;

      return {
        is_valid: paymentData.status === 'success',
        amount: paymentData.amount / 100, // Convert from cents
        currency: paymentData.currency,
        status: paymentData.status,
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to verify payment');
    }
  }

  /**
   * Get available payment methods for a property
   */
  async getAvailablePaymentMethods(propertyId: string): Promise<{
    provider: PaymentProvider;
    label: string;
    is_primary?: boolean;
    is_enabled: boolean;
  }[]> {
    console.log('=== [BOOKING_WIZARD_SERVICE] getAvailablePaymentMethods called ===');
    console.log('[BOOKING_WIZARD_SERVICE] Property ID:', propertyId);

    // Get property's company
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('company_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('[BOOKING_WIZARD_SERVICE] Property not found:', propertyError);
      throw new AppError('NOT_FOUND', 'Property not found');
    }

    console.log('[BOOKING_WIZARD_SERVICE] Company ID:', property.company_id);

    // Get company's payment integrations and Book via Chat setting
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('enable_book_via_chat')
      .eq('id', property.company_id)
      .single();

    console.log('[BOOKING_WIZARD_SERVICE] Company settings:', company);

    // Get enabled payment integrations
    const { data: integrations } = await supabase
      .from('company_payment_integrations')
      .select('provider, is_enabled, is_primary')
      .eq('company_id', property.company_id)
      .eq('is_enabled', true);

    console.log('[BOOKING_WIZARD_SERVICE] Payment integrations:', integrations);

    const methods: {
      provider: PaymentProvider;
      label: string;
      is_primary?: boolean;
      is_enabled: boolean;
    }[] = [];

    // Add Book via Chat if enabled
    if (company?.enable_book_via_chat) {
      console.log('[BOOKING_WIZARD_SERVICE] Adding Book via Chat option');
      methods.push({
        provider: 'book_via_chat',
        label: 'Book via Chat',
        is_enabled: true,
      });
    }

    // Add enabled payment integrations
    if (integrations && integrations.length > 0) {
      integrations.forEach((integration) => {
        const label =
          integration.provider === 'paystack'
            ? 'Paystack'
            : integration.provider === 'paypal'
            ? 'PayPal'
            : integration.provider === 'eft'
            ? 'EFT'
            : integration.provider;

        methods.push({
          provider: integration.provider as PaymentProvider,
          label,
          is_primary: integration.is_primary,
          is_enabled: integration.is_enabled,
        });
      });
    }

    console.log('[BOOKING_WIZARD_SERVICE] Available methods:', methods);

    // If no methods at all, return empty array
    // Frontend will show "No payment methods available"
    return methods;
  }

  /**
   * Create booking via chat flow
   */
  async createBookingViaChat(data: BookingWizardData): Promise<ChatBookingResponse> {
    console.log('=== [BOOKING_WIZARD_SERVICE] createBookingViaChat called ===');
    console.log('[BOOKING_WIZARD_SERVICE] Data:', JSON.stringify(data, null, 2));

    // Create booking with pending status using existing initiateBooking method
    const booking = await this.initiateBooking(data);
    console.log('[BOOKING_WIZARD_SERVICE] Booking created:', JSON.stringify(booking, null, 2));

    // Verify booking was created in database
    const { data: createdBooking, error: bookingVerifyError } = await supabase
      .from('bookings')
      .select('id, booking_reference, booking_status, payment_status, property_id, guest_id')
      .eq('id', booking.booking_id)
      .single();

    if (bookingVerifyError || !createdBooking) {
      console.error('[BOOKING_WIZARD_SERVICE] Failed to verify booking creation:', bookingVerifyError);
    } else {
      console.log('[BOOKING_WIZARD_SERVICE] Verified booking in DB:', createdBooking);
    }

    // Get property owner and guest user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('company_id, companies!inner(user_id)')
      .eq('id', data.property_id)
      .single();

    if (propertyError || !property) {
      console.error('[BOOKING_WIZARD_SERVICE] Failed to fetch property:', propertyError);
      throw new AppError('NOT_FOUND', 'Property not found');
    }

    console.log('[BOOKING_WIZARD_SERVICE] Property data:', JSON.stringify(property, null, 2));

    // @ts-ignore - Supabase types are complex
    const propertyOwnerId = property.companies.user_id;
    console.log('[BOOKING_WIZARD_SERVICE] Property owner ID:', propertyOwnerId);

    // Verify property owner exists
    const { data: ownerUser, error: ownerError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', propertyOwnerId)
      .single();

    if (ownerError || !ownerUser) {
      console.error('[BOOKING_WIZARD_SERVICE] Property owner not found:', ownerError);
      throw new AppError('NOT_FOUND', 'Property owner not found');
    }

    console.log('[BOOKING_WIZARD_SERVICE] Property owner details:', ownerUser);

    // Get or create guest user account (if they don't have one)
    let guestUserId: string | null = null;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.guest.email)
      .single();

    if (existingUser) {
      guestUserId = existingUser.id;
      console.log('[BOOKING_WIZARD_SERVICE] Existing guest user ID:', guestUserId);
    } else {
      // Auto-create guest account for book via chat
      console.log('[BOOKING_WIZARD_SERVICE] Creating new guest account for book via chat...');
      const guestResult = await getOrCreateGuestUser(
        data.guest.email,
        `${data.guest.firstName} ${data.guest.lastName}`,
        data.guest.phone || '',
        booking.booking_reference
      );
      guestUserId = guestResult.userId;
      console.log('[BOOKING_WIZARD_SERVICE] New guest user created:', guestUserId);
    }

    // Find or create conversation using the helper function
    const { data: existingConversation } = await supabase.rpc('find_conversation', {
      p_user1_id: guestUserId,
      p_user2_id: propertyOwnerId,
      p_property_id: data.property_id,
      p_type: 'guest_inquiry',
    });

    let conversationId: string;

    if (existingConversation && existingConversation.length > 0) {
      conversationId = existingConversation[0].id;
      console.log('[BOOKING_WIZARD_SERVICE] Found existing conversation:', conversationId);

      // Update is_archived to false in case it was archived
      await supabase
        .from('chat_conversations')
        .update({ is_archived: false })
        .eq('id', conversationId);
      console.log('[BOOKING_WIZARD_SERVICE] Updated conversation to not archived');
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          type: 'guest_inquiry',
          property_id: data.property_id,
          created_by: guestUserId, // Guest is creating the conversation
          is_archived: false,
        })
        .select()
        .single();

      if (convError || !newConversation) {
        console.error('[BOOKING_WIZARD_SERVICE] Failed to create conversation:', convError);
        throw new AppError('INTERNAL_ERROR', 'Failed to create conversation');
      }

      conversationId = newConversation.id;
      console.log('[BOOKING_WIZARD_SERVICE] Created new conversation:', conversationId);

      // Add participants
      const participantsToInsert = [
        {
          conversation_id: conversationId,
          user_id: guestUserId,
          role: 'guest',
        },
        {
          conversation_id: conversationId,
          user_id: propertyOwnerId,
          role: 'owner', // Valid roles: 'owner', 'admin', 'member', 'guest'
        },
      ];
      console.log('[BOOKING_WIZARD_SERVICE] Inserting participants:', participantsToInsert);

      const { data: insertedParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsToInsert)
        .select();

      if (participantsError) {
        console.error('[BOOKING_WIZARD_SERVICE] Failed to add participants:', participantsError);
        throw new AppError('INTERNAL_ERROR', 'Failed to add conversation participants');
      }

      console.log('[BOOKING_WIZARD_SERVICE] Added participants to conversation:', insertedParticipants);
    }

    // Generate formatted system message
    const messageContent = this.generateBookingSystemMessage(data, booking.booking_reference);

    // Insert system message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: guestUserId, // Guest initiated this booking
        message_type: 'system',
        content: messageContent,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('[BOOKING_WIZARD_SERVICE] Failed to create message:', messageError);
      throw new AppError('INTERNAL_ERROR', 'Failed to send booking message');
    }

    console.log('[BOOKING_WIZARD_SERVICE] System message created:', message.id);

    // Update conversation's last_message_at timestamp so it appears at the top
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: message.created_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    console.log('[BOOKING_WIZARD_SERVICE] Updated conversation last_message_at timestamp');

    // Return response with chat URL
    const chatUrl = `/chat?conversation=${conversationId}`;

    return {
      booking_id: booking.booking_id,
      booking_reference: booking.booking_reference,
      conversation_id: conversationId,
      message_id: message.id,
      chat_url: chatUrl,
      is_new_user: booking.is_new_user, // Include is_new_user flag
    };
  }

  /**
   * Generate beautifully formatted booking system message
   */
  private generateBookingSystemMessage(data: BookingWizardData, reference: string): string {
    console.log('[BOOKING_WIZARD_SERVICE] Generating booking system message');

    // Format dates
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    // Calculate nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate total guests
    const adults = data.rooms.reduce((sum, room) => sum + room.adults, 0);
    const children = data.rooms.reduce((sum, room) => sum + room.children, 0);

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: data.currency || 'ZAR',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Build message with better formatting
    let message = `🎉 **New Booking Request**\n\n`;
    message += `📋 **Reference:** \`${reference}\`\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Guest details
    message += `👤 **Guest Information**\n`;
    message += `• Name: ${data.guest.firstName} ${data.guest.lastName}\n`;
    message += `• Email: ${data.guest.email}\n`;
    if (data.guest.phone) {
      message += `• Phone: ${data.guest.phone}\n`;
    }
    message += `\n`;

    // Booking details
    message += `📅 **Stay Details**\n`;
    message += `• Check-in: ${formatDate(checkIn)}\n`;
    message += `• Check-out: ${formatDate(checkOut)}\n`;
    message += `• Duration: ${nights} night${nights !== 1 ? 's' : ''}\n`;
    message += `• Guests: ${adults + children} total (${adults} adult${adults !== 1 ? 's' : ''}, ${children} child${children !== 1 ? 'ren' : ''})\n\n`;

    // Room details
    message += `🏠 **Accommodation**\n`;
    data.rooms.forEach((room, index) => {
      message += `\n**Room ${index + 1}:** ${room.room_name}\n`;
      message += `  • ${room.adults} adult${room.adults !== 1 ? 's' : ''}`;
      if (room.children > 0) {
        message += `, ${room.children} child${room.children !== 1 ? 'ren' : ''}`;
      }
      message += `\n`;
      message += `  • ${formatCurrency(room.total_price)}\n`;
    });
    message += `\n`;

    // Add-ons (if any)
    if (data.addons && data.addons.length > 0) {
      message += `➕ **Add-ons**\n`;
      data.addons.forEach((addon) => {
        message += `• ${addon.addon_name} (×${addon.quantity}): ${formatCurrency(addon.total_price)}\n`;
      });
      message += `\n`;
    }

    // Special requests
    if (data.guest.specialRequests) {
      message += `📝 **Special Requests**\n`;
      message += `${data.guest.specialRequests}\n\n`;
    }

    // Payment summary
    const roomTotal = data.rooms.reduce((sum, room) => sum + room.total_price, 0);
    const addonsTotal = data.addons.reduce((sum, addon) => sum + addon.total_price, 0);

    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💰 **Payment Summary**\n`;
    message += `• Accommodation: ${formatCurrency(roomTotal)}\n`;
    if (addonsTotal > 0) {
      message += `• Add-ons: ${formatCurrency(addonsTotal)}\n`;
    }
    message += `\n**Total Amount: ${formatCurrency(data.total_amount)}**\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `⏳ **Status:** Pending Payment Confirmation\n\n`;
    message += `💬 Please use this chat to discuss payment details and confirm the booking.`;

    return message;
  }
}

export const bookingWizardService = new BookingWizardService();
