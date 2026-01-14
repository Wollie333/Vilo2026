import { api } from './api.service';
import type {
  Booking,
  BookingWithDetails,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingListParams,
  BookingListResponse,
  BookingStats,
  BookingCalendarEntry,
  UpdateBookingStatusRequest,
  UpdatePaymentStatusRequest,
  CheckInRequest,
  CheckOutRequest,
  CancelBookingRequest,
  ConflictCheckRequest,
  ConflictCheckResponse,
  BookingPayment,
  CreateBookingPaymentRequest,
  VerifyPaymentProofRequest,
  BookingGuest,
  CreateBookingGuestRequest,
  RefundRequest,
  CreateRefundRequestRequest,
  ReviewRefundRequest,
  ProcessRefundRequest,
  InitiateCheckoutRequest,
  CheckoutPricingResponse,
  CompleteCheckoutRequest,
  CompleteCheckoutResponse,
  ValidateCouponRequest,
  ValidateCouponResponse,
  TimelineEvent,
  UploadPaymentProofRequest,
  VerifyEFTPaymentRequest,
  PaymentProofResponse,
} from '@/types/booking.types';

class BookingService {
  // ============================================================================
  // BOOKING CRUD
  // ============================================================================

  /**
   * List bookings with filters
   */
  async listBookings(params?: BookingListParams): Promise<BookingListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.property_id) queryParams.set('property_id', params.property_id);
    if (params?.guest_id) queryParams.set('guest_id', params.guest_id);
    if (params?.guest_email) queryParams.set('guest_email', params.guest_email);
    if (params?.booking_status) {
      const statuses = Array.isArray(params.booking_status) ? params.booking_status : [params.booking_status];
      statuses.forEach(s => queryParams.append('booking_status', s));
    }
    if (params?.payment_status) {
      const statuses = Array.isArray(params.payment_status) ? params.payment_status : [params.payment_status];
      statuses.forEach(s => queryParams.append('payment_status', s));
    }
    if (params?.source) {
      const sources = Array.isArray(params.source) ? params.source : [params.source];
      sources.forEach(s => queryParams.append('source', s));
    }
    if (params?.check_in_from) queryParams.set('check_in_from', params.check_in_from);
    if (params?.check_in_to) queryParams.set('check_in_to', params.check_in_to);
    if (params?.check_out_from) queryParams.set('check_out_from', params.check_out_from);
    if (params?.check_out_to) queryParams.set('check_out_to', params.check_out_to);
    if (params?.created_from) queryParams.set('created_from', params.created_from);
    if (params?.created_to) queryParams.set('created_to', params.created_to);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<BookingListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch bookings');
    }

    return response.data;
  }

  /**
   * List bookings for a specific property
   */
  async listPropertyBookings(propertyId: string, params?: Omit<BookingListParams, 'property_id'>): Promise<BookingListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.booking_status) {
      const statuses = Array.isArray(params.booking_status) ? params.booking_status : [params.booking_status];
      statuses.forEach(s => queryParams.append('booking_status', s));
    }
    if (params?.payment_status) {
      const statuses = Array.isArray(params.payment_status) ? params.payment_status : [params.payment_status];
      statuses.forEach(s => queryParams.append('payment_status', s));
    }
    if (params?.check_in_from) queryParams.set('check_in_from', params.check_in_from);
    if (params?.check_in_to) queryParams.set('check_in_to', params.check_in_to);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/properties/${propertyId}/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<BookingListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch property bookings');
    }

    return response.data;
  }

  /**
   * Get a single booking by ID
   */
  async getBooking(id: string): Promise<BookingWithDetails> {
    const response = await api.get<BookingWithDetails>(`/bookings/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch booking');
    }

    return response.data;
  }

  /**
   * Get a booking by reference
   */
  async getBookingByReference(reference: string): Promise<BookingWithDetails> {
    const response = await api.get<BookingWithDetails>(`/bookings/reference/${reference}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch booking');
    }

    return response.data;
  }

  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingRequest): Promise<BookingWithDetails> {
    const response = await api.post<BookingWithDetails>('/bookings', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create booking');
    }

    return response.data;
  }

  /**
   * Update a booking
   */
  async updateBooking(id: string, data: UpdateBookingRequest): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update booking');
    }

    return response.data;
  }

  /**
   * Delete a booking
   */
  async deleteBooking(id: string): Promise<void> {
    const response = await api.delete(`/bookings/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete booking');
    }
  }

  // ============================================================================
  // BOOKING STATUS
  // ============================================================================

  /**
   * Update booking status
   */
  async updateBookingStatus(id: string, data: UpdateBookingStatusRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/status`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update booking status');
    }

    return response.data;
  }

  /**
   * Check in a guest
   */
  async checkIn(id: string, data?: CheckInRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/check-in`, data || {});

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check in');
    }

    return response.data;
  }

  /**
   * Check out a guest
   */
  async checkOut(id: string, data?: CheckOutRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/check-out`, data || {});

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check out');
    }

    return response.data;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string, data: CancelBookingRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/cancel`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to cancel booking');
    }

    return response.data;
  }

  /**
   * Mark as no-show
   */
  async markNoShow(id: string): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/no-show`, {});

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark as no-show');
    }

    return response.data;
  }

  // ============================================================================
  // PAYMENT STATUS
  // ============================================================================

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, data: UpdatePaymentStatusRequest): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${id}/payment`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update payment status');
    }

    return response.data;
  }

  /**
   * Record a payment
   */
  async recordPayment(bookingId: string, data: CreateBookingPaymentRequest): Promise<BookingPayment> {
    const response = await api.post<BookingPayment>(`/bookings/${bookingId}/payments`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to record payment');
    }

    return response.data;
  }

  /**
   * List payments for a booking
   */
  async listPayments(bookingId: string): Promise<BookingPayment[]> {
    const response = await api.get<BookingPayment[]>(`/bookings/${bookingId}/payments`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch payments');
    }

    return response.data;
  }

  /**
   * Verify payment proof
   */
  async verifyPaymentProof(bookingId: string, paymentId: string, data: VerifyPaymentProofRequest): Promise<BookingPayment> {
    const response = await api.post<BookingPayment>(
      `/bookings/${bookingId}/payments/${paymentId}/verify`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to verify payment proof');
    }

    return response.data;
  }

  // ============================================================================
  // GUESTS
  // ============================================================================

  /**
   * Add a guest to a booking
   */
  async addGuest(bookingId: string, data: CreateBookingGuestRequest): Promise<BookingGuest> {
    const response = await api.post<BookingGuest>(`/bookings/${bookingId}/guests`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add guest');
    }

    return response.data;
  }

  /**
   * Update a guest
   */
  async updateGuest(bookingId: string, guestId: string, data: Partial<CreateBookingGuestRequest>): Promise<BookingGuest> {
    const response = await api.patch<BookingGuest>(`/bookings/${bookingId}/guests/${guestId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update guest');
    }

    return response.data;
  }

  /**
   * Remove a guest
   */
  async removeGuest(bookingId: string, guestId: string): Promise<void> {
    const response = await api.delete(`/bookings/${bookingId}/guests/${guestId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove guest');
    }
  }

  // ============================================================================
  // REFUNDS
  // ============================================================================

  /**
   * Request a refund
   */
  async requestRefund(bookingId: string, data: CreateRefundRequestRequest): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(`/bookings/${bookingId}/refund`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to request refund');
    }

    return response.data;
  }

  /**
   * Review a refund request
   */
  async reviewRefund(bookingId: string, refundId: string, data: ReviewRefundRequest): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/bookings/${bookingId}/refund/${refundId}/review`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to review refund');
    }

    return response.data;
  }

  /**
   * Process a refund
   */
  async processRefund(bookingId: string, refundId: string, data?: ProcessRefundRequest): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/bookings/${bookingId}/refund/${refundId}/process`,
      data || {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process refund');
    }

    return response.data;
  }

  // ============================================================================
  // CONFLICT CHECK
  // ============================================================================

  /**
   * Check for booking conflicts
   */
  async checkConflicts(data: ConflictCheckRequest): Promise<ConflictCheckResponse> {
    const response = await api.post<ConflictCheckResponse>('/bookings/check-conflicts', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check conflicts');
    }

    return response.data;
  }

  // ============================================================================
  // STATS & CALENDAR
  // ============================================================================

  /**
   * Get booking stats
   */
  async getStats(propertyId?: string): Promise<BookingStats> {
    const url = propertyId ? `/bookings/stats?property_id=${propertyId}` : '/bookings/stats';
    const response = await api.get<BookingStats>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch booking stats');
    }

    return response.data;
  }

  /**
   * Get calendar entries
   * @param includeCancelled - Whether to include cancelled bookings (default: false)
   */
  async getCalendarEntries(
    propertyId: string,
    startDate: string,
    endDate: string,
    includeCancelled: boolean = false
  ): Promise<BookingCalendarEntry[]> {
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    if (includeCancelled) {
      queryParams.set('include_cancelled', 'true');
    }

    const response = await api.get<BookingCalendarEntry[]>(`/properties/${propertyId}/calendar?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch calendar entries');
    }

    return response.data;
  }

  // ============================================================================
  // GUEST CHECKOUT FLOW
  // ============================================================================

  /**
   * Initiate a guest checkout (public)
   */
  async initiateCheckout(data: InitiateCheckoutRequest): Promise<{ booking_id: string; pricing: CheckoutPricingResponse }> {
    const response = await api.post<{ booking_id: string; pricing: CheckoutPricingResponse }>(
      '/checkout/initiate',
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to initiate checkout');
    }

    return response.data;
  }

  /**
   * Complete checkout
   */
  async completeCheckout(data: CompleteCheckoutRequest): Promise<CompleteCheckoutResponse> {
    const response = await api.post<CompleteCheckoutResponse>('/checkout/complete', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to complete checkout');
    }

    return response.data;
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const response = await api.post<ValidateCouponResponse>('/checkout/validate-coupon', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to validate coupon');
    }

    return response.data;
  }

  // ============================================================================
  // INVOICE
  // ============================================================================

  /**
   * Generate invoice for a booking
   */
  async generateInvoice(bookingId: string): Promise<{ invoice_id: string; invoice_url: string }> {
    const response = await api.post<{ invoice_id: string; invoice_url: string }>(
      `/bookings/${bookingId}/invoice`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate invoice');
    }

    return response.data;
  }

  /**
   * Send booking confirmation email
   */
  async sendConfirmationEmail(bookingId: string): Promise<void> {
    const response = await api.post(`/bookings/${bookingId}/send-confirmation`, {});

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send confirmation email');
    }
  }

  // ============================================================================
  // NOTES
  // ============================================================================

  /**
   * Update internal notes
   */
  async updateInternalNotes(bookingId: string, notes: string): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${bookingId}/notes`, {
      notes: notes,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update notes');
    }

    return response.data;
  }

  // ============================================================================
  // BOOKING DETAILS MANAGEMENT (Dates, Rooms, Add-ons)
  // ============================================================================

  /**
   * Update booking dates with automatic price recalculation
   */
  async updateBookingDates(
    bookingId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<BookingWithDetails> {
    const response = await api.put<BookingWithDetails>(`/bookings/${bookingId}/dates`, {
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update booking dates');
    }

    return response.data;
  }

  /**
   * Add a room to a booking
   */
  async addBookingRoom(bookingId: string, data: CreateBookingRoomRequest): Promise<BookingWithDetails> {
    const response = await api.post<BookingWithDetails>(`/bookings/${bookingId}/rooms`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add room to booking');
    }

    return response.data;
  }

  /**
   * Update a room in a booking
   */
  async updateBookingRoom(
    bookingId: string,
    roomId: string,
    data: { adults?: number; children?: number; children_ages?: number[] }
  ): Promise<BookingWithDetails> {
    const response = await api.put<BookingWithDetails>(`/bookings/${bookingId}/rooms/${roomId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update room');
    }

    return response.data;
  }

  /**
   * Remove a room from a booking
   */
  async removeBookingRoom(bookingId: string, roomId: string): Promise<BookingWithDetails> {
    const response = await api.delete<BookingWithDetails>(`/bookings/${bookingId}/rooms/${roomId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove room from booking');
    }

    return response.data;
  }

  /**
   * Add an addon to a booking
   */
  async addBookingAddon(bookingId: string, data: CreateBookingAddonRequest): Promise<BookingWithDetails> {
    const response = await api.post<BookingWithDetails>(`/bookings/${bookingId}/addons`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add addon to booking');
    }

    return response.data;
  }

  /**
   * Update an addon in a booking
   */
  async updateBookingAddon(
    bookingId: string,
    addonId: string,
    data: { quantity: number }
  ): Promise<BookingWithDetails> {
    const response = await api.put<BookingWithDetails>(`/bookings/${bookingId}/addons/${addonId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update addon');
    }

    return response.data;
  }

  /**
   * Remove an addon from a booking
   */
  async removeBookingAddon(bookingId: string, addonId: string): Promise<BookingWithDetails> {
    const response = await api.delete<BookingWithDetails>(`/bookings/${bookingId}/addons/${addonId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove addon from booking');
    }

    return response.data;
  }

  // ============================================================================
  // RECEIPT DOWNLOAD
  // ============================================================================

  /**
   * Download receipt for a payment
   */
  async downloadPaymentReceipt(bookingId: string, paymentId: string): Promise<string> {
    const response = await api.get<{ download_url: string }>(
      `/bookings/${bookingId}/payments/${paymentId}/receipt`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get receipt download URL');
    }

    return response.data.download_url;
  }

  // ============================================================================
  // BOOKING HISTORY & TIMELINE
  // ============================================================================

  /**
   * Get comprehensive timeline of all booking events
   */
  async getBookingHistory(bookingId: string): Promise<TimelineEvent[]> {
    const response = await api.get<TimelineEvent[]>(`/bookings/${bookingId}/history`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch booking history');
    }

    return response.data;
  }

  // ============================================================================
  // PAYMENT PROOF UPLOAD & VERIFICATION (EFT)
  // ============================================================================

  /**
   * Upload payment proof for EFT booking
   * @param bookingId Booking ID
   * @param data Upload data with file URL and metadata
   * @returns Payment proof response
   */
  async uploadPaymentProof(
    bookingId: string,
    data: UploadPaymentProofRequest
  ): Promise<PaymentProofResponse> {
    const response = await api.post<PaymentProofResponse>(
      `/bookings/${bookingId}/payment-proof`,
      data
    );
    return response.data;
  }

  /**
   * Verify EFT payment proof (Property Owner)
   * @param bookingId Booking ID
   * @param data Verification data (approve/reject)
   * @returns Verification result with updated booking
   */
  async verifyEFTPayment(
    bookingId: string,
    data: VerifyEFTPaymentRequest
  ): Promise<{ success: boolean; booking: Booking; message: string }> {
    const response = await api.put<{ success: boolean; booking: Booking; message: string }>(
      `/bookings/${bookingId}/verify-payment`,
      data
    );
    return response.data;
  }
}

export const bookingService = new BookingService();
