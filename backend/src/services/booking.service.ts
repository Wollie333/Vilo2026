import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { createAuditLog } from './audit.service';
import { getProperty } from './property.service';
import { findOrCreateCustomer } from './customer.service';
import { getRoomById, calculatePrice, checkAvailability, listPropertyAddOns } from './room.service';
import {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  notifyHostNewBooking,
  notifyHostBookingCancellation,
  notifyPaymentReceived,
} from './booking-notifications.service';
import * as whatsappAutomation from './whatsapp-automation.service';
import { sendNotification } from './notifications.service';
import { generateBookingInvoice } from './invoice.service';
import { generatePaymentSchedule, getBookingPaymentSchedule, updateMilestoneStatus } from './payment-schedule.service';
import { generatePaymentReceipt } from './payment-receipt.service';
import {
  Booking,
  BookingWithDetails,
  CreateBookingRequest,
  UpdateBookingRequest,
  UpdateBookingStatusRequest,
  UpdatePaymentStatusRequest,
  CancelBookingRequest,
  BookingListParams,
  BookingListResponse,
  BookingRoom,
  BookingAddon,
  BookingGuest,
  BookingPayment,
  CreateBookingPaymentRequest,
  UploadPaymentProofRequest,
  VerifyEFTPaymentRequest,
  PaymentProofResponse,
  RefundRequest,
  CreateRefundRequestRequest,
  ReviewRefundRequest,
  ConflictCheckRequest,
  ConflictCheckResponse,
  BookingStats,
  BookingCalendarEntry,
  ValidateCouponRequest,
  ValidateCouponResponse,
  CheckoutPricingResponse,
  BookingStatus,
  PaymentStatus,
  TimelineEvent,
  BookingLockStatus,
} from '../types/booking.types';
import { NightlyRate } from '../types/room.types';

// ============================================================================
// BOOKING CRUD OPERATIONS
// ============================================================================

/**
 * List bookings with filters
 * Supports filtering by booking type: 'received' (at my properties), 'made' (by me as guest), or 'all'
 */
export const listBookings = async (
  userId: string,
  params?: BookingListParams
): Promise<BookingListResponse> => {
  const supabase = getAdminClient();

  console.log('=== [BOOKING_SERVICE] listBookings called ===');
  console.log('[BOOKING_SERVICE] User ID:', userId);
  console.log('[BOOKING_SERVICE] Params:', JSON.stringify(params, null, 2));

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;
  const bookingType = params?.bookingType || 'received'; // Default to received bookings

  console.log('[BOOKING_SERVICE] Booking type:', bookingType);
  console.log('[BOOKING_SERVICE] Pagination: page', page, 'limit', limit, 'offset', offset);

  // Build base query with properties join
  let query = supabase
    .from('bookings')
    .select(`
      *,
      properties!inner (
        id,
        name,
        slug,
        owner_id
      )
    `, { count: 'exact' });

  // Apply booking type filter
  if (bookingType === 'received') {
    // Bookings at properties I own
    console.log('[BOOKING_SERVICE] Filtering for received bookings (properties.owner_id =', userId, ')');
    query = query.eq('properties.owner_id', userId);
  } else if (bookingType === 'made') {
    // Bookings I made as a guest at OTHER properties (not my own)
    // Must be bookings where I'm the guest AND property is NOT owned by me
    console.log('[BOOKING_SERVICE] Filtering for made bookings (guest_id =', userId, 'AND properties.owner_id !=', userId, ')');
    query = query.eq('guest_id', userId).neq('properties.owner_id', userId);
  } else if (bookingType === 'all') {
    // Both types: bookings at my properties OR bookings I made
    console.log('[BOOKING_SERVICE] Filtering for all bookings (properties.owner_id =', userId, 'OR guest_id =', userId, ')');
    query = query.or(`properties.owner_id.eq.${userId},guest_id.eq.${userId}`);
  }

  // Filters
  if (params?.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  if (params?.guest_id) {
    query = query.eq('guest_id', params.guest_id);
  }

  if (params?.guest_email) {
    query = query.ilike('guest_email', `%${params.guest_email}%`);
  }

  if (params?.booking_status) {
    if (Array.isArray(params.booking_status)) {
      query = query.in('booking_status', params.booking_status);
    } else {
      query = query.eq('booking_status', params.booking_status);
    }
  }

  if (params?.payment_status) {
    if (Array.isArray(params.payment_status)) {
      query = query.in('payment_status', params.payment_status);
    } else {
      query = query.eq('payment_status', params.payment_status);
    }
  }

  if (params?.source) {
    if (Array.isArray(params.source)) {
      query = query.in('source', params.source);
    } else {
      query = query.eq('source', params.source);
    }
  }

  if (params?.check_in_from) {
    query = query.gte('check_in_date', params.check_in_from);
  }

  if (params?.check_in_to) {
    query = query.lte('check_in_date', params.check_in_to);
  }

  if (params?.check_out_from) {
    query = query.gte('check_out_date', params.check_out_from);
  }

  if (params?.check_out_to) {
    query = query.lte('check_out_date', params.check_out_to);
  }

  if (params?.created_from) {
    query = query.gte('created_at', params.created_from);
  }

  if (params?.created_to) {
    query = query.lte('created_at', params.created_to);
  }

  if (params?.search) {
    query = query.or(`guest_name.ilike.%${params.search}%,guest_email.ilike.%${params.search}%,booking_reference.ilike.%${params.search}%`);
  }

  // Sorting
  const sortBy = params?.sortBy || 'created_at';
  const sortOrder = params?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  console.log('[BOOKING_SERVICE] Query executed');
  console.log('[BOOKING_SERVICE] Error:', error);
  console.log('[BOOKING_SERVICE] Count:', count);
  console.log('[BOOKING_SERVICE] Data length:', data?.length || 0);

  if (data && data.length > 0) {
    console.log('[BOOKING_SERVICE] First booking:', JSON.stringify(data[0], null, 2));
    console.log('[BOOKING_SERVICE] Booking IDs:', data.map((b: any) => b.id));
    console.log('[BOOKING_SERVICE] Booking references:', data.map((b: any) => b.booking_reference));
    console.log('[BOOKING_SERVICE] Property owner_ids:', data.map((b: any) => b.properties?.owner_id));
  } else {
    console.log('[BOOKING_SERVICE] NO BOOKINGS FOUND - this is the problem!');
  }

  if (error) {
    console.error('[BOOKING_SERVICE] Supabase error fetching bookings:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch bookings: ${error.message}`);
  }

  const total = count || 0;

  // Fetch related data for each booking
  const bookingIds = (data || []).map((b: any) => b.id);

  // Fetch rooms, addons, guests, payments in parallel
  const [roomsResult, addonsResult, guestsResult, paymentsResult, historyResult] = await Promise.all([
    supabase.from('booking_rooms').select(`
      *,
      rooms!inner (
        featured_image
      )
    `).in('booking_id', bookingIds),
    supabase.from('booking_addons').select(`
      *,
      add_ons!inner (
        image_url
      )
    `).in('booking_id', bookingIds),
    supabase.from('booking_guests').select('*').in('booking_id', bookingIds),
    supabase.from('booking_payments').select('*').in('booking_id', bookingIds),
    supabase.from('booking_status_history').select('*').in('booking_id', bookingIds).order('created_at', { ascending: false }),
  ]);

  // Map to BookingWithDetails format
  const bookings: BookingWithDetails[] = (data || []).map((booking: any) => ({
    ...booking,
    rooms: (roomsResult.data || [])
      .filter((r: any) => r.booking_id === booking.id)
      .map((r: any) => ({
        ...r,
        featured_image: r.rooms?.featured_image || null,
        rooms: undefined, // Remove nested object
      })),
    addons: (addonsResult.data || [])
      .filter((a: any) => a.booking_id === booking.id)
      .map((a: any) => ({
        ...a,
        image_url: a.add_ons?.image_url || null,
        add_ons: undefined, // Remove nested object
      })),
    guests: (guestsResult.data || []).filter((g: any) => g.booking_id === booking.id),
    payments: (paymentsResult.data || []).filter((p: any) => p.booking_id === booking.id),
    status_history: (historyResult.data || []).filter((h: any) => h.booking_id === booking.id),
    // Rename properties to property (singular) for frontend consistency
    property: booking.properties,
    property_name: booking.properties?.name,
    property_slug: booking.properties?.slug,
    properties: undefined,
  }));

  return {
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get all bookings for a specific user (as guest + as property owner)
 * Used by super admin to view all user's bookings
 */
export const getBookingsByUser = async (
  userId: string,
  params?: BookingListParams
): Promise<BookingListResponse> => {
  const supabase = getAdminClient();

  console.log('=== [BOOKING_SERVICE] getBookingsByUser called ===');
  console.log('[BOOKING_SERVICE] User ID:', userId);
  console.log('[BOOKING_SERVICE] Params:', JSON.stringify(params, null, 2));

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // First, get all property IDs owned by this user
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name, owner_id')
    .eq('owner_id', userId);

  if (propertiesError) {
    console.error('[BOOKING_SERVICE] Error fetching properties:', propertiesError);
  }

  const propertyIds = properties?.map((p) => p.id) || [];
  console.log('[BOOKING_SERVICE] User owns', propertyIds.length, 'properties:', propertyIds);
  if (properties && properties.length > 0) {
    console.log('[BOOKING_SERVICE] Property names:', properties.map(p => p.name));
  }

  // Build query to fetch bookings where:
  // 1. User is the guest (guest_id = userId)
  // 2. OR booking is for a property owned by user (property_id in propertyIds)
  let query = supabase
    .from('bookings')
    .select(`
      *,
      properties!inner (
        id,
        name,
        slug,
        owner_id
      )
    `, { count: 'exact' });

  // Apply OR filter: guest OR property owner
  if (propertyIds.length > 0) {
    const orFilter = `guest_id.eq.${userId},property_id.in.(${propertyIds.join(',')})`;
    console.log('[BOOKING_SERVICE] Applying OR filter:', orFilter);
    query = query.or(orFilter);
  } else {
    // If user has no properties, only show bookings where they are the guest
    console.log('[BOOKING_SERVICE] No properties - filtering by guest_id only');
    query = query.eq('guest_id', userId);
  }

  // Apply additional filters
  if (params?.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  if (params?.booking_status) {
    if (Array.isArray(params.booking_status)) {
      query = query.in('booking_status', params.booking_status);
    } else {
      query = query.eq('booking_status', params.booking_status);
    }
  }

  if (params?.payment_status) {
    if (Array.isArray(params.payment_status)) {
      query = query.in('payment_status', params.payment_status);
    } else {
      query = query.eq('payment_status', params.payment_status);
    }
  }

  if (params?.source) {
    if (Array.isArray(params.source)) {
      query = query.in('source', params.source);
    } else {
      query = query.eq('source', params.source);
    }
  }

  if (params?.check_in_from) {
    query = query.gte('check_in_date', params.check_in_from);
  }

  if (params?.check_in_to) {
    query = query.lte('check_in_date', params.check_in_to);
  }

  if (params?.check_out_from) {
    query = query.gte('check_out_date', params.check_out_from);
  }

  if (params?.check_out_to) {
    query = query.lte('check_out_date', params.check_out_to);
  }

  if (params?.created_from) {
    query = query.gte('created_at', params.created_from);
  }

  if (params?.created_to) {
    query = query.lte('created_at', params.created_to);
  }

  if (params?.search) {
    query = query.or(`guest_name.ilike.%${params.search}%,guest_email.ilike.%${params.search}%,booking_reference.ilike.%${params.search}%`);
  }

  // Sorting
  const sortBy = params?.sortBy || 'created_at';
  const sortOrder = params?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  console.log('[BOOKING_SERVICE] Query executed');
  console.log('[BOOKING_SERVICE] Error:', error);
  console.log('[BOOKING_SERVICE] Count:', count);
  console.log('[BOOKING_SERVICE] Bookings found:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('[BOOKING_SERVICE] Booking IDs:', data.map((b: any) => b.id));
    console.log('[BOOKING_SERVICE] Booking references:', data.map((b: any) => b.booking_reference));
  }

  if (error) {
    console.error('[BOOKING_SERVICE] Supabase error fetching user bookings:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch user bookings: ${error.message}`);
  }

  const total = count || 0;

  // Fetch related data for each booking
  const bookingIds = (data || []).map((b: any) => b.id);

  if (bookingIds.length === 0) {
    console.log('[BOOKING_SERVICE] No bookings found for user');
    return {
      bookings: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  // Fetch rooms, addons, guests, payments in parallel
  const [roomsResult, addonsResult, guestsResult, paymentsResult, historyResult] = await Promise.all([
    supabase.from('booking_rooms').select(`
      *,
      rooms!inner (
        featured_image
      )
    `).in('booking_id', bookingIds),
    supabase.from('booking_addons').select(`
      *,
      add_ons!inner (
        image_url
      )
    `).in('booking_id', bookingIds),
    supabase.from('booking_guests').select('*').in('booking_id', bookingIds),
    supabase.from('booking_payments').select('*').in('booking_id', bookingIds),
    supabase.from('booking_status_history').select('*').in('booking_id', bookingIds).order('created_at', { ascending: false }),
  ]);

  // Map to BookingWithDetails format
  const bookings: BookingWithDetails[] = (data || []).map((booking: any) => ({
    ...booking,
    rooms: (roomsResult.data || [])
      .filter((r: any) => r.booking_id === booking.id)
      .map((r: any) => ({
        ...r,
        featured_image: r.rooms?.featured_image || null,
        rooms: undefined, // Remove nested object
      })),
    addons: (addonsResult.data || [])
      .filter((a: any) => a.booking_id === booking.id)
      .map((a: any) => ({
        ...a,
        image_url: a.add_ons?.image_url || null,
        add_ons: undefined, // Remove nested object
      })),
    guests: (guestsResult.data || []).filter((g: any) => g.booking_id === booking.id),
    payments: (paymentsResult.data || []).filter((p: any) => p.booking_id === booking.id),
    status_history: (historyResult.data || []).filter((h: any) => h.booking_id === booking.id),
    // Rename properties to property (singular) for frontend consistency
    property: booking.properties,
    property_name: booking.properties?.name,
    property_slug: booking.properties?.slug,
    properties: undefined,
  }));

  return {
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (
  id: string,
  userId?: string,
  isSuperAdmin: boolean = false
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Fetch booking WITHOUT access filters first
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      properties!inner (
        id,
        name,
        slug,
        owner_id
      )
    `)
    .eq('id', id)
    .single();

  // If booking doesn't exist, return 404
  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Check authorization if userId is provided (skip for super admins)
  if (userId && !isSuperAdmin) {
    const propertyOwnerId = data.properties?.owner_id;
    const guestId = data.guest_id;

    // User can access if they are:
    // 1. The property owner
    // 2. The guest who made the booking
    const isPropertyOwner = propertyOwnerId === userId;
    const isGuest = guestId === userId;

    if (!isPropertyOwner && !isGuest) {
      console.log('[BOOKING_SERVICE] Access denied for booking:', {
        booking_id: id,
        user_id: userId,
        property_owner_id: propertyOwnerId,
        guest_id: guestId
      });
      throw new AppError('FORBIDDEN', 'You do not have permission to view this booking');
    }

    console.log('[BOOKING_SERVICE] Access granted for booking:', {
      booking_id: id,
      user_id: userId,
      is_property_owner: isPropertyOwner,
      is_guest: isGuest
    });
  } else if (isSuperAdmin) {
    console.log('[BOOKING_SERVICE] Super admin access granted for booking:', {
      booking_id: id,
      user_id: userId
    });
  }

  // Fetch related data with images from rooms and add_ons tables
  const [roomsResult, addonsResult, guestsResult, paymentsResult, historyResult, refundsResult] = await Promise.all([
    supabase.from('booking_rooms').select(`
      *,
      rooms!inner (
        featured_image
      )
    `).eq('booking_id', id),
    supabase.from('booking_addons').select(`
      *,
      add_ons!inner (
        image_url
      )
    `).eq('booking_id', id),
    supabase.from('booking_guests').select('*').eq('booking_id', id),
    supabase.from('booking_payments').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
    supabase.from('booking_status_history').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
    supabase.from('refund_requests').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
  ]);

  // Map rooms and addons to include image URLs at top level
  const rooms = (roomsResult.data || []).map((room: any) => ({
    ...room,
    featured_image: room.rooms?.featured_image || null,
    rooms: undefined, // Remove nested object
  }));

  const addons = (addonsResult.data || []).map((addon: any) => ({
    ...addon,
    image_url: addon.add_ons?.image_url || null,
    add_ons: undefined, // Remove nested object
  }));

  return {
    ...data,
    rooms,
    addons,
    guests: guestsResult.data || [],
    payments: paymentsResult.data || [],
    status_history: historyResult.data || [],
    refund_requests: refundsResult.data || [],
    property_name: data.properties?.name,
    property_slug: data.properties?.slug,
    properties: undefined,
  };
};

/**
 * Get booking by reference (public)
 */
export const getBookingByReference = async (
  reference: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (
        id,
        name,
        slug
      )
    `)
    .eq('booking_reference', reference)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Fetch related data (limited for public view)
  const [roomsResult, addonsResult] = await Promise.all([
    supabase.from('booking_rooms').select('*').eq('booking_id', data.id),
    supabase.from('booking_addons').select('*').eq('booking_id', data.id),
  ]);

  return {
    ...data,
    rooms: roomsResult.data || [],
    addons: addonsResult.data || [],
    guests: [],
    payments: [],
    status_history: [],
    property_name: data.properties?.name,
    property_slug: data.properties?.slug,
    properties: undefined,
  };
};

/**
 * Create a new booking
 */
export const createBooking = async (
  userId: string | null,
  input: CreateBookingRequest
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Validate dates
  const checkIn = new Date(input.check_in_date);
  const checkOut = new Date(input.check_out_date);
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (totalNights < 1) {
    throw new AppError('VALIDATION_ERROR', 'Check-out must be after check-in');
  }

  // Validate rooms
  if (!input.rooms || input.rooms.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one room is required');
  }

  // Check availability for each room
  for (const roomRequest of input.rooms) {
    const availability = await checkAvailability(roomRequest.room_id, {
      check_in: input.check_in_date,
      check_out: input.check_out_date,
    });

    if (!availability.is_available) {
      const room = await getRoomById(roomRequest.room_id);
      throw new AppError(
        'CONFLICT',
        `Room "${room.name}" is not available for the selected dates`
      );
    }
  }

  // Fetch property and company for VAT calculation
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, company_id')
    .eq('id', input.property_id)
    .single();

  if (propertyError || !property) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  // Fetch company's VAT percentage
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('vat_percentage')
    .eq('id', property.company_id)
    .single();

  if (companyError || !company) {
    throw new AppError('NOT_FOUND', 'Company not found');
  }

  const vatPercentage = company.vat_percentage !== null && company.vat_percentage !== undefined ? company.vat_percentage : 15;

  // Calculate pricing for all rooms
  let roomTotal = 0;
  const roomsData: any[] = [];

  for (const roomRequest of input.rooms) {
    const room = await getRoomById(roomRequest.room_id);
    const pricing = await calculatePrice(roomRequest.room_id, {
      check_in: input.check_in_date,
      check_out: input.check_out_date,
      adults: roomRequest.adults,
      children: roomRequest.children,
      children_ages: roomRequest.children_ages,
    });

    roomsData.push({
      room_id: roomRequest.room_id,
      room_name: room.name,
      room_code: room.room_code,
      adults: roomRequest.adults,
      children: roomRequest.children || 0,
      children_ages: roomRequest.children_ages || [],
      pricing_mode: pricing.pricing_mode,
      nightly_rates: pricing.nightly_rates,
      room_subtotal: pricing.room_total,
      currency: pricing.currency,
      unit_number: roomRequest.unit_number || 1,
    });

    roomTotal += pricing.room_total;
  }

  // Calculate add-ons pricing
  let addonsTotal = 0;
  const addonsData: any[] = [];

  if (input.addons && input.addons.length > 0) {
    const propertyAddOns = await listPropertyAddOnsInternal(input.property_id);

    for (const addonRequest of input.addons) {
      const addon = propertyAddOns.find((a) => a.id === addonRequest.addon_id);
      if (!addon) {
        throw new AppError('VALIDATION_ERROR', `Add-on not found: ${addonRequest.addon_id}`);
      }

      const addonTotal = calculateAddonTotal(
        addon.price,
        addon.pricing_type,
        addonRequest.quantity,
        totalNights,
        input.adults + (input.children || 0)
      );

      addonsData.push({
        addon_id: addon.id,
        addon_name: addon.name,
        pricing_type: addon.pricing_type,
        unit_price: addon.price,
        quantity: addonRequest.quantity,
        addon_total: addonTotal,
        currency: addon.currency,
      });

      addonsTotal += addonTotal;
    }
  }

  // Apply coupon discount
  let discountAmount = 0;
  let couponId: string | null = null;
  let couponDiscountType: string | null = null;
  let couponDiscountValue: number | null = null;

  if (input.coupon_code) {
    const couponValidation = await validateCoupon({
      code: input.coupon_code,
      property_id: input.property_id,
      room_ids: input.rooms.map((r) => r.room_id),
      booking_amount: roomTotal + addonsTotal,
      nights: totalNights,
    });

    if (couponValidation.valid && couponValidation.promotion) {
      couponId = couponValidation.promotion.id;
      couponDiscountType = couponValidation.promotion.discount_type;
      couponDiscountValue = couponValidation.promotion.discount_value;
      discountAmount = couponValidation.promotion.calculated_discount;
    }
  }

  const subtotal = roomTotal + addonsTotal;

  // Calculate tax using company's VAT percentage
  const taxRate = vatPercentage / 100; // Convert percentage to decimal (e.g., 15 -> 0.15)
  const taxableAmount = subtotal - discountAmount; // Apply discount before tax
  const taxAmount = taxableAmount * taxRate;
  const totalAmount = Math.max(0, taxableAmount + taxAmount);

  // Create the booking
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      property_id: input.property_id,
      guest_id: input.guest_id || null,
      guest_name: input.guest_name.trim(),
      guest_email: input.guest_email.trim().toLowerCase(),
      guest_phone: input.guest_phone?.trim() || null,
      check_in_date: input.check_in_date,
      check_out_date: input.check_out_date,
      total_nights: totalNights,
      adults: input.adults,
      children: input.children || 0,
      children_ages: input.children_ages || [],
      infants: input.infants || 0,
      room_total: roomTotal,
      addons_total: addonsTotal,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: roomsData[0]?.currency || 'ZAR',
      coupon_code: input.coupon_code || null,
      coupon_id: couponId,
      coupon_discount_type: couponDiscountType,
      coupon_discount_value: couponDiscountValue,
      booking_status: input.booking_status || 'pending',
      payment_status: input.payment_status || 'pending',
      payment_method: input.payment_method || null,
      source: input.source || 'vilo',
      external_id: input.external_id || null,
      external_url: input.external_url || null,
      special_requests: input.special_requests?.trim() || null,
      internal_notes: input.internal_notes?.trim() || null,
      checkout_data: input.checkout_data || null,
      created_by: userId,
    })
    .select()
    .single();

  if (bookingError || !bookingData) {
    console.error('Failed to create booking:', bookingError);
    throw new AppError('INTERNAL_ERROR', 'Failed to create booking');
  }

  // Insert booking rooms
  const bookingRoomsToInsert = roomsData.map((room) => ({
    ...room,
    booking_id: bookingData.id,
  }));

  await supabase.from('booking_rooms').insert(bookingRoomsToInsert);

  // Insert booking addons
  if (addonsData.length > 0) {
    const bookingAddonsToInsert = addonsData.map((addon) => ({
      ...addon,
      booking_id: bookingData.id,
    }));

    await supabase.from('booking_addons').insert(bookingAddonsToInsert);
  }

  // Insert primary guest
  await supabase.from('booking_guests').insert({
    booking_id: bookingData.id,
    full_name: input.guest_name.trim(),
    email: input.guest_email.trim().toLowerCase(),
    phone: input.guest_phone?.trim() || null,
    is_primary: true,
    is_adult: true,
  });

  // Increment coupon usage
  if (couponId) {
    await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponId });
  }

  // Create audit log
  if (userId) {
    await createAuditLog({
      actor_id: userId,
      action: 'booking.created' as any,
      entity_type: 'booking' as any,
      entity_id: bookingData.id,
      new_data: { booking_reference: bookingData.booking_reference },
    });
  }

  // AUTO-CREATE GUEST PORTAL ACCOUNT (if email doesn't exist)
  try {
    const guestEmail = input.guest_email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', guestEmail)
      .single();

    if (!existingUser) {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '@1';

      // Parse guest name into first/last
      const nameParts = input.guest_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create auth.users account
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: guestEmail,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: input.guest_name.trim(),
        },
      });

      if (authError) {
        console.error('Failed to create auth user for guest:', authError);
      } else if (authUser?.user) {
        // Create users table entry
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: guestEmail,
            first_name: firstName,
            last_name: lastName,
            phone: input.guest_phone?.trim() || null,
            user_type: 'guest',
            status: 'active',
            email_verified: false,
          });

        if (userError) {
          console.error('Failed to create user record for guest:', userError);
        } else {
          // Update booking with guest_id
          await supabase
            .from('bookings')
            .update({ guest_id: authUser.user.id })
            .eq('id', bookingData.id);

          // TODO: Send welcome email with portal access instructions
          // This should be implemented in booking-notifications.service.ts
          console.log(`Guest portal account created for ${guestEmail} with booking ${bookingData.booking_reference}`);
        }
      }
    } else {
      // User exists - update booking with guest_id
      await supabase
        .from('bookings')
        .update({ guest_id: existingUser.id })
        .eq('id', bookingData.id);
    }
  } catch (error) {
    // Don't fail the booking if guest account creation fails
    console.error('Error in guest account auto-creation:', error);
  }

  // AUTO-CREATE CUSTOMER (fallback to database trigger)
  try {
    const property = await getProperty(input.property_id);

    if (property && property.company_id) {
      await findOrCreateCustomer({
        email: input.guest_email.trim().toLowerCase(),
        full_name: input.guest_name.trim(),
        phone: input.guest_phone?.trim() || undefined,
        company_id: property.company_id,
        first_property_id: input.property_id,
        source: 'booking',
        user_id: bookingData.guest_id || undefined,
      });
    }
  } catch (error) {
    // Don't fail the booking if customer creation fails (trigger should have handled it)
    console.error('Error in customer auto-creation fallback:', error);
  }

  // Generate payment schedule based on room payment rules
  try {
    // Get the first room's ID to find payment rules (assuming all rooms in booking use same property rules)
    const firstRoomId = roomsData[0]?.room_id;
    if (firstRoomId) {
      await generatePaymentSchedule({
        id: bookingData.id,
        room_id: firstRoomId,
        checkin_date: input.check_in_date,
        total_amount: totalAmount,
        currency: bookingData.currency,
        booking_date: new Date().toISOString().split('T')[0],
      });
    }
  } catch (scheduleError) {
    // Log but don't fail the booking if schedule generation fails
    console.error('Failed to generate payment schedule:', scheduleError);
  }

  // Get full booking details for notifications
  const fullBooking = await getBookingById(bookingData.id);

  // Send notifications (async, don't block response)
  const sendNotifications = async () => {
    try {
      // Get property owner info
      const ownerInfo = await getPropertyOwnerInfo(input.property_id);

      // Notify host of new booking
      if (ownerInfo.userId) {
        await notifyHostNewBooking(fullBooking, ownerInfo.userId, ownerInfo.email || undefined);
      }

      // Send confirmation email to guest if booking is confirmed
      if (fullBooking.booking_status === 'confirmed') {
        await sendBookingConfirmationEmail(fullBooking);
      }
    } catch (error) {
      console.error('Failed to send booking notifications:', error);
    }
  };

  // Fire notifications without blocking
  sendNotifications();

  // Send WhatsApp booking confirmation (async, don't block response)
  if (fullBooking.booking_status === 'confirmed') {
    whatsappAutomation.sendBookingConfirmation(fullBooking.id).catch((error) => {
      console.error('Failed to send WhatsApp booking confirmation:', error);
    });
  }

  return fullBooking;
};

/**
 * Update a booking
 */
export const updateBooking = async (
  id: string,
  userId: string,
  input: UpdateBookingRequest
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Only update provided fields
  if (input.guest_name !== undefined) updateData.guest_name = input.guest_name.trim();
  if (input.guest_email !== undefined) updateData.guest_email = input.guest_email.trim().toLowerCase();
  if (input.guest_phone !== undefined) updateData.guest_phone = input.guest_phone?.trim() || null;
  if (input.adults !== undefined) updateData.adults = input.adults;
  if (input.children !== undefined) updateData.children = input.children;
  if (input.children_ages !== undefined) updateData.children_ages = input.children_ages;
  if (input.infants !== undefined) updateData.infants = input.infants;
  if (input.source !== undefined) updateData.source = input.source;
  if (input.external_id !== undefined) updateData.external_id = input.external_id;
  if (input.external_url !== undefined) updateData.external_url = input.external_url;
  if (input.special_requests !== undefined) updateData.special_requests = input.special_requests?.trim() || null;
  if (input.internal_notes !== undefined) updateData.internal_notes = input.internal_notes?.trim() || null;
  if (input.payment_method !== undefined) updateData.payment_method = input.payment_method;
  if (input.payment_reference !== undefined) updateData.payment_reference = input.payment_reference;

  // Note: Changing dates requires recalculating prices and checking availability
  // This should be handled separately for safety

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update booking');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.updated' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  });

  return getBookingById(id, userId);
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  id: string,
  userId: string,
  input: UpdateBookingStatusRequest
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  // Validate status transition (database trigger will also enforce this)
  // This provides early validation with better error messages
  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['pending_modification', 'checked_in', 'cancelled', 'no_show'],
    'pending_modification': ['confirmed', 'cancelled'],
    'checked_in': ['checked_out', 'completed'],
    'checked_out': ['completed'],
    'completed': [], // Terminal state
    'cancelled': [], // Terminal state
    'no_show': [], // Terminal state
  };

  const allowed = allowedTransitions[current.booking_status] || [];
  if (!allowed.includes(input.status) && current.booking_status !== input.status) {
    throw new AppError(
      'INVALID_STATUS_TRANSITION',
      `Cannot change status from ${current.booking_status} to ${input.status}. ${
        allowed.length > 0
          ? `Valid transitions are: ${allowed.join(', ')}`
          : 'This status is terminal and cannot be changed'
      }`,
      {
        current_status: current.booking_status,
        requested_status: input.status,
        allowed_transitions: allowed,
      }
    );
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: input.status,
      status_changed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update booking status');
  }

  // Status history is auto-logged by trigger

  await createAuditLog({
    actor_id: userId,
    action: 'booking.status_changed' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    old_data: { status: current.booking_status },
    new_data: { status: input.status, reason: input.reason },
  });

  const updatedBooking = await getBookingById(id, userId);

  // Send confirmation email if status changed to confirmed
  if (input.status === 'confirmed' && current.booking_status !== 'confirmed') {
    sendBookingConfirmationEmail(updatedBooking).catch((err) => {
      console.error('Failed to send confirmation email:', err);
    });

    // Send WhatsApp booking confirmation
    whatsappAutomation.sendBookingConfirmation(updatedBooking.id).catch((error) => {
      console.error('Failed to send WhatsApp booking confirmation:', error);
    });
  }

  return updatedBooking;
};

/**
 * Update internal notes
 */
export const updateInternalNotes = async (
  id: string,
  userId: string,
  notes: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify booking exists and user has access
  const current = await getBookingById(id, userId);

  const { error } = await supabase
    .from('bookings')
    .update({
      internal_notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update internal notes');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.notes_updated' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    new_data: { notes_length: notes.length },
  });

  return getBookingById(id, userId);
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  id: string,
  userId: string,
  input: UpdatePaymentStatusRequest
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  // Validate payment status transition (database trigger will also enforce this)
  const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    'pending': ['verification_pending', 'partial', 'paid', 'failed_checkout', 'failed'],
    'verification_pending': ['paid', 'failed_checkout'],
    'partial': ['paid', 'refunded', 'partially_refunded'],
    'paid': ['refunded', 'partially_refunded'],
    'refunded': [], // Terminal
    'partially_refunded': ['refunded'], // Can complete refund
    'failed_checkout': ['pending', 'verification_pending', 'partial', 'paid'], // Can recover
    'failed': ['pending', 'verification_pending'], // Can retry
  };

  const allowed = allowedTransitions[current.payment_status] || [];
  if (!allowed.includes(input.status) && current.payment_status !== input.status) {
    throw new AppError(
      'INVALID_PAYMENT_TRANSITION',
      `Cannot change payment status from ${current.payment_status} to ${input.status}. ${
        allowed.length > 0
          ? `Valid transitions are: ${allowed.join(', ')}`
          : 'This status is terminal and cannot be changed'
      }`,
      {
        current_status: current.payment_status,
        requested_status: input.status,
        allowed_transitions: allowed,
      }
    );
  }

  const updateData: any = {
    payment_status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.payment_method) {
    updateData.payment_method = input.payment_method;
  }

  if (input.payment_reference) {
    updateData.payment_reference = input.payment_reference;
  }

  if (input.amount_paid !== undefined) {
    updateData.amount_paid = input.amount_paid;
  }

  if (input.status === 'paid') {
    updateData.payment_received_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update payment status');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.payment_updated' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    old_data: { payment_status: current.payment_status },
    new_data: input as unknown as Record<string, unknown>,
  });

  const updatedBooking = await getBookingById(id, userId);

  // Notify host and generate invoice if payment status changed to paid
  if (input.status === 'paid' && current.payment_status !== 'paid') {
    const ownerInfo = await getPropertyOwnerInfo(current.property_id);
    if (ownerInfo.userId) {
      const amountPaid = input.amount_paid || current.total_amount;

      // Notify host of payment
      notifyPaymentReceived(updatedBooking, amountPaid, ownerInfo.userId).catch((err) => {
        console.error('Failed to send payment notification:', err);
      });

      // Generate invoice for the booking
      generateBookingInvoice(updatedBooking, ownerInfo.userId).catch((err) => {
        console.error('Failed to generate booking invoice:', err);
      });

      // Send WhatsApp payment received notification (async, don't block response)
      whatsappAutomation.sendPaymentReceivedNotification(updatedBooking.id).catch((error) => {
        console.error('Failed to send WhatsApp payment notification:', error);
      });
    }
  }

  return updatedBooking;
};

/**
 * Check in a guest
 */
export const checkInBooking = async (
  id: string,
  userId: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  if (current.booking_status !== 'confirmed') {
    throw new AppError('VALIDATION_ERROR', 'Only confirmed bookings can be checked in');
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: 'checked_in',
      checked_in_at: new Date().toISOString(),
      checked_in_by: userId,
      status_changed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to check in');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.checked_in' as any,
    entity_type: 'booking' as any,
    entity_id: id,
  });

  return getBookingById(id, userId);
};

/**
 * Check out a guest
 */
export const checkOutBooking = async (
  id: string,
  userId: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  if (current.booking_status !== 'checked_in') {
    throw new AppError('VALIDATION_ERROR', 'Only checked-in bookings can be checked out');
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: 'checked_out',
      checked_out_at: new Date().toISOString(),
      checked_out_by: userId,
      status_changed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to check out');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.checked_out' as any,
    entity_type: 'booking' as any,
    entity_id: id,
  });

  return getBookingById(id, userId);
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  id: string,
  userId: string,
  input: CancelBookingRequest
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  if (['checked_out', 'completed', 'cancelled'].includes(current.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'This booking cannot be cancelled');
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: input.reason,
      status_changed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to cancel booking');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.cancelled' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    new_data: { reason: input.reason },
  });

  const cancelledBooking = await getBookingById(id, userId);

  // Send cancellation notifications
  const sendCancellationNotifications = async () => {
    try {
      // Send cancellation email to guest if requested
      if (input.notify_guest !== false) {
        await sendBookingCancellationEmail(cancelledBooking, input.reason);
      }

      // Notify host of cancellation (if not cancelled by host)
      const ownerInfo = await getPropertyOwnerInfo(current.property_id);
      if (ownerInfo.userId && ownerInfo.userId !== userId) {
        await notifyHostBookingCancellation(cancelledBooking, ownerInfo.userId, input.reason);
      }
    } catch (error) {
      console.error('Failed to send cancellation notifications:', error);
    }
  };

  // Fire notifications without blocking
  sendCancellationNotifications();

  // Send WhatsApp cancellation notification (async, don't block response)
  if (input.notify_guest !== false) {
    whatsappAutomation.sendBookingCancelledNotification(cancelledBooking.id).catch((error) => {
      console.error('Failed to send WhatsApp cancellation notification:', error);
    });
  }

  return cancelledBooking;
};

/**
 * Delete a booking
 */
export const deleteBooking = async (
  id: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getBookingById(id, userId);

  // Only allow deletion of pending/cancelled bookings
  if (!['pending', 'cancelled'].includes(current.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Only pending or cancelled bookings can be deleted');
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete booking');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.deleted' as any,
    entity_type: 'booking' as any,
    entity_id: id,
    old_data: { booking_reference: current.booking_reference },
  });
};

// ============================================================================
// PAYMENT LOCK VALIDATION
// ============================================================================

/**
 * Validate if booking can be edited based on payment status
 * Throws AppError if booking is locked from financial edits
 */
const validateBookingEditability = (
  booking: BookingWithDetails,
  editType: 'financial' | 'non-financial',
  operationDescription: string
): void => {
  // Check if payment has been received (partial or full)
  const isPaymentReceived = ['partial', 'paid'].includes(booking.payment_status);

  // If payment received and attempting financial edit, block it
  if (isPaymentReceived && editType === 'financial') {
    throw new AppError(
      'PAYMENT_LOCK',
      `Cannot ${operationDescription} because payment has been received. ` +
      `Booking ${booking.booking_reference} has payment status: ${booking.payment_status}. ` +
      `To make financial changes, please cancel this booking and create a new one.`,
      {
        booking_reference: booking.booking_reference,
        payment_status: booking.payment_status,
        operation: operationDescription,
        suggestion: 'cancel_and_rebook'
      }
    );
  }
};

// ============================================================================
// BOOKING DETAILS MANAGEMENT (Dates, Rooms, Add-ons)
// ============================================================================

/**
 * Update booking dates with price recalculation
 */
export const updateBookingDates = async (
  bookingId: string,
  userId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'update dates');

  // Don't allow changing dates for completed/checked-out/cancelled bookings
  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot change dates for this booking');
  }

  // Calculate new total nights
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (totalNights < 1) {
    throw new AppError('VALIDATION_ERROR', 'Check-out must be after check-in');
  }

  // Recalculate pricing for each room with new dates
  let newRoomTotal = 0;
  for (const bookingRoom of booking.rooms) {
    const roomPricing = await calculatePrice(bookingRoom.room_id, {
      check_in: checkInDate,
      check_out: checkOutDate,
      adults: bookingRoom.adults,
      children: bookingRoom.children,
      children_ages: bookingRoom.children_ages,
    });

    // Update the booking_room with new nightly rates and subtotal
    const { error: roomError } = await supabase
      .from('booking_rooms')
      .update({
        nightly_rates: roomPricing.nightly_rates,
        room_subtotal: roomPricing.room_total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingRoom.id);

    if (roomError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update room pricing');
    }

    newRoomTotal += roomPricing.room_total;
  }

  // Calculate new totals
  const newSubtotal = newRoomTotal + booking.addons_total;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  // Update booking with new dates and totals
  const { error } = await supabase
    .from('bookings')
    .update({
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      total_nights: totalNights,
      room_total: newRoomTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update booking dates');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'booking.dates_updated' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    old_data: { check_in_date: booking.check_in_date, check_out_date: booking.check_out_date },
    new_data: { check_in_date: checkInDate, check_out_date: checkOutDate },
  });

  return getBookingById(bookingId, userId);
};

/**
 * Add a room to a booking
 */
export const addBookingRoom = async (
  bookingId: string,
  userId: string,
  roomData: { room_id: string; adults: number; children?: number; children_ages?: number[] }
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'add room');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  // Get room details
  const room = await getRoomById(roomData.room_id);

  // Calculate pricing
  const pricing = await calculatePrice(roomData.room_id, {
    check_in: booking.check_in_date,
    check_out: booking.check_out_date,
    adults: roomData.adults,
    children: roomData.children || 0,
    children_ages: roomData.children_ages || [],
  });

  // Insert new booking_room
  const { error: insertError } = await supabase.from('booking_rooms').insert({
    booking_id: bookingId,
    room_id: roomData.room_id,
    room_name: room.name,
    room_code: room.room_code,
    adults: roomData.adults,
    children: roomData.children || 0,
    children_ages: roomData.children_ages || [],
    pricing_mode: room.pricing_mode,
    nightly_rates: pricing.nightly_breakdown,
    room_subtotal: pricing.total_price,
    currency: room.currency,
  });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add room to booking');
  }

  // Update booking totals
  const newRoomTotal = booking.room_total + pricing.total_price;
  const newSubtotal = newRoomTotal + booking.addons_total;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      room_total: newRoomTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.room_added' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    new_data: { room_id: roomData.room_id, room_name: room.name },
  });

  return getBookingById(bookingId, userId);
};

/**
 * Update a room in a booking
 */
export const updateBookingRoom = async (
  bookingId: string,
  bookingRoomId: string,
  userId: string,
  updates: { adults?: number; children?: number; children_ages?: number[] }
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'update room guest counts');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  const bookingRoom = booking.rooms.find((r) => r.id === bookingRoomId);
  if (!bookingRoom) {
    throw new AppError('NOT_FOUND', 'Room not found in booking');
  }

  // Recalculate pricing with updated guest counts
  const pricing = await calculatePrice(bookingRoom.room_id, {
    check_in: booking.check_in_date,
    check_out: booking.check_out_date,
    adults: updates.adults ?? bookingRoom.adults,
    children: updates.children ?? bookingRoom.children,
    children_ages: updates.children_ages ?? bookingRoom.children_ages,
  });

  // Update the booking_room
  const updateData: any = {
    room_subtotal: pricing.total_price,
    nightly_rates: pricing.nightly_breakdown,
    updated_at: new Date().toISOString(),
  };

  if (updates.adults !== undefined) updateData.adults = updates.adults;
  if (updates.children !== undefined) updateData.children = updates.children;
  if (updates.children_ages !== undefined) updateData.children_ages = updates.children_ages;

  const { error } = await supabase
    .from('booking_rooms')
    .update(updateData)
    .eq('id', bookingRoomId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update room');
  }

  // Recalculate booking totals
  const { data: allRooms } = await supabase
    .from('booking_rooms')
    .select('room_subtotal')
    .eq('booking_id', bookingId);

  const newRoomTotal = (allRooms || []).reduce((sum, r) => sum + r.room_subtotal, 0);
  const newSubtotal = newRoomTotal + booking.addons_total;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      room_total: newRoomTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.room_updated' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    new_data: updates,
  });

  return getBookingById(bookingId, userId);
};

/**
 * Remove a room from a booking
 */
export const removeBookingRoom = async (
  bookingId: string,
  bookingRoomId: string,
  userId: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'remove room');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  // Don't allow removing last room
  if (booking.rooms.length <= 1) {
    throw new AppError('VALIDATION_ERROR', 'Cannot remove the last room from booking');
  }

  const bookingRoom = booking.rooms.find((r) => r.id === bookingRoomId);
  if (!bookingRoom) {
    throw new AppError('NOT_FOUND', 'Room not found in booking');
  }

  // Delete the booking_room
  const { error } = await supabase
    .from('booking_rooms')
    .delete()
    .eq('id', bookingRoomId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove room');
  }

  // Recalculate booking totals
  const newRoomTotal = booking.room_total - bookingRoom.room_subtotal;
  const newSubtotal = newRoomTotal + booking.addons_total;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      room_total: newRoomTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.room_removed' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    old_data: { room_id: bookingRoom.room_id, room_name: bookingRoom.room_name },
  });

  return getBookingById(bookingId, userId);
};

/**
 * Add an addon to a booking
 */
export const addBookingAddon = async (
  bookingId: string,
  userId: string,
  addonData: { addon_id: string; quantity: number }
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'add add-on');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  // Get addon details (need to fetch from add_ons table via room service or directly)
  const { data: addon, error: addonError } = await supabase
    .from('add_ons')
    .select('*')
    .eq('id', addonData.addon_id)
    .single();

  if (addonError || !addon) {
    throw new AppError('NOT_FOUND', 'Add-on not found');
  }

  // Calculate addon total
  const addonTotal = addon.price * addonData.quantity;

  // Insert new booking_addon
  const { error: insertError } = await supabase.from('booking_addons').insert({
    booking_id: bookingId,
    addon_id: addonData.addon_id,
    addon_name: addon.name,
    pricing_type: addon.pricing_type,
    unit_price: addon.price,
    quantity: addonData.quantity,
    addon_total: addonTotal,
    currency: addon.currency,
  });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add addon to booking');
  }

  // Update booking totals
  const newAddonsTotal = booking.addons_total + addonTotal;
  const newSubtotal = booking.room_total + newAddonsTotal;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      addons_total: newAddonsTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.addon_added' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    new_data: { addon_id: addonData.addon_id, addon_name: addon.name, quantity: addonData.quantity },
  });

  return getBookingById(bookingId, userId);
};

/**
 * Update an addon in a booking
 */
export const updateBookingAddon = async (
  bookingId: string,
  bookingAddonId: string,
  userId: string,
  updates: { quantity: number }
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'update add-on quantity');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  const bookingAddon = booking.addons.find((a) => a.id === bookingAddonId);
  if (!bookingAddon) {
    throw new AppError('NOT_FOUND', 'Add-on not found in booking');
  }

  // Calculate new addon total
  const newAddonTotal = bookingAddon.unit_price * updates.quantity;

  // Update the booking_addon
  const { error } = await supabase
    .from('booking_addons')
    .update({
      quantity: updates.quantity,
      addon_total: newAddonTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingAddonId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update addon');
  }

  // Recalculate booking totals
  const { data: allAddons } = await supabase
    .from('booking_addons')
    .select('addon_total')
    .eq('booking_id', bookingId);

  const newAddonsTotal = (allAddons || []).reduce((sum, a) => sum + a.addon_total, 0);
  const newSubtotal = booking.room_total + newAddonsTotal;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      addons_total: newAddonsTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.addon_updated' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    new_data: { addon_id: bookingAddon.addon_id, quantity: updates.quantity },
  });

  return getBookingById(bookingId, userId);
};

/**
 * Remove an addon from a booking
 */
export const removeBookingAddon = async (
  bookingId: string,
  bookingAddonId: string,
  userId: string
): Promise<BookingWithDetails> => {
  const supabase = getAdminClient();

  const booking = await getBookingById(bookingId, userId);

  // Check payment lock
  validateBookingEditability(booking, 'financial', 'remove add-on');

  if (['checked_out', 'completed', 'cancelled'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Cannot modify this booking');
  }

  const bookingAddon = booking.addons.find((a) => a.id === bookingAddonId);
  if (!bookingAddon) {
    throw new AppError('NOT_FOUND', 'Add-on not found in booking');
  }

  // Delete the booking_addon
  const { error } = await supabase
    .from('booking_addons')
    .delete()
    .eq('id', bookingAddonId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove addon');
  }

  // Recalculate booking totals
  const newAddonsTotal = booking.addons_total - bookingAddon.addon_total;
  const newSubtotal = booking.room_total + newAddonsTotal;
  const newTotalAmount = newSubtotal - booking.discount_amount + booking.tax_amount;

  await supabase
    .from('bookings')
    .update({
      addons_total: newAddonsTotal,
      subtotal: newSubtotal,
      total_amount: newTotalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  await createAuditLog({
    actor_id: userId,
    action: 'booking.addon_removed' as any,
    entity_type: 'booking' as any,
    entity_id: bookingId,
    old_data: { addon_id: bookingAddon.addon_id, addon_name: bookingAddon.addon_name },
  });

  return getBookingById(bookingId, userId);
};

// ============================================================================
// PAYMENTS
// ============================================================================

/**
 * Add a payment to a booking
 */
export const addBookingPayment = async (
  bookingId: string,
  userId: string,
  input: CreateBookingPaymentRequest
): Promise<BookingPayment> => {
  const supabase = getAdminClient();

  // Verify booking ownership and get full booking details
  const booking = await getBookingById(bookingId, userId);

  // Validate payment amount
  if (input.amount <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Payment amount must be greater than zero');
  }

  // Check for overpayment
  const currentAmountPaid = booking.amount_paid || 0;
  const totalAmount = booking.total_amount;
  const outstanding = totalAmount - currentAmountPaid;

  if (input.amount > outstanding) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Payment amount (${input.amount}) exceeds outstanding balance (${outstanding})`
    );
  }

  // Prevent payment on cancelled bookings
  if (booking.booking_status === 'cancelled') {
    throw new AppError('VALIDATION_ERROR', 'Cannot record payment for cancelled bookings');
  }

  const { data, error } = await supabase
    .from('booking_payments')
    .insert({
      booking_id: bookingId,
      amount: input.amount,
      currency: input.currency || 'ZAR',
      payment_method: input.payment_method,
      payment_reference: input.payment_reference || null,
      gateway_reference: input.gateway_reference || null,
      gateway_response: input.gateway_response || null,
      status: input.status || 'pending',
      paid_at: input.paid_at || null,
      // proof_url: Removed - proof tracking now handled in bookings table only
      notes: input.notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add payment');
  }

  const payment = data;

  // If proof is provided, update the bookings table's payment_proof_url
  if (input.proof_url) {
    await supabase
      .from('bookings')
      .update({
        payment_proof_url: input.proof_url,
        payment_proof_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);
  }

  // Generate receipt for completed/verified payments
  if (payment.status === 'completed' || payment.status === 'verified') {
    try {
      // Get property details for receipt
      const property = await getProperty(booking.property_id);

      // Prepare room names
      const roomNames = booking.rooms?.map((r) => r.room_name) || [];

      // Check if payment should be applied to a milestone
      let appliedToMilestone: string | null = null;
      const schedule = await getBookingPaymentSchedule(bookingId);

      if (schedule.length > 0) {
        // Find the next pending or partial milestone
        const nextMilestone = schedule.find((m) => m.status === 'pending' || m.status === 'partial');

        if (nextMilestone) {
          appliedToMilestone = nextMilestone.milestone_name;

          // Update milestone status
          const newAmountPaid = nextMilestone.amount_paid + payment.amount;
          await updateMilestoneStatus(nextMilestone.id, newAmountPaid, nextMilestone.amount_due);

          // Store milestone reference in payment
          await supabase
            .from('booking_payments')
            .update({ applied_to_milestone_id: nextMilestone.id })
            .eq('id', payment.id);
        }
      }

      // Calculate financial breakdown for receipt
      const { data: allPayments } = await supabase
        .from('booking_payments')
        .select('amount, paid_at, status')
        .eq('booking_id', bookingId)
        .eq('status', 'completed')
        .order('paid_at', { ascending: true });

      const previousPayments = allPayments?.filter(
        (p) => p.paid_at && payment.paid_at && new Date(p.paid_at) < new Date(payment.paid_at)
      ) || [];
      const previousPaymentsTotal = previousPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPaid = previousPaymentsTotal + payment.amount;
      const balanceRemaining = booking.total_amount - totalPaid;

      // Get invoice number if exists
      const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('booking_id', bookingId)
        .maybeSingle();

      const paymentNumber = previousPayments.length + 1;
      const totalPaymentsCount = allPayments?.length || 1;

      // Generate receipt
      const { receiptNumber, receiptUrl } = await generatePaymentReceipt({
        payment_id: payment.id,
        booking_id: bookingId,
        booking_reference: booking.booking_reference,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        payment_date: payment.paid_at || payment.created_at,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        property_name: property.name,
        room_names: roomNames,
        checkin_date: booking.check_in_date,
        checkout_date: booking.check_out_date,
        total_nights: booking.total_nights,
        applied_to_milestone: appliedToMilestone,
        company_id: property.company_id!,

        // Financial breakdown (for accounting best practices)
        total_booking_amount: booking.total_amount,
        previous_payments_total: previousPaymentsTotal,
        balance_remaining: balanceRemaining,
        invoice_number: invoice?.invoice_number || null,
        payment_number: paymentNumber,
        total_payments_count: totalPaymentsCount,
      });

      // Update payment with receipt info
      await supabase
        .from('booking_payments')
        .update({
          receipt_number: receiptNumber,
          receipt_url: receiptUrl,
        })
        .eq('id', payment.id);

      // Update the payment object to return
      payment.receipt_number = receiptNumber;
      payment.receipt_url = receiptUrl;
    } catch (receiptError) {
      // Log but don't fail the payment if receipt generation fails
      console.error('Failed to generate payment receipt:', receiptError);
    }
  }

  // Update booking totals
  await updateBookingPaymentTotals(bookingId);

  // *** AUTO-GENERATE INVOICE IF BOOKING IS FULLY PAID ***
  // Check if booking is now fully paid and generate invoice automatically
  try {
    const updatedBooking = await getBookingById(bookingId, userId);
    const totalPaid = updatedBooking.amount_paid || 0;
    const totalAmount = updatedBooking.total_amount;

    // If fully paid (100% or more) and no invoice exists yet, generate invoice
    if (totalPaid >= totalAmount && !updatedBooking.invoice_id) {
      console.log(`Booking ${updatedBooking.booking_reference} is fully paid, auto-generating invoice...`);

      // Generate invoice
      const invoice = await generateBookingInvoice(updatedBooking, userId);

      // Link invoice to booking
      await supabase.from('bookings').update({
        invoice_id: invoice.id,
        invoice_generated_at: new Date().toISOString(),
      }).eq('id', bookingId);

      console.log(`Auto-generated invoice ${invoice.invoice_number} for booking ${updatedBooking.booking_reference}`);

      // Audit log for auto-generated invoice
      await createAuditLog({
        actor_id: userId,
        action: 'invoice.auto_generated' as any,
        entity_type: 'booking' as any,
        entity_id: bookingId,
        new_data: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount_paid: totalPaid,
          total_amount: totalAmount,
        },
      });
    }
  } catch (invoiceError) {
    // Log but don't fail the payment if invoice generation fails
    console.error('❌ Failed to auto-generate invoice for booking:', bookingId, invoiceError);
    console.error('Invoice generation error details:', {
      bookingId,
      bookingReference: booking.booking_reference,
      error: invoiceError instanceof Error ? invoiceError.message : String(invoiceError),
      stack: invoiceError instanceof Error ? invoiceError.stack : undefined,
    });
    // Invoice can be generated manually later if needed
  }

  return payment;
};

/**
 * Update booking payment totals based on payments
 */
const updateBookingPaymentTotals = async (bookingId: string): Promise<void> => {
  const supabase = getAdminClient();

  // Sum all successful payments
  const { data: payments } = await supabase
    .from('booking_payments')
    .select('amount, status')
    .eq('booking_id', bookingId)
    .in('status', ['completed', 'verified']);

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  // Get booking total
  const { data: booking } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  let paymentStatus: PaymentStatus = 'pending';
  if (totalPaid >= booking.total_amount) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  await supabase
    .from('bookings')
    .update({
      amount_paid: totalPaid,
      payment_status: paymentStatus,
      payment_received_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', bookingId);
};

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Request a refund
 */
export const requestRefund = async (
  bookingId: string,
  userId: string,
  input: CreateRefundRequestRequest
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Verify booking exists and user has access
  const booking = await getBookingById(bookingId);

  // Check if booking is paid
  if (booking.payment_status !== 'paid') {
    throw new AppError('VALIDATION_ERROR', 'Only paid bookings can be refunded');
  }

  const { data, error } = await supabase
    .from('refund_requests')
    .insert({
      booking_id: bookingId,
      requested_amount: input.requested_amount,
      currency: booking.currency,
      status: 'requested',
      reason: input.reason,
      requested_by: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create refund request');
  }

  return data;
};

/**
 * Review a refund request
 */
export const reviewRefundRequest = async (
  refundId: string,
  userId: string,
  input: ReviewRefundRequest
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  const updateData: any = {
    status: input.status,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    review_notes: input.review_notes || null,
    updated_at: new Date().toISOString(),
  };

  if (input.status === 'approved') {
    updateData.approved_amount = input.approved_amount;
    updateData.status = 'approved';
  }

  const { data, error } = await supabase
    .from('refund_requests')
    .update(updateData)
    .eq('id', refundId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Refund request not found');
  }

  return data;
};

// ============================================================================
// CONFLICT CHECKING
// ============================================================================

/**
 * Check for booking conflicts
 */
export const checkConflicts = async (
  request: ConflictCheckRequest
): Promise<ConflictCheckResponse> => {
  const conflicts: ConflictCheckResponse['conflicts'] = [];

  for (const roomReq of request.rooms) {
    const availability = await checkAvailability(roomReq.room_id, {
      check_in: request.check_in,
      check_out: request.check_out,
      exclude_booking_id: request.exclude_booking_id,
    });

    if (!availability.is_available) {
      const room = await getRoomById(roomReq.room_id);
      conflicts.push({
        room_id: roomReq.room_id,
        room_name: room.name,
        conflicting_bookings: availability.conflicting_bookings,
      });
    }
  }

  return {
    has_conflicts: conflicts.length > 0,
    conflicts,
  };
};

// ============================================================================
// COUPON VALIDATION
// ============================================================================

/**
 * Validate a coupon code
 */
export const validateCoupon = async (
  request: ValidateCouponRequest
): Promise<ValidateCouponResponse> => {
  const supabase = getAdminClient();

  const { data: promotion, error } = await supabase
    .from('room_promotions')
    .select('*')
    .eq('code', request.code.toUpperCase())
    .eq('is_active', true)
    .or(`property_id.eq.${request.property_id},room_id.in.(${request.room_ids?.join(',') || ''})`)
    .lte('valid_from', new Date().toISOString())
    .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
    .single();

  if (error || !promotion) {
    return { valid: false, error: 'Invalid or expired coupon code' };
  }

  // Check usage limits
  if (promotion.max_uses !== null && promotion.current_uses >= promotion.max_uses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  // Check minimum booking amount
  if (promotion.min_booking_amount !== null && request.booking_amount < promotion.min_booking_amount) {
    return {
      valid: false,
      error: `Minimum booking amount of ${promotion.min_booking_amount} required`,
    };
  }

  // Check minimum nights
  if (promotion.min_nights !== null && request.nights < promotion.min_nights) {
    return {
      valid: false,
      error: `Minimum ${promotion.min_nights} nights required`,
    };
  }

  // Calculate discount
  let calculatedDiscount = 0;
  if (promotion.discount_type === 'percentage') {
    calculatedDiscount = (request.booking_amount * promotion.discount_value) / 100;
  } else if (promotion.discount_type === 'fixed_amount') {
    calculatedDiscount = Math.min(promotion.discount_value, request.booking_amount);
  }

  return {
    valid: true,
    promotion: {
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      calculated_discount: calculatedDiscount,
    },
  };
};

// ============================================================================
// STATS & CALENDAR
// ============================================================================

/**
 * Get booking stats for a property
 */
export const getBookingStats = async (
  propertyId: string,
  userId: string
): Promise<BookingStats> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_status, payment_status, total_amount, currency')
    .eq('property_id', propertyId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch booking stats');
  }

  const bookings = data || [];

  const stats: BookingStats = {
    total_bookings: bookings.length,
    pending_bookings: bookings.filter((b) => b.booking_status === 'pending').length,
    confirmed_bookings: bookings.filter((b) => b.booking_status === 'confirmed').length,
    checked_in_bookings: bookings.filter((b) => b.booking_status === 'checked_in').length,
    completed_bookings: bookings.filter((b) => ['checked_out', 'completed'].includes(b.booking_status)).length,
    cancelled_bookings: bookings.filter((b) => b.booking_status === 'cancelled').length,
    total_revenue: bookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    pending_payments: bookings
      .filter((b) => b.payment_status === 'pending' && b.booking_status !== 'cancelled')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
    currency: bookings[0]?.currency || 'ZAR',
  };

  return stats;
};

/**
 * Get calendar entries for a property
 * @param includeCancelled - Whether to include cancelled bookings (default: false)
 */
export const getCalendarEntries = async (
  propertyId: string,
  userId: string,
  startDate: string,
  endDate: string,
  includeCancelled: boolean = false
): Promise<BookingCalendarEntry[]> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  // Build booking query
  let bookingQuery = supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      booking_status,
      payment_status,
      source,
      total_amount,
      currency,
      adults,
      children,
      payment_proof_url,
      payment_proof_uploaded_at,
      payment_verified_at,
      payment_verified_by,
      payment_rejection_reason,
      refund_status,
      total_refunded,
      has_pending_modification
    `)
    .eq('property_id', propertyId)
    .gte('check_out_date', startDate)
    .lte('check_in_date', endDate);

  // Optionally filter out cancelled bookings
  if (!includeCancelled) {
    bookingQuery = bookingQuery.neq('booking_status', 'cancelled');
  }

  const { data: bookings, error } = await bookingQuery;

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch calendar entries');
  }

  // Get rooms for these bookings
  const bookingIds = (bookings || []).map((b) => b.id);

  if (bookingIds.length === 0) {
    return [];
  }

  const { data: bookingRooms } = await supabase
    .from('booking_rooms')
    .select('booking_id, room_id, room_name, unit_number')
    .in('booking_id', bookingIds);

  // Get room thumbnails separately to avoid join issues
  const roomIds = [...new Set((bookingRooms || []).map((r: any) => r.room_id))];
  const { data: roomsData } = await supabase
    .from('rooms')
    .select('id, thumbnail_url')
    .in('id', roomIds);

  // Create a map of room thumbnails for quick lookup
  const roomThumbnailMap = new Map<string, string | null>();
  (roomsData || []).forEach((r: any) => {
    roomThumbnailMap.set(r.id, r.thumbnail_url);
  });

  // Flatten to calendar entries (one per room per booking)
  const entries: BookingCalendarEntry[] = [];

  for (const booking of bookings || []) {
    const rooms = (bookingRooms || []).filter((r: any) => r.booking_id === booking.id);

    for (const room of rooms) {
      entries.push({
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        room_id: room.room_id,
        room_name: room.room_name,
        room_thumbnail: roomThumbnailMap.get(room.room_id) || null,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email || null,
        guest_phone: booking.guest_phone || null,
        check_in: booking.check_in_date,
        check_out: booking.check_out_date,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        source: booking.source,
        total_amount: booking.total_amount,
        currency: booking.currency || 'ZAR',
        adults: booking.adults || 0,
        children: booking.children || 0,
        unit_number: room.unit_number,
        // Payment proof metadata
        payment_proof_url: booking.payment_proof_url || null,
        payment_proof_uploaded_at: booking.payment_proof_uploaded_at || null,
        payment_verified_at: booking.payment_verified_at || null,
        payment_verified_by: booking.payment_verified_by || null,
        payment_rejection_reason: booking.payment_rejection_reason || null,
        // Refund information
        refund_status: booking.refund_status || 'none',
        total_refunded: booking.total_refunded || 0,
        // Modification tracking
        has_pending_modification: booking.has_pending_modification || false,
      });
    }
  }

  // ============================================================================
  // Query availability blocks for this property
  // ============================================================================

  // Get all rooms for this property first
  const { data: propertyRooms } = await supabase
    .from('rooms')
    .select('id, name, thumbnail_url')
    .eq('property_id', propertyId);

  if (propertyRooms && propertyRooms.length > 0) {
    const propertyRoomIds = propertyRooms.map(r => r.id);

    // Query availability blocks overlapping with date range
    const { data: blocks } = await supabase
      .from('room_availability_blocks')
      .select(`
        id,
        room_id,
        block_type,
        reason,
        start_date,
        end_date
      `)
      .in('room_id', propertyRoomIds)
      .gte('end_date', startDate)
      .lte('start_date', endDate);

    // Add blocks as calendar entries
    if (blocks) {
      for (const block of blocks) {
        const room = propertyRooms.find(r => r.id === block.room_id);
        if (room) {
          // Create a calendar entry for the block
          // Note: We use a special format for block entries
          entries.push({
            booking_id: block.id, // Use block ID as booking_id
            booking_reference: `BLOCK-${block.id.slice(0, 8)}`,
            room_id: block.room_id,
            room_name: room.name,
            room_thumbnail: room.thumbnail_url || null,
            guest_name: block.block_type === 'maintenance' ? 'Maintenance' :
                        block.block_type === 'personal_use' ? 'Owner Blocked' :
                        block.block_type === 'renovation' ? 'Renovation' : 'Blocked',
            guest_email: null,
            guest_phone: null,
            check_in: block.start_date,
            check_out: block.end_date,
            booking_status: 'confirmed' as any, // Blocks are treated as confirmed
            payment_status: 'paid' as any, // Blocks don't need payment
            source: 'manual' as any,
            total_amount: 0,
            currency: 'ZAR',
            adults: 0,
            children: 0,
            unit_number: 1,
            // No payment proof for blocks
            payment_proof_url: null,
            payment_proof_uploaded_at: null,
            payment_verified_at: null,
            payment_verified_by: null,
            payment_rejection_reason: null,
            // No refunds for blocks
            refund_status: 'none',
            total_refunded: 0,
            // No modifications for blocks
            has_pending_modification: false,
          } as BookingCalendarEntry);
        }
      }
    }
  }

  return entries;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get property owner info for notifications
 */
const getPropertyOwnerInfo = async (
  propertyId: string
): Promise<{ userId: string; email: string | null }> => {
  const supabase = getAdminClient();

  const { data: property } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .single();

  if (!property) {
    return { userId: '', email: null };
  }

  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', property.owner_id)
    .single();

  return {
    userId: property.owner_id,
    email: user?.email || null,
  };
};

/**
 * Calculate add-on total based on pricing type
 */
const calculateAddonTotal = (
  price: number,
  pricingType: string,
  quantity: number,
  nights: number,
  guests: number
): number => {
  switch (pricingType) {
    case 'per_booking':
      return price * quantity;
    case 'per_night':
      return price * nights * quantity;
    case 'per_guest':
      return price * guests * quantity;
    case 'per_guest_per_night':
      return price * guests * nights * quantity;
    default:
      return price * quantity;
  }
};

/**
 * List add-ons for a property (internal - no ownership check)
 */
const listPropertyAddOnsInternal = async (propertyId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('add_ons')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
};

// ============================================================================
// REFUND-RELATED HELPER METHODS
// ============================================================================

/**
 * Get booking with refund details
 */
export const getBookingWithRefunds = async (
  bookingId: string,
  userId?: string
): Promise<any> => {
  const supabase = getAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      rooms:booking_rooms(*),
      addons:booking_addons(*),
      guests:booking_guests(*),
      payments:booking_payments(*),
      status_history:booking_status_history(*),
      refund_requests(*,
        credit_memo:credit_memos(*)
      ),
      property:properties(
        id,
        name,
        slug,
        cancellation_policy
      )
    `
    )
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // TODO: Add RLS check if userId provided

  return booking;
};

/**
 * Validate refund eligibility for a booking
 */
export const validateRefundEligibility = async (
  bookingId: string
): Promise<{
  eligible: boolean;
  reason?: string;
  available_for_refund?: number;
}> => {
  const supabase = getAdminClient();

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, payment_status, amount_paid, total_refunded, booking_status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { eligible: false, reason: 'Booking not found' };
  }

  // Check payment status
  if (booking.payment_status !== 'paid' && booking.payment_status !== 'partial') {
    return {
      eligible: false,
      reason: 'Booking must be paid or partially paid to request refund',
    };
  }

  // Check available amount for refund
  const availableForRefund = (booking.amount_paid || 0) - (booking.total_refunded || 0);
  if (availableForRefund <= 0) {
    return { eligible: false, reason: 'No amount available for refund' };
  }

  // Check for existing active refund requests
  const { data: activeRequests, error: activeError } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('booking_id', bookingId)
    .in('status', ['requested', 'under_review', 'approved', 'processing']);

  if (activeError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to validate refund eligibility');
  }

  if (activeRequests && activeRequests.length > 0) {
    return {
      eligible: false,
      reason: 'An active refund request already exists for this booking',
    };
  }

  return {
    eligible: true,
    available_for_refund: availableForRefund,
  };
};

/**
 * Update booking refund status after refund completion
 */
export const updateBookingRefundStatus = async (bookingId: string): Promise<void> => {
  const supabase = getAdminClient();

  // Get all completed refunds
  const { data: completedRefunds, error: refundsError } = await supabase
    .from('refund_requests')
    .select('refunded_amount')
    .eq('booking_id', bookingId)
    .eq('status', 'completed');

  if (refundsError) {
    logger.error('Error fetching completed refunds:', { message: refundsError.message, code: refundsError.code, details: refundsError.details });
    return;
  }

  const totalRefunded = (completedRefunds || []).reduce(
    (sum, r) => sum + (r.refunded_amount || 0),
    0
  );

  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('amount_paid, payment_status')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  // Determine refund status
  let refundStatus: 'none' | 'partial' | 'full' = 'none';
  let paymentStatus = booking.payment_status;

  if (totalRefunded > 0) {
    refundStatus = totalRefunded >= (booking.amount_paid || 0) ? 'full' : 'partial';
    // Update payment status to refunded if full refund
    if (refundStatus === 'full') {
      paymentStatus = 'refunded';
    }
  }

  // Update booking
  await supabase
    .from('bookings')
    .update({
      total_refunded: totalRefunded,
      refund_status: refundStatus,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  logger.info(
    `Updated booking ${bookingId} refund status: ${refundStatus}, total: ${totalRefunded}`
  );
};

// ============================================================================
// BOOKING LOCK & REFUND PROTECTION
// ============================================================================

/**
 * Check if a booking has active refund requests
 * Active statuses: requested, under_review, approved, processing
 */
export const hasActiveRefunds = async (bookingId: string): Promise<boolean> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('refund_requests')
    .select('id, status')
    .eq('booking_id', bookingId)
    .in('status', ['requested', 'under_review', 'approved', 'processing'])
    .limit(1);

  if (error) {
    logger.error('Error checking active refunds:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};

/**
 * Validate that a booking is not locked due to active refund requests
 * Throws AppError if booking is locked
 */
export const validateBookingRefundLock = async (
  bookingId: string
): Promise<BookingLockStatus> => {
  const supabase = getAdminClient();

  // Get all active refund requests
  const { data: activeRefunds, error } = await supabase
    .from('refund_requests')
    .select('id, status, requested_amount, requested_at')
    .eq('booking_id', bookingId)
    .in('status', ['requested', 'under_review', 'approved', 'processing']);

  if (error) {
    logger.error('Error checking booking refund lock:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to check booking lock status');
  }

  const hasActive = (activeRefunds?.length || 0) > 0;

  if (hasActive) {
    throw new AppError(
      'REFUND_LOCK',
      `This booking is locked and cannot be modified because it has ${activeRefunds!.length} active refund request(s). The booking will be unlocked once all refunds are resolved (completed, failed, rejected, or withdrawn).`,
      {
        locked: true,
        active_refunds: activeRefunds,
      }
    );
  }

  return {
    locked: false,
    active_refunds: [],
  };
};

// ============================================================================
// BOOKING HISTORY & TIMELINE
// ============================================================================

/**
 * Get comprehensive history/timeline of all events for a booking
 * Aggregates from: bookings, booking_status_history, booking_payments, refund_requests, audit_log
 */
export const getBookingHistory = async (
  bookingId: string,
  userId?: string
): Promise<TimelineEvent[]> => {
  const supabase = getAdminClient();

  const events: TimelineEvent[] = [];

  // 1. Get booking creation event
  const { data: booking } = await supabase
    .from('bookings')
    .select('created_at, created_by, guest_name')
    .eq('id', bookingId)
    .single();

  if (booking) {
    events.push({
      id: `booking-created-${bookingId}`,
      type: 'created',
      timestamp: booking.created_at,
      title: 'Booking Created',
      description: `Booking created for ${booking.guest_name}`,
    });
  }

  // 2. Get status change history
  const { data: statusHistory } = await supabase
    .from('booking_status_history')
    .select('id, old_status, new_status, changed_at, changed_by, reason')
    .eq('booking_id', bookingId)
    .order('changed_at', { ascending: false });

  if (statusHistory) {
    for (const change of statusHistory) {
      events.push({
        id: change.id,
        type: 'status_change',
        timestamp: change.changed_at,
        title: `Status Changed: ${change.old_status} → ${change.new_status}`,
        description: change.reason || undefined,
        old_value: change.old_status,
        new_value: change.new_status,
        metadata: {
          old_status: change.old_status,
          new_status: change.new_status,
        },
      });
    }
  }

  // 3. Get payment events
  const { data: payments } = await supabase
    .from('booking_payments')
    .select('id, amount, method, status, paid_at, payment_reference')
    .eq('booking_id', bookingId)
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false });

  if (payments) {
    for (const payment of payments) {
      events.push({
        id: payment.id,
        type: 'payment',
        timestamp: payment.paid_at!,
        title: `Payment Received`,
        description: `${payment.method} payment of amount ${payment.amount}`,
        metadata: {
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          reference: payment.payment_reference,
        },
      });
    }
  }

  // 4. Get refund events
  const { data: refunds } = await supabase
    .from('refund_requests')
    .select('id, requested_amount, approved_amount, refunded_amount, status, requested_at, reviewed_at, processed_at, reason')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (refunds) {
    for (const refund of refunds) {
      // Refund requested event
      events.push({
        id: `${refund.id}-requested`,
        type: 'refund',
        timestamp: refund.requested_at,
        title: 'Refund Requested',
        description: `Refund amount: ${refund.requested_amount}. Reason: ${refund.reason}`,
        metadata: {
          refund_id: refund.id,
          status: 'requested',
          amount: refund.requested_amount,
        },
      });

      // Refund reviewed event (if reviewed)
      if (refund.reviewed_at) {
        const reviewTitle =
          refund.status === 'approved'
            ? 'Refund Approved'
            : refund.status === 'rejected'
            ? 'Refund Rejected'
            : 'Refund Reviewed';

        events.push({
          id: `${refund.id}-reviewed`,
          type: 'refund',
          timestamp: refund.reviewed_at,
          title: reviewTitle,
          description:
            refund.status === 'approved'
              ? `Approved amount: ${refund.approved_amount || refund.requested_amount}`
              : `Request rejected`,
          metadata: {
            refund_id: refund.id,
            status: refund.status,
            approved_amount: refund.approved_amount,
          },
        });
      }

      // Refund processed event (if processed)
      if (refund.processed_at) {
        const processTitle =
          refund.status === 'completed'
            ? 'Refund Completed'
            : refund.status === 'failed'
            ? 'Refund Failed'
            : 'Refund Processed';

        events.push({
          id: `${refund.id}-processed`,
          type: 'refund',
          timestamp: refund.processed_at,
          title: processTitle,
          description:
            refund.status === 'completed'
              ? `Refunded amount: ${refund.refunded_amount}`
              : 'Processing failed',
          metadata: {
            refund_id: refund.id,
            status: refund.status,
            refunded_amount: refund.refunded_amount,
          },
        });
      }

      // Refund withdrawn (if status is withdrawn)
      if (refund.status === 'withdrawn') {
        events.push({
          id: `${refund.id}-withdrawn`,
          type: 'refund',
          timestamp: refund.processed_at || refund.reviewed_at || refund.requested_at,
          title: 'Refund Withdrawn',
          description: 'Guest withdrew the refund request',
          metadata: {
            refund_id: refund.id,
            status: 'withdrawn',
          },
        });
      }
    }
  }

  // 5. Get check-in/check-out events from booking
  const { data: bookingDetails } = await supabase
    .from('bookings')
    .select('checked_in_at, checked_out_at, cancelled_at, cancellation_reason')
    .eq('id', bookingId)
    .single();

  if (bookingDetails) {
    if (bookingDetails.checked_in_at) {
      events.push({
        id: `booking-checkin-${bookingId}`,
        type: 'checkin',
        timestamp: bookingDetails.checked_in_at,
        title: 'Guest Checked In',
      });
    }

    if (bookingDetails.checked_out_at) {
      events.push({
        id: `booking-checkout-${bookingId}`,
        type: 'checkout',
        timestamp: bookingDetails.checked_out_at,
        title: 'Guest Checked Out',
      });
    }

    if (bookingDetails.cancelled_at) {
      events.push({
        id: `booking-cancelled-${bookingId}`,
        type: 'cancellation',
        timestamp: bookingDetails.cancelled_at,
        title: 'Booking Cancelled',
        description: bookingDetails.cancellation_reason || undefined,
      });
    }
  }

  // Sort all events by timestamp (most recent first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
};

// ============================================================================
// PAYMENT PROOF UPLOAD & VERIFICATION (EFT)
// ============================================================================

/**
 * Upload payment proof for EFT booking
 * Guest uploads proof of payment (e.g., bank transfer receipt)
 * Updates payment_status to 'verification_pending'
 */
export const uploadPaymentProof = async (
  bookingId: string,
  uploadData: UploadPaymentProofRequest,
  userId: string
): Promise<PaymentProofResponse> => {
  const supabase = getAdminClient();

  // Get booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Check authorization - only guest can upload proof for their booking
  if (booking.guest_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only upload payment proof for your own bookings');
  }

  // Check if payment method is EFT
  if (booking.payment_method !== 'eft') {
    throw new AppError('BAD_REQUEST', 'Payment proof upload is only for EFT payments');
  }

  // Check if booking is in pending status
  if (booking.payment_status !== 'pending' && booking.payment_status !== 'verification_pending') {
    throw new AppError('BAD_REQUEST', `Cannot upload proof for booking with payment status: ${booking.payment_status}`);
  }

  // Update booking with payment proof
  const now = new Date().toISOString();
  const { data: updatedBooking, error: updateError } = await supabase
    .from('bookings')
    .update({
      payment_proof_url: uploadData.file_url,
      payment_proof_uploaded_at: now,
      payment_status: 'verification_pending',
      payment_rejection_reason: null, // Clear any previous rejection reason
      updated_at: now,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    throw new AppError('DATABASE_ERROR', 'Failed to update booking with payment proof');
  }

  // Send notification to property owner
  const { data: property } = await supabase
    .from('properties')
    .select('owner_id, name')
    .eq('id', booking.property_id)
    .single();

  if (property?.owner_id) {
    await sendNotification({
      user_id: property.owner_id,
      type: 'booking',
      title: 'New Payment Proof Uploaded',
      message: `${booking.guest_name} uploaded payment proof for booking ${booking.booking_reference}. Please verify payment.`,
      action_url: `/bookings/${bookingId}`,
      priority: 'high',
      variant: 'info',
    }).catch(err => {
      console.error('Failed to send payment proof notification to owner:', err);
    });
  }

  // Send confirmation to guest
  await sendNotification({
    user_id: userId,
    type: 'booking',
    title: 'Payment Proof Received',
    message: `We've received your payment proof for booking ${booking.booking_reference}. The property owner will verify your payment shortly.`,
    action_url: `/guest/bookings/${bookingId}`,
    priority: 'normal',
  }).catch(err => {
    console.error('Failed to send payment proof confirmation to guest:', err);
  });

  return {
    booking_id: bookingId,
    payment_proof_url: updatedBooking.payment_proof_url,
    payment_proof_uploaded_at: updatedBooking.payment_proof_uploaded_at,
    payment_status: updatedBooking.payment_status,
    message: 'Payment proof uploaded successfully. Awaiting verification.',
  };
};

/**
 * Verify EFT payment (approve or reject payment proof)
 * Property owner verifies the uploaded payment proof
 * On approve: Sets payment_status to 'paid' and booking_status to 'confirmed'
 * On reject: Sends notification to guest with reason
 */
export const verifyEFTPayment = async (
  bookingId: string,
  verifyData: VerifyEFTPaymentRequest,
  verifiedBy: string
): Promise<{ success: boolean; booking: Booking; message: string }> => {
  const supabase = getAdminClient();

  // Validate rejection reason if rejecting
  if (verifyData.action === 'reject' && !verifyData.rejection_reason) {
    throw new AppError('BAD_REQUEST', 'Rejection reason is required when rejecting payment proof');
  }

  // Get booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, properties!inner(owner_id, name)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Check authorization - only property owner can verify
  const property = booking.properties as any;
  if (property.owner_id !== verifiedBy) {
    throw new AppError('FORBIDDEN', 'Only the property owner can verify payment proofs');
  }

  // Check if payment is awaiting verification
  if (booking.payment_status !== 'verification_pending') {
    throw new AppError('BAD_REQUEST', `Cannot verify payment with status: ${booking.payment_status}`);
  }

  // Check if payment proof was uploaded
  if (!booking.payment_proof_url) {
    throw new AppError('BAD_REQUEST', 'No payment proof found for this booking');
  }

  const now = new Date().toISOString();

  if (verifyData.action === 'approve') {
    // APPROVE: Mark payment as verified and booking as confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        booking_status: 'confirmed',
        payment_verified_at: now,
        payment_verified_by: verifiedBy,
        payment_received_at: now,
        amount_paid: booking.total_amount, // Mark full amount as paid
        payment_rejection_reason: null,
        updated_at: now,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      throw new AppError('DATABASE_ERROR', 'Failed to approve payment');
    }

    // Send confirmation to guest
    if (booking.guest_id) {
      await sendNotification({
        user_id: booking.guest_id,
        type: 'booking',
        title: 'Payment Verified ✅',
        message: `Your payment for booking ${booking.booking_reference} has been verified. Your booking is now confirmed!`,
        action_url: `/guest/bookings/${bookingId}`,
        priority: 'high',
        variant: 'success',
      }).catch(err => {
        console.error('Failed to send payment approval notification:', err);
      });
    }

    return {
      success: true,
      booking: updatedBooking,
      message: 'Payment verified successfully. Booking is now confirmed.',
    };
  } else {
    // REJECT: Send rejection notification and allow guest to re-upload
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'pending', // Reset to pending so guest can re-upload
        payment_rejection_reason: verifyData.rejection_reason,
        payment_verified_at: now,
        payment_verified_by: verifiedBy,
        updated_at: now,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      throw new AppError('DATABASE_ERROR', 'Failed to reject payment');
    }

    // Send rejection notification to guest
    if (booking.guest_id) {
      await sendNotification({
        user_id: booking.guest_id,
        type: 'booking',
        title: 'Payment Proof Rejected',
        message: `Your payment proof for booking ${booking.booking_reference} was rejected. Reason: ${verifyData.rejection_reason}. Please upload a new payment proof.`,
        action_url: `/guest/bookings/${bookingId}`,
        priority: 'high',
        variant: 'error',
      }).catch(err => {
        console.error('Failed to send payment rejection notification:', err);
      });
    }

    return {
      success: true,
      booking: updatedBooking,
      message: 'Payment proof rejected. Guest has been notified.',
    };
  }
};
