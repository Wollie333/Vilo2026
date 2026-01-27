export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'PAYMENT_LOCK'
  | 'REFUND_LOCK'
  | 'NOT_IMPLEMENTED'
  | 'DATABASE_ERROR'
  | 'INVALID_STATUS_TRANSITION'
  | 'INVALID_PAYMENT_TRANSITION'
  | 'CONFIGURATION_REQUIRED'
  | 'TEMPLATE_REQUIRED'
  | 'EXTERNAL_API_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}
