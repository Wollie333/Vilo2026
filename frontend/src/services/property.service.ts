import { api } from './api.service';
import type {
  PropertyWithCompany,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyListParams,
  PropertyListResponse,
  PropertyLimitInfo,
} from '@/types/property.types';

class PropertyService {
  // ============================================================================
  // PROPERTY CRUD
  // ============================================================================

  /**
   * List all properties for the current user
   */
  async getMyProperties(params?: PropertyListParams): Promise<PropertyListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.company_id) queryParams.set('company_id', params.company_id);
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<PropertyListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch properties');
    }

    return response.data;
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: string): Promise<PropertyWithCompany> {
    const response = await api.get<PropertyWithCompany>(`/properties/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch property');
    }

    return response.data;
  }

  /**
   * Get a property by slug (for public access)
   */
  async getPropertyBySlug(slug: string): Promise<PropertyWithCompany> {
    const response = await api.get<PropertyWithCompany>(`/properties/slug/${slug}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Property not found');
    }

    return response.data;
  }

  /**
   * Create a new property
   */
  async createProperty(data: CreatePropertyData): Promise<PropertyWithCompany> {
    const response = await api.post<PropertyWithCompany>('/properties', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create property');
    }

    return response.data;
  }

  /**
   * Update a property
   */
  async updateProperty(id: string, data: UpdatePropertyData): Promise<PropertyWithCompany> {
    const response = await api.patch<PropertyWithCompany>(`/properties/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update property');
    }

    return response.data;
  }

  /**
   * Delete a property
   */
  async deleteProperty(id: string): Promise<void> {
    const response = await api.delete(`/properties/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete property');
    }
  }

  // ============================================================================
  // PROPERTY LIMIT
  // ============================================================================

  /**
   * Get property limit info for the current user
   */
  async getPropertyLimit(): Promise<PropertyLimitInfo> {
    const response = await api.get<PropertyLimitInfo>('/properties/limit');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch property limit');
    }

    return response.data;
  }

  // ============================================================================
  // IMAGE UPLOADS
  // ============================================================================

  /**
   * Upload a featured image for a property
   */
  async uploadFeaturedImage(propertyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/properties/${propertyId}/featured-image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload featured image');
    }

    return response.data.imageUrl;
  }

  /**
   * Delete the featured image for a property
   */
  async deleteFeaturedImage(propertyId: string): Promise<void> {
    const response = await api.delete(`/properties/${propertyId}/featured-image`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete featured image');
    }
  }

  /**
   * Upload a logo for a property
   */
  async uploadLogo(propertyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/properties/${propertyId}/logo`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload logo');
    }

    return response.data.imageUrl;
  }

  /**
   * Delete the logo for a property
   */
  async deleteLogo(propertyId: string): Promise<void> {
    const response = await api.delete(`/properties/${propertyId}/logo`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete logo');
    }
  }

  // ============================================================================
  // GALLERY IMAGES
  // ============================================================================

  /**
   * Upload a gallery image for a property
   */
  async uploadGalleryImage(propertyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.upload<{ imageUrl: string }>(
      `/properties/${propertyId}/gallery-image`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload gallery image');
    }

    return response.data.imageUrl;
  }

  /**
   * Delete a gallery image for a property
   */
  async deleteGalleryImage(propertyId: string, imageUrl: string): Promise<void> {
    const response = await api.delete(`/properties/${propertyId}/gallery-image`, {
      imageUrl,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete gallery image');
    }
  }

  // ============================================================================
  // PUBLIC LISTING
  // ============================================================================

  /**
   * Check if a property meets all requirements for public listing
   */
  async checkListingReadiness(propertyId: string): Promise<{
    ready: boolean;
    missing: string[];
  }> {
    const response = await api.get<{ ready: boolean; missing: string[] }>(
      `/properties/${propertyId}/listing-readiness`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check listing readiness');
    }

    return response.data;
  }

  /**
   * Toggle public listing visibility for a property
   */
  async togglePublicListing(propertyId: string, isListed: boolean): Promise<void> {
    const response = await api.patch<void>(`/properties/${propertyId}/public-listing`, {
      is_listed: isListed,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to toggle public listing');
    }
  }
}

export const propertyService = new PropertyService();
