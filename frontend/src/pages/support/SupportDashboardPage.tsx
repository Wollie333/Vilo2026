import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Select, Spinner, Input, Alert } from '@/components/ui';
import { supportService } from '@/services';
import { useToast } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import type {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketListParams,
  TicketStatsResponse,
} from '@/types/support.types';

// ============================================================================
// ICONS
// ============================================================================

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_customer', label: 'Waiting on Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'general', label: 'General' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusBadge = (status: TicketStatus) => {
  const variants: Record<TicketStatus, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
    open: { variant: 'default', label: 'Open' },
    assigned: { variant: 'warning', label: 'Assigned' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    waiting_on_customer: { variant: 'default', label: 'Waiting' },
    resolved: { variant: 'success', label: 'Resolved' },
    closed: { variant: 'default', label: 'Closed' },
  };
  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPriorityBadge = (priority: TicketPriority) => {
  const variants: Record<TicketPriority, { variant: 'default' | 'success' | 'warning' | 'error'; icon: string }> = {
    urgent: { variant: 'error', icon: '🔥' },
    high: { variant: 'warning', icon: '⚠️' },
    normal: { variant: 'default', icon: '📋' },
    low: { variant: 'success', icon: '📌' },
  };
  const config = variants[priority];
  return (
    <Badge variant={config.variant} size="sm">
      <span className="mr-1">{config.icon}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const getSLACountdown = (sla_due_at: string | null, sla_breached: boolean) => {
  if (!sla_due_at) return null;

  if (sla_breached) {
    return (
      <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
        <ClockIcon />
        SLA Breached
      </span>
    );
  }

  const now = new Date();
  const due = new Date(sla_due_at);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    return (
      <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
        <ClockIcon />
        Overdue
      </span>
    );
  }

  if (diffHours < 2) {
    return (
      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
        <ClockIcon />
        {diffHours}h remaining
      </span>
    );
  }

  const diffDays = Math.floor(diffHours / 24);
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
      <ClockIcon />
      {diffDays > 0 ? `${diffDays}d` : `${diffHours}h`} remaining
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SupportDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters
  const [filters, setFilters] = useState<TicketListParams>({
    status: '',
    priority: '',
    category: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Create ticket form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'normal' as TicketPriority,
    category: 'general' as TicketCategory,
  });

  // Load tickets and stats on mount and filter change
  useEffect(() => {
    loadTickets();
  }, [filters]);

  useEffect(() => {
    // Only load stats if user is an admin
    if (isAdmin) {
      loadStats();
    } else {
      setLoadingStats(false);
    }
  }, [isAdmin]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.listTickets(filters);
      setTickets(response.tickets);
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to load support tickets' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Only fetch if user has admin role
    if (!isAdmin) {
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      const data = await supportService.getTicketStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Silently fail - stats are optional
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFilterChange = (key: keyof TicketListParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    // Navigate to chat conversation to allow communication via chat interface
    navigate(`/manage/chat/conversations/${ticket.conversation_id}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast({ variant: 'error', title: 'Please fill in all required fields' });
      return;
    }

    try {
      setCreating(true);
      // Map description to initial_message as expected by backend
      const ticketData = {
        subject: newTicket.subject,
        initial_message: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
      };
      const ticket = await supportService.createTicket(ticketData);
      toast({ variant: 'success', title: 'Ticket created successfully' });
      setShowCreateForm(false);
      setNewTicket({
        subject: '',
        description: '',
        priority: 'normal',
        category: 'general',
      });
      loadTickets();
      // Navigate to the chat conversation so user can communicate via chat
      navigate(`/manage/chat/conversations/${ticket.conversation_id}`);
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to create ticket' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and track customer support requests
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="primary"
          >
            {showCreateForm ? 'Cancel' : '+ New Ticket'}
          </Button>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <Card>
            <Card.Body>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Ticket
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <Select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
                      options={PRIORITY_OPTIONS.filter(opt => opt.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <Select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                      options={CATEGORY_OPTIONS.filter(opt => opt.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateTicket}
                    disabled={creating || !newTicket.subject.trim() || !newTicket.description.trim()}
                  >
                    {creating ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Stats Cards - Only visible to admins */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="gradient">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {loadingStats ? '...' : stats?.total_tickets || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card variant="gradient">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {loadingStats ? '...' : stats?.open_tickets || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card variant="gradient">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SLA Breached</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {loadingStats ? '...' : stats?.breached_sla || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card variant="gradient">
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Resolution</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {loadingStats ? '...' : `${Math.round(stats?.avg_resolution_time_hours || 0)}h`}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input with Icon */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                options={STATUS_OPTIONS}
              />

              {/* Priority Filter */}
              <Select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                options={PRIORITY_OPTIONS}
              />

              {/* Category Filter */}
              <Select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            {/* Results Count and Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <FilterIcon />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">Sort by:</label>
                <Select
                  value={filters.sortBy || 'created_at'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  options={[
                    { value: 'created_at', label: 'Created' },
                    { value: 'updated_at', label: 'Updated' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'sla_due_at', label: 'SLA' },
                  ]}
                  className="w-36"
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <Alert variant="info">
            <p className="font-medium">No tickets found</p>
            <p className="text-sm mt-1">
              {Object.values(filters).some((v) => v) ? 'Try adjusting your filters' : 'No support tickets yet'}
            </p>
          </Alert>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                variant="bordered"
                interactive
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTicketClick(ticket)}
              >
                <Card.Body>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Ticket Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {ticket.ticket_number}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        {ticket.category && (
                          <Badge variant="default" size="sm">
                            {ticket.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {ticket.subject}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserIcon />
                          <span>{ticket.requester?.full_name || 'Unknown'}</span>
                        </div>
                        <span>•</span>
                        <span>{formatTime(ticket.created_at)}</span>
                        {ticket.assigned_agent && (
                          <>
                            <span>•</span>
                            <span>Assigned to {ticket.assigned_agent.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: SLA Indicator */}
                    <div className="flex-shrink-0">
                      {getSLACountdown(ticket.sla_due_at, ticket.sla_breached)}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
