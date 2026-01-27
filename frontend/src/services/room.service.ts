import { api } from './api.service';
import type {
  Room,
  RoomWithDetails,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomListParams,
  RoomListResponse,
  RoomLimitInfo,
  RoomBed,
  CreateRoomBedRequest,
  UpdateRoomBedRequest,
  SeasonalRate,
  CreateSeasonalRateRequest,
  UpdateSeasonalRateRequest,
  RoomPromotion,
  CreateRoomPromotionRequest,
  UpdateRoomPromotionRequest,
  AddOn,
  CreateAddOnRequest,
  UpdateAddOnRequest,
  AvailabilityBlock,
  CreateAvailabilityBlockRequest,
  PriceCalculationRequest,
  PriceCalculationResponse,
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  PauseRoomRequest,
} from '@/types/room.types';

class RoomService {
  // ============================================================================
  // ROOM CRUD
  // ============================================================================

  /**
   * List rooms with filters
   */
  async listRooms(params?: RoomListParams): Promise<RoomListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.property_id) queryParams.set('property_id', params.property_id);
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.is_paused !== undefined) queryParams.set('is_paused', String(params.is_paused));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.pricing_mode) queryParams.set('pricing_mode', params.pricing_mode);
    if (params?.min_price !== undefined) queryParams.set('min_price', String(params.min_price));
    if (params?.max_price !== undefined) queryParams.set('max_price', String(params.max_price));
    if (params?.min_guests !== undefined) queryParams.set('min_guests', String(params.min_guests));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/rooms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<RoomListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch rooms');
    }

    return response.data;
  }

  /**
   * List rooms for a specific property
   */
  async listPropertyRooms(propertyId: string, params?: Omit<RoomListParams, 'property_id'>): Promise<RoomListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.is_paused !== undefined) queryParams.set('is_paused', String(params.is_paused));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/properties/${propertyId}/rooms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<RoomListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch property rooms');
    }

    return response.data;
  }

  /**
   * Get a single room by ID
   */
  async getRoom(id: string): Promise<RoomWithDetails> {
    const response = await api.get<RoomWithDetails>(`/rooms/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch room');
    }

    return response.data;
  }

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const response = await api.post<Room>('/rooms', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create room');
    }

    return response.data;
  }

  /**
   * Update a room
   */
  async updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
    const response = await api.put<Room>(`/rooms/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update room');
    }

    return response.data;
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<void> {
    const response = await api.delete(`/rooms/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete room');
    }
  }

  // ============================================================================
  // ROOM STATUS
  // ============================================================================

  /**
   * Pause a room (temporarily disable)
   */
  async pauseRoom(id: string, data?: PauseRoomRequest): Promise<Room> {
    const response = await api.post<Room>(`/rooms/${id}/pause`, data || {});

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to pause room');
    }

    return response.data;
  }

  /**
   * Unpause a room
   */
  async unpauseRoom(id: string): Promise<Room> {
    const response = await api.post<Room>(`/rooms/${id}/unpause`, {});

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to unpause room');
    }

    return response.data;
  }

  // ============================================================================
  // ROOM LIMIT
  // ============================================================================

  /**
   * Get room limit info for the current user
   */
  async getRoomLimit(): Promise<RoomLimitInfo> {
    const response = await api.get<RoomLimitInfo>('/rooms/limits');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch room limit');
    }

    return response.data;
  }

  // ============================================================================
  // BED CONFIGURATION
  // ============================================================================

  /**
   * Add a bed to a room
   */
  async addBed(roomId: string, data: CreateRoomBedRequest): Promise<RoomBed> {
    const response = await api.post<RoomBed>(`/rooms/${roomId}/beds`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add bed');
    }

    return response.data;
  }

  /**
   * Update a bed
   */
  async updateBed(roomId: string, bedId: string, data: UpdateRoomBedRequest): Promise<RoomBed> {
    const response = await api.patch<RoomBed>(`/rooms/${roomId}/beds/${bedId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update bed');
    }

    return response.data;
  }

  /**
   * Delete a bed
   */
  async deleteBed(roomId: string, bedId: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/beds/${bedId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete bed');
    }
  }

  // ============================================================================
  // SEASONAL RATES
  // ============================================================================

  /**
   * Add a seasonal rate to a room
   */
  async addSeasonalRate(roomId: string, data: CreateSeasonalRateRequest): Promise<SeasonalRate> {
    const response = await api.post<SeasonalRate>(`/rooms/${roomId}/rates`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add seasonal rate');
    }

    return response.data;
  }

  /**
   * Update a seasonal rate
   */
  async updateSeasonalRate(roomId: string, rateId: string, data: UpdateSeasonalRateRequest): Promise<SeasonalRate> {
    const response = await api.put<SeasonalRate>(`/rooms/${roomId}/rates/${rateId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update seasonal rate');
    }

    return response.data;
  }

  /**
   * Delete a seasonal rate
   */
  async deleteSeasonalRate(roomId: string, rateId: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/rates/${rateId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete seasonal rate');
    }
  }

  // ============================================================================
  // PROMOTIONS
  // ============================================================================

  /**
   * Add a promotion to a room
   */
  async addPromotion(roomId: string, data: CreateRoomPromotionRequest): Promise<RoomPromotion> {
    const response = await api.post<RoomPromotion>(`/rooms/${roomId}/promotions`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add promotion');
    }

    return response.data;
  }

  /**
   * Update a promotion
   */
  async updatePromotion(roomId: string, promotionId: string, data: UpdateRoomPromotionRequest): Promise<RoomPromotion> {
    const response = await api.put<RoomPromotion>(`/rooms/${roomId}/promotions/${promotionId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update promotion');
    }

    return response.data;
  }

  /**
   * Delete a promotion
   */
  async deletePromotion(roomId: string, promotionId: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/promotions/${promotionId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete promotion');
    }
  }

  // ============================================================================
  // ADD-ONS (Property-level)
  // ============================================================================

  /**
   * List add-ons for a property
   */
  async listPropertyAddOns(propertyId: string): Promise<AddOn[]> {
    const response = await api.get<AddOn[]>(`/properties/${propertyId}/addons`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch add-ons');
    }

    return response.data;
  }

  /**
   * Create an add-on for a property
   */
  async createAddOn(propertyId: string, data: CreateAddOnRequest): Promise<AddOn> {
    const response = await api.post<AddOn>(`/properties/${propertyId}/addons`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create add-on');
    }

    return response.data;
  }

  /**
   * Update an add-on
   */
  async updateAddOn(propertyId: string, addOnId: string, data: UpdateAddOnRequest): Promise<AddOn> {
    const response = await api.patch<AddOn>(`/properties/${propertyId}/addons/${addOnId}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update add-on');
    }

    return response.data;
  }

  /**
   * Delete an add-on
   */
  async deleteAddOn(propertyId: string, addOnId: string): Promise<void> {
    const response = await api.delete(`/properties/${propertyId}/addons/${addOnId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete add-on');
    }
  }

  // ============================================================================
  // AVAILABILITY BLOCKS
  // ============================================================================

  /**
   * List availability blocks for a room
   */
  async listAvailabilityBlocks(roomId: string): Promise<AvailabilityBlock[]> {
    const response = await api.get<AvailabilityBlock[]>(`/rooms/${roomId}/availability-blocks`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch availability blocks');
    }

    return response.data;
  }

  /**
   * Create an availability block
   */
  async createAvailabilityBlock(roomId: string, data: CreateAvailabilityBlockRequest): Promise<AvailabilityBlock> {
    const response = await api.post<AvailabilityBlock>(`/rooms/${roomId}/availability-blocks`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create availability block');
    }

    return response.data;
  }

  /**
   * Delete an availability block
   */
  async deleteAvailabilityBlock(roomId: string, blockId: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/availability-blocks/${blockId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete availability block');
    }
  }

  // ============================================================================
  // PRICING & AVAILABILITY
  // ============================================================================

  /**
   * Calculate price for a room
   */
  async calculatePrice(data: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    const response = await api.post<PriceCalculationResponse>(`/rooms/${data.room_id}/price`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to calculate price');
    }

    return response.data;
  }

  /**
   * Check room availability
   */
  async checkAvailability(data: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> {
    // Backend expects check_in/check_out format (not check_in_date/check_out_date)
    // and doesn't need room_id in body since it's in the URL
    const requestBody = {
      check_in: data.check_in_date,
      check_out: data.check_out_date,
    };

    // Use public endpoint for guest bookings (no authentication required)
    const response = await api.post<AvailabilityCheckResponse>(`/rooms/${data.room_id}/availability/public`, requestBody);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check availability');
    }

    return response.data;
  }

  // ============================================================================
  // IMAGE UPLOADS
  // ============================================================================

  /**
   * Upload a featured image for a room
   */
  async uploadFeaturedImage(roomId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/rooms/${roomId}/featured-image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload featured image');
    }

    return response.data.imageUrl;
  }

  /**
   * Delete the featured image for a room
   */
  async deleteFeaturedImage(roomId: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/featured-image`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete featured image');
    }
  }

  /**
   * Upload a gallery image for a room
   */
  async uploadGalleryImage(roomId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/rooms/${roomId}/gallery-image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload gallery image');
    }

    return response.data.imageUrl;
  }

  /**
   * Delete a gallery image for a room
   */
  async deleteGalleryImage(roomId: string, imageUrl: string): Promise<void> {
    const response = await api.delete(`/rooms/${roomId}/gallery-image`, {
      imageUrl,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete gallery image');
    }
  }
}

export const roomService = new RoomService();
