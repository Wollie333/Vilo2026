/**
 * Supabase Storage Utilities
 * Helper functions for uploading files to Supabase Storage via backend API
 */

import { api } from '@/services/api.service';

export interface UploadOptions {
  bucket?: string;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a file to Supabase Storage via backend API
 * @returns Public URL of the uploaded file
 */
export async function uploadToStorage({
  bucket = 'property-assets',
  path,
  file,
  onProgress,
}: UploadOptions): Promise<string> {
  try {
    // Get API base URL (fallback to window.location.origin for dev)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const uploadUrl = `${apiBaseUrl}/api/upload`;

    console.log('📤 [UPLOAD] Starting file upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type,
      bucket,
      path,
      uploadUrl,
    });

    // Optional: Report initial progress
    onProgress?.(0);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    // Get current access token
    const accessToken = api.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated. Please log in and try again.');
    }

    console.log('📤 [UPLOAD] Auth token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'Missing');

    // Upload via backend API (uses authenticated session)
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        // Don't set Content-Type - browser will set it with boundary for FormData
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    console.log('📤 [UPLOAD] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      console.error('📤 [UPLOAD] Upload failed:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();
    console.log('📤 [UPLOAD] Upload successful:', result);

    // Optional: Report completion
    onProgress?.(100);

    if (!result.success || !result.data?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('✅ [UPLOAD] File uploaded successfully:', result.data.publicUrl);
    return result.data.publicUrl;
  } catch (error) {
    console.error('❌ [UPLOAD] Storage upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
}

/**
 * Delete a file from Supabase Storage via backend API
 */
export async function deleteFromStorage({
  bucket = 'property-assets',
  path,
}: {
  bucket?: string;
  path: string;
}): Promise<void> {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const accessToken = api.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated. Please log in and try again.');
    }

    const response = await fetch(`${apiBaseUrl}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Delete failed' } }));
      throw new Error(errorData.error?.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Storage delete error:', error);
    throw error instanceof Error ? error : new Error('Delete failed');
  }
}

/**
 * Extract path from Supabase Storage URL
 * Example: https://xyz.supabase.co/storage/v1/object/public/bucket/path/file.png
 * Returns: path/file.png
 */
export function extractPathFromUrl(url: string, bucket: string = 'property-assets'): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/object/public/${bucket}/(.+)$`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
