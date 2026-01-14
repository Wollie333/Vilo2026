import { api } from './api.service';
import type {
  AddOn,
  CreateAddOnData,
  UpdateAddOnData,
  AddonListParams,
  AddonListResponse,
  AddonPriceCalculation,
  AddonPriceCalculationRequest,
} from '@/types/addon.types';

// ============================================================================
// Add-on Service
// ============================================================================

class AddonService {
  // --------------------------------------------------------------------------
  // Get all add-ons with optional filters
  // --------------------------------------------------------------------------
  async getAddOns(params: AddonListParams = {}): Promise<AddonListResponse> {
    const queryParams = new URLSearchParams();

    if (params.property_id) queryParams.append('property_id', params.property_id);
    if (params.type) queryParams.append('type', params.type);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params.room_id) queryParams.append('room_id', params.room_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = `/addons${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<AddonListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch add-ons');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Get a single add-on by ID
  // --------------------------------------------------------------------------
  async getAddOn(id: string): Promise<AddOn> {
    const response = await api.get<AddOn>(`/addons/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch add-on');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Get all add-ons for a property
  // --------------------------------------------------------------------------
  async getPropertyAddOns(propertyId: string, includeInactive = false): Promise<AddOn[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await api.get<AddOn[]>(`/properties/${propertyId}/addons${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch property add-ons');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Get add-ons available for a specific room
  // --------------------------------------------------------------------------
  async getAddOnsForRoom(roomId: string, propertyId: string): Promise<AddOn[]> {
    const response = await api.get<AddOn[]>(`/rooms/${roomId}/addons?property_id=${propertyId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch room add-ons');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Create a new add-on
  // --------------------------------------------------------------------------
  async createAddOn(data: CreateAddOnData): Promise<AddOn> {
    const response = await api.post<AddOn>('/addons', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create add-on');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Update an add-on
  // --------------------------------------------------------------------------
  async updateAddOn(id: string, data: UpdateAddOnData): Promise<AddOn> {
    const response = await api.put<AddOn>(`/addons/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update add-on');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Delete an add-on
  // --------------------------------------------------------------------------
  async deleteAddOn(id: string, hardDelete = false): Promise<void> {
    const params = hardDelete ? '?hard=true' : '';
    const response = await api.delete(`/addons/${id}${params}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete add-on');
    }
  }

  // --------------------------------------------------------------------------
  // Calculate add-on price
  // --------------------------------------------------------------------------
  async calculatePrice(
    addonId: string,
    request: AddonPriceCalculationRequest
  ): Promise<AddonPriceCalculation> {
    const response = await api.post<AddonPriceCalculation>(
      `/addons/${addonId}/calculate-price`,
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to calculate add-on price');
    }

    return response.data;
  }

  // --------------------------------------------------------------------------
  // Upload add-on image
  // --------------------------------------------------------------------------
  async uploadImage(addonId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/addons/${addonId}/image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload image');
    }

    return response.data.imageUrl;
  }

  // --------------------------------------------------------------------------
  // Delete add-on image
  // --------------------------------------------------------------------------
  async deleteImage(addonId: string): Promise<void> {
    const response = await api.delete(`/addons/${addonId}/image`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete image');
    }
  }

  // --------------------------------------------------------------------------
  // Assign a single add-on to a room
  // --------------------------------------------------------------------------
  async assignAddonToRoom(roomId: string, addonId: string): Promise<void> {
    const response = await api.post(`/addons/rooms/${roomId}/assign`, {
      addon_id: addonId,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to assign add-on to room');
    }
  }

  // --------------------------------------------------------------------------
  // Unassign a single add-on from a room
  // --------------------------------------------------------------------------
  async unassignAddonFromRoom(roomId: string, addonId: string): Promise<void> {
    const response = await api.delete(`/addons/rooms/${roomId}/unassign/${addonId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unassign add-on from room');
    }
  }

  // --------------------------------------------------------------------------
  // Sync room add-ons (bulk replace all assignments)
  // --------------------------------------------------------------------------
  async syncRoomAddons(roomId: string, addonIds: string[]): Promise<void> {
    const response = await api.post(`/addons/rooms/${roomId}/sync`, {
      addon_ids: addonIds,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to sync room add-ons');
    }
  }
}

export const addonService = new AddonService();
