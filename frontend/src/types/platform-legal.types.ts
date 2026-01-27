/**
 * Platform Legal Documents Types
 *
 * Types for managing Vilo SaaS platform-level legal documents
 * (completely separate from property-level legal documents)
 */

export type PlatformLegalDocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'cookie_policy'
  | 'acceptable_use';

export interface PlatformLegalDocument {
  id: string;
  document_type: PlatformLegalDocumentType;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformLegalDocumentData {
  document_type: PlatformLegalDocumentType;
  title: string;
  content: string;
  version: string;
  is_active?: boolean;
  effective_date?: string;
}

export interface UpdatePlatformLegalDocumentData {
  title?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
  effective_date?: string;
}

export interface PlatformLegalDocumentTypeConfig {
  value: PlatformLegalDocumentType;
  label: string;
  description: string;
}
