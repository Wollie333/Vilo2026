import { api } from './api.service';

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AuditService {
  async listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params = new URLSearchParams();

    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.actorId) params.append('actorId', filters.actorId);
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<AuditLogResponse>(`/api/audit?${params.toString()}`);

    if (!response.success) {
      console.error('listAuditLogs API error:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch audit logs');
    }

    // Handle case where data is empty
    if (!response.data) {
      return {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }

    return response.data;
  }
}

export const auditService = new AuditService();
