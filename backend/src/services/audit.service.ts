/**
 * Audit Service
 * Handles audit logging for system actions
 *
 * Note: This is a stub implementation. Full audit logging can be implemented later.
 */

interface AuditLogEntry {
  action: string;
  entity_type?: string;
  entity_id?: string;
  resource?: string;
  resource_id?: string;
  actor_id?: string;
  old_values?: any;
  new_values?: any;
  old_data?: any;
  new_data?: any;
  metadata?: any;
}

/**
 * Create an audit log entry
 * Currently a no-op stub to prevent errors
 */
export async function createAuditLog(entry: AuditLogEntry | string, ...args: any[]): Promise<void> {
  // Stub implementation - does nothing
  // In production, this would write to audit_log table

  // Optional: Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const action = typeof entry === 'string' ? entry : entry.action;
    console.log(`[AUDIT] ${action}`, args.length > 0 ? args : '');
  }

  return Promise.resolve();
}
