import { useEffect, useCallback } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';

/**
 * List of button texts/labels that indicate an action (should be blocked)
 * Case-insensitive matching
 */
const ACTION_KEYWORDS = [
  'add',
  'create',
  'new',
  'save',
  'submit',
  'delete',
  'remove',
  'edit',
  'update',
  'confirm',
  'approve',
  'reject',
  'cancel',
  'send',
  'invite',
  'assign',
  'upload',
  'export',
  'import',
  'publish',
  'archive',
];

/**
 * Selectors for elements that should always be allowed (not blocked)
 */
const ALLOWED_SELECTORS = [
  '[data-allow-readonly]', // Explicit allow
  'nav a', // Navigation links
  'aside a', // Sidebar links
  '[role="navigation"] a',
  '.sidebar a',
  'a[href^="/"]', // Internal navigation links (but not buttons styled as links)
];

/**
 * Check if an element or its text contains action keywords
 */
const isActionElement = (element: HTMLElement): boolean => {
  const text = (element.textContent || '').toLowerCase().trim();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const title = (element.getAttribute('title') || '').toLowerCase();

  const combinedText = `${text} ${ariaLabel} ${title}`;

  return ACTION_KEYWORDS.some(keyword => combinedText.includes(keyword));
};

/**
 * Check if element is explicitly allowed
 */
const isAllowedElement = (element: HTMLElement): boolean => {
  return ALLOWED_SELECTORS.some(selector => element.closest(selector));
};

/**
 * Check if element is a navigation link (not an action)
 */
const isNavigationLink = (element: HTMLElement): boolean => {
  // Check if it's an anchor tag with href
  if (element.tagName === 'A') {
    const href = element.getAttribute('href');
    // Allow navigation links but not "#" or "javascript:" links
    if (href && href.startsWith('/') && !isActionElement(element)) {
      return true;
    }
  }
  return false;
};

/**
 * Check if element should be blocked
 */
const shouldBlockElement = (element: HTMLElement): boolean => {
  // Never block explicitly allowed elements
  if (isAllowedElement(element)) return false;

  // Never block navigation links
  if (isNavigationLink(element)) return false;

  // Block buttons and submit inputs
  const tagName = element.tagName.toUpperCase();
  const type = element.getAttribute('type')?.toLowerCase();
  const role = element.getAttribute('role')?.toLowerCase();

  // Direct button or submit
  if (tagName === 'BUTTON') return true;
  if (tagName === 'INPUT' && (type === 'submit' || type === 'button')) return true;
  if (role === 'button') return true;

  // Check parent button (for icons inside buttons)
  const parentButton = element.closest('button, [role="button"], input[type="submit"]');
  if (parentButton) return true;

  return false;
};

/**
 * Global interceptor that blocks actions when in read-only mode.
 * Automatically intercepts button clicks and form submissions.
 */
export const ReadOnlyInterceptor: React.FC = () => {
  const { accessStatus, overlayDismissed, openPaymentModal } = useSubscription();

  // Determine if we should intercept
  const shouldIntercept =
    accessStatus?.accessMode === 'readonly' &&
    overlayDismissed &&
    !accessStatus?.hasFullAccess;

  const handleClick = useCallback((event: MouseEvent) => {
    if (!shouldIntercept) return;

    const target = event.target as HTMLElement;

    if (shouldBlockElement(target)) {
      event.preventDefault();
      event.stopPropagation();

      // Try to get action name from button text
      const button = target.closest('button, [role="button"]') as HTMLElement;
      const actionName = button?.textContent?.trim() || 'perform this action';

      openPaymentModal(actionName);
    }
  }, [shouldIntercept, openPaymentModal]);

  const handleSubmit = useCallback((event: Event) => {
    if (!shouldIntercept) return;

    event.preventDefault();
    event.stopPropagation();

    openPaymentModal('submit this form');
  }, [shouldIntercept, openPaymentModal]);

  useEffect(() => {
    if (!shouldIntercept) return;

    // Capture phase to intercept before handlers
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, [shouldIntercept, handleClick, handleSubmit]);

  // This component doesn't render anything
  return null;
};
