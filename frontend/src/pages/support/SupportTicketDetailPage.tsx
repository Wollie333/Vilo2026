import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Select, Spinner, Input, Alert } from '@/components/ui';
import { supportService } from '@/services';
import { useToast } from '@/context/NotificationContext';
import type {
  SupportTicketWithContext,
  TicketStatus,
  TicketPriority,
  SupportCannedResponse,
  SupportInternalNote,
} from '@/types/support.types';

// ============================================================================
// ICONS
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NoteIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_customer', label: 'Waiting on Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<SupportTicketWithContext | null>(null);
  const [cannedResponses, setCannedResponses] = useState<SupportCannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
      loadCannedResponses();
    }
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await supportService.getTicketWithContext(id);
      setTicket(data);
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to load ticket' });
      navigate('/manage/chat/support');
    } finally {
      setLoading(false);
    }
  };

  const loadCannedResponses = async () => {
    try {
      const data = await supportService.listCannedResponses({ is_active: true });
      setCannedResponses(data);
    } catch (error) {
      console.error('Failed to load canned responses:', error);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!id) return;

    try {
      setUpdating(true);
      await supportService.updateTicket(id, { status });
      toast({ variant: 'success', title: 'Ticket status updated' });
      await loadTicket();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to update ticket status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!id) return;

    try {
      setUpdating(true);
      await supportService.updateTicket(id, { priority });
      toast({ variant: 'success', title: 'Ticket priority updated' });
      await loadTicket();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to update ticket priority' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!id || !newNote.trim()) return;

    try {
      setSavingNote(true);
      await supportService.addInternalNote(id, { content: newNote });
      toast({ variant: 'success', title: 'Internal note added' });
      setNewNote('');
      await loadTicket();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to add internal note' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!id || !resolutionNotes.trim()) {
      toast({ variant: 'error', title: 'Please provide resolution notes' });
      return;
    }

    try {
      setResolving(true);
      await supportService.resolveTicket(id, { resolution_notes: resolutionNotes });
      toast({ variant: 'success', title: 'Ticket resolved successfully' });
      setResolutionNotes('');
      await loadTicket();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to resolve ticket' });
    } finally {
      setResolving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Alert variant="error">
        <p className="font-medium">Ticket not found</p>
      </Alert>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Back Button */}
          <Button variant="outline" size="sm" onClick={() => navigate('/manage/chat/support')}>
            <BackIcon />
            <span className="ml-2">Back to Dashboard</span>
          </Button>

          {/* Ticket Header */}
          <Card variant="bordered">
            <Card.Body>
              <div className="space-y-4">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {ticket.subject}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.ticket_number}
                      </span>
                      {ticket.category && (
                        <Badge variant="default" size="sm">
                          {ticket.category.replace('_', ' ')}
                        </Badge>
                      )}
                      {ticket.sla_breached && (
                        <Badge variant="error" size="sm">
                          SLA Breached
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Priority Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <Select
                      value={ticket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                      options={STATUS_OPTIONS}
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <Select
                      value={ticket.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                      options={PRIORITY_OPTIONS}
                      disabled={updating}
                    />
                  </div>
                </div>

                {/* Requester Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserIcon />
                  <span>
                    Requested by <strong>{ticket.requester?.full_name}</strong> on{' '}
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Chat Integration Placeholder */}
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Conversation
              </h3>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <p className="text-sm">
                  Ticket conversation (conversation_id: {ticket.conversation_id})
                </p>
                <p className="text-xs mt-1">
                  Integration with ChatLayout component would go here
                </p>
              </Alert>
            </Card.Body>
          </Card>

          {/* Canned Responses */}
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Quick Replies
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCannedResponses(!showCannedResponses)}
              >
                {showCannedResponses ? 'Hide' : 'Show'} ({cannedResponses.length})
              </Button>
            </Card.Header>
            {showCannedResponses && (
              <Card.Body>
                <div className="space-y-2">
                  {cannedResponses.map((response) => (
                    <button
                      key={response.id}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                      onClick={() => {
                        // Would insert into chat input
                        toast({ variant: 'info', title: 'Response inserted' });
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {response.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {response.content}
                          </p>
                        </div>
                        {response.shortcut && (
                          <Badge variant="default" size="sm">
                            {response.shortcut}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Body>
            )}
          </Card>

          {/* Internal Notes */}
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <NoteIcon />
                Internal Notes (Agent Only)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInternalNotes(!showInternalNotes)}
              >
                {showInternalNotes ? 'Hide' : 'Show'} ({ticket.internal_notes.length})
              </Button>
            </Card.Header>
            {showInternalNotes && (
              <Card.Body>
                <div className="space-y-4">
                  {/* Existing Notes */}
                  {ticket.internal_notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">{note.author?.full_name}</span>
                        <span>•</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}

                  {/* Add New Note */}
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Add an internal note (not visible to customer)..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddInternalNote}
                        disabled={!newNote.trim() || savingNote}
                      >
                        {savingNote ? <Spinner size="sm" /> : 'Add Note'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>

          {/* Resolve Ticket */}
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckIcon />
                  Resolve Ticket
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Describe how this issue was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={handleResolveTicket}
                      disabled={!resolutionNotes.trim() || resolving}
                    >
                      {resolving ? <Spinner size="sm" /> : 'Mark as Resolved'}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Customer Context Sidebar - Right Side (1/3) */}
        <div className="space-y-6">
          {/* Company Info */}
          {ticket.customer_context?.company && (
            <Card variant="gradient">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BuildingIcon />
                  Company
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ticket.customer_context.company.display_name ||
                      ticket.customer_context.company.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Customer since {formatDate(ticket.customer_context.company.created_at)}
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Properties */}
          {ticket.customer_context?.properties && ticket.customer_context.properties.length > 0 && (
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Properties ({ticket.customer_context.properties.length})
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {ticket.customer_context.properties.map((property) => (
                    <div
                      key={property.id}
                      className="p-2 bg-gray-50 dark:bg-dark-card rounded border border-gray-200 dark:border-dark-border"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {property.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{property.property_type}</span>
                        <Badge
                          variant={property.is_active ? 'success' : 'default'}
                          size="sm"
                        >
                          {property.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Payment Summary */}
          {ticket.customer_context?.payment_summary && (
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CashIcon />
                  Payment Summary
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Total Bookings
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.customer_context.payment_summary.total_bookings}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Total Revenue
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(ticket.customer_context.payment_summary.total_revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Outstanding Balance
                    </span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {formatCurrency(
                        ticket.customer_context.payment_summary.outstanding_balance
                      )}
                    </span>
                  </div>
                  {ticket.customer_context.payment_summary.last_payment_date && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-dark-border">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last Payment
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(ticket.customer_context.payment_summary.last_payment_date)}
                      </span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Recent Bookings */}
          {ticket.customer_context?.recent_bookings &&
            ticket.customer_context.recent_bookings.length > 0 && (
              <Card variant="bordered">
                <Card.Header>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon />
                    Recent Bookings
                  </h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {ticket.customer_context.recent_bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-gray-50 dark:bg-dark-card rounded border border-gray-200 dark:border-dark-border"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {booking.booking_reference}
                          </span>
                          <Badge variant="default" size="sm">
                            {booking.booking_status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {booking.property_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(booking.check_in_date)}</span>
                          <span>→</span>
                          <span>{formatDate(booking.check_out_date)}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
                          {formatCurrency(booking.total_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
