/**
 * Upload Controller
 * Handles file uploads to Supabase Storage
 */

import { Request, Response } from 'express';
import { getAdminClient } from '../config/supabase';

export const uploadController = {
  /**
   * Upload a file to Supabase Storage
   * POST /api/upload
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      console.log('📤 [BACKEND UPLOAD] Request received');
      console.log('📤 [BACKEND UPLOAD] Headers:', {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'Missing',
      });
      console.log('📤 [BACKEND UPLOAD] Body:', req.body);
      console.log('📤 [BACKEND UPLOAD] File:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
      } : 'No file');

      const file = req.file;

      if (!file) {
        console.error('❌ [BACKEND UPLOAD] No file provided in request');
        res.status(400).json({
          success: false,
          error: { message: 'No file provided' },
        });
        return;
      }

      const { bucket = 'property-assets', path } = req.body;

      if (!path) {
        console.error('❌ [BACKEND UPLOAD] No path provided');
        res.status(400).json({
          success: false,
          error: { message: 'File path is required' },
        });
        return;
      }

      console.log('📤 [BACKEND UPLOAD] Uploading to Supabase:', { bucket, path });

      // Get admin client (uses service role key, bypasses RLS)
      const supabase = getAdminClient();

      // Upload to Supabase Storage using service role (bypasses RLS)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('❌ [BACKEND UPLOAD] Supabase upload error:', error);
        res.status(500).json({
          success: false,
          error: { message: `Upload failed: ${error.message}` },
        });
        return;
      }

      console.log('✅ [BACKEND UPLOAD] File uploaded to Supabase:', data.path);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('✅ [BACKEND UPLOAD] Public URL generated:', publicUrlData.publicUrl);

      res.status(200).json({
        success: true,
        data: {
          path: data.path,
          publicUrl: publicUrlData.publicUrl,
        },
      });
    } catch (error: any) {
      console.error('❌ [BACKEND UPLOAD] Upload controller error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Upload failed' },
      });
    }
  },

  /**
   * Delete a file from Supabase Storage
   * DELETE /api/upload
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { bucket = 'property-assets', path } = req.body;

      if (!path) {
        res.status(400).json({
          success: false,
          error: { message: 'File path is required' },
        });
        return;
      }

      // Get admin client (uses service role key, bypasses RLS)
      const supabase = getAdminClient();

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        res.status(500).json({
          success: false,
          error: { message: `Delete failed: ${error.message}` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { message: 'File deleted successfully' },
      });
    } catch (error: any) {
      console.error('Delete controller error:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Delete failed' },
      });
    }
  },
};
