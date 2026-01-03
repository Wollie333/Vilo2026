import { getAdminClient } from '../config/supabase';
import { logger } from '../utils/logger';

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.approved'
  | 'user.suspended'
  | 'user.activated'
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset'
  | 'user.email_verified'
  | 'user.avatar_updated'
  | 'role.assigned'
  | 'role.removed'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'permission.granted'
  | 'permission.denied'
  | 'permission.removed'
  | 'property.assigned'
  | 'property.removed';

export type EntityType =
  | 'user'
  | 'role'
  | 'permission'
  | 'property'
  | 'session';

interface AuditLogEntry {
  actor_id: string | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (
  entry: AuditLogEntry
): Promise<void> => {
  try {
    const supabase = getAdminClient();

    const { error } = await supabase.from('audit_log').insert({
      actor_id: entry.actor_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      old_data: entry.old_data || null,
      new_data: entry.new_data || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || null,
    });

    if (error) {
      // Log but don't throw - audit should not break main flow
      logger.error('Failed to create audit log', { error, entry });
    }
  } catch (err) {
    // Log but don't throw
    logger.error('Audit log error', { error: err, entry });
  }
};

/**
 * Create audit log for user actions
 */
export const auditUserAction = async (
  action: AuditAction,
  userId: string,
  actorId: string | null,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null,
  request?: { ip?: string; userAgent?: string }
): Promise<void> => {
  await createAuditLog({
    actor_id: actorId,
    action,
    entity_type: 'user',
    entity_id: userId,
    old_data: oldData,
    new_data: newData,
    ip_address: request?.ip,
    user_agent: request?.userAgent,
  });
};

/**
 * Create audit log for role actions
 */
export const auditRoleAction = async (
  action: AuditAction,
  roleId: string,
  actorId: string,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null
): Promise<void> => {
  await createAuditLog({
    actor_id: actorId,
    action,
    entity_type: 'role',
    entity_id: roleId,
    old_data: oldData,
    new_data: newData,
  });
};

/**
 * Query audit logs with filters
 */
export const getAuditLogs = async (params: {
  entityType?: EntityType;
  entityId?: string;
  actorId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{
  logs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' });

  if (params.entityType) {
    query = query.eq('entity_type', params.entityType);
  }
  if (params.entityId) {
    query = query.eq('entity_id', params.entityId);
  }
  if (params.actorId) {
    query = query.eq('actor_id', params.actorId);
  }
  if (params.action) {
    query = query.eq('action', params.action);
  }
  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const total = count || 0;

  return {
    logs: data || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
