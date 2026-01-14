/**
 * Booking Wizard Service
 *
 * Handles guest booking flow with automatic account creation
 */

import { getAdminClient } from '../config/supabase';
import type {
  BookingWizardData,
  PricingBreakdown,
} from '../types/booking-wizard.types';

const supabase = getAdminClient();

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
      addon_type: 'per_booking' | 'per_night' | 'per_person' | 'per_room';
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
      switch (addon.addon_type) {
        case 'per_booking':
          total = addon.unit_price * addon.quantity;
          break;
        case 'per_night':
          total = addon.unit_price * addon.quantity * data.nights;
          break;
        case 'per_person':
          total = addon.unit_price * addon.quantity * data.total_guests;
          break;
        case 'per_room':
          total = addon.unit_price * addon.quantity * data.room_count;
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

    // Calculate total nights
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    const total_nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate pricing breakdown
    const room_total = data.rooms.reduce((sum, room) => sum + (room.unit_price * total_nights), 0);
    const addons_total = data.addons.reduce((sum, addon) => sum + addon.total_price, 0);
    const subtotal = room_total + addons_total;

    // Calculate guest counts
    const adults = data.rooms.reduce((sum, room) => sum + room.adults, 0);
    const children = data.rooms.reduce((sum, room) => sum + room.children, 0);
    const children_ages = data.rooms.flatMap((room) => room.children_ages || []);

    // Create pending booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_reference,
        property_id: data.property_id,
        guest_name: `${data.guest.firstName} ${data.guest.lastName}`,
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
      payment_method: 'online', // TODO: Get from payment data
      payment_status: 'completed',
      amount: 0, // TODO: Get from booking
      currency: 'ZAR', // TODO: Get from booking
      paid_at: new Date().toISOString(),
    });

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      booking_status: 'confirmed',
    };
  }
}

export const bookingWizardService = new BookingWizardService();
