import type { InvoiceStatus } from '@/types/invoice.types';

export interface PaymentHistoryListProps {
  /**
   * Optional class name for the container
   */
  className?: string;

  /**
   * Maximum number of invoices to display per page
   * @default 10
   */
  pageSize?: number;

  /**
   * Whether to show a compact version
   */
  compact?: boolean;

  /**
   * Optional filter by status
   */
  statusFilter?: InvoiceStatus;

  /**
   * Optional callback when an invoice is downloaded
   */
  onDownload?: (invoiceId: string) => void;
}

export interface PaymentHistoryItemProps {
  /**
   * Invoice ID
   */
  id: string;

  /**
   * Invoice number (e.g., INV-202601-0001)
   */
  invoiceNumber: string;

  /**
   * Date of the invoice
   */
  date: string;

  /**
   * Total amount in cents
   */
  amountCents: number;

  /**
   * Currency code (e.g., ZAR)
   */
  currency: string;

  /**
   * Invoice status
   */
  status: InvoiceStatus;

  /**
   * Description of what was purchased
   */
  description?: string;

  /**
   * Whether the item is compact
   */
  compact?: boolean;

  /**
   * Callback when download is clicked
   */
  onDownload: () => void;

  /**
   * Whether download is in progress
   */
  isDownloading?: boolean;
}
