/**
 * Dashboard Types Configuration
 *
 * Vilo uses a single dashboard layout that renders different menu tabs
 * and functionality based on user role. There are 4 dashboard types:
 *
 * 1. SaaS Dashboard - Main super admin dashboard
 * 2. Tenant Dashboard - {Tenant Name} Dashboard for property managers
 * 3. Customer Dashboard - {Customer Name} Dashboard for customer portal
 * 4. Affiliate Dashboard - For affiliate partners
 */

export const DASHBOARD_TYPES = {
  SAAS: {
    id: 'saas',
    label: 'SaaS Dashboard',
    description: 'Main super admin dashboard for platform management',
  },
  TENANT: {
    id: 'tenant',
    labelTemplate: '{tenantName} Dashboard',
    description: 'Tenant-specific dashboard for property managers',
  },
  CUSTOMER: {
    id: 'customer',
    labelTemplate: '{customerName} Dashboard',
    description: 'Customer portal dashboard for guests',
  },
  AFFILIATE: {
    id: 'affiliate',
    label: 'Affiliate Dashboard',
    description: 'Dashboard for affiliate partners',
  },
} as const;

export type DashboardType = keyof typeof DASHBOARD_TYPES;

// Current active dashboard (will be dynamic based on user role in the future)
export const CURRENT_DASHBOARD = DASHBOARD_TYPES.SAAS;

/**
 * Get the display label for a dashboard type
 * For dynamic labels (Tenant/Customer), pass the name as the second argument
 */
export function getDashboardLabel(
  type: DashboardType,
  name?: string
): string {
  const dashboard = DASHBOARD_TYPES[type];

  if ('label' in dashboard) {
    return dashboard.label;
  }

  if ('labelTemplate' in dashboard && name) {
    if (type === 'TENANT') {
      return dashboard.labelTemplate.replace('{tenantName}', name);
    }
    if (type === 'CUSTOMER') {
      return dashboard.labelTemplate.replace('{customerName}', name);
    }
  }

  // Fallback
  return `${type} Dashboard`;
}
