import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Badge,
  Spinner,
  Alert,
  Input,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui';
import { CustomerDetailSidebar } from '@/components/features/Customer';
import { customerService } from '@/services/customer.service';
import { chatService } from '@/services/chat.service';
import type { CustomerWithCompany, UpdateCustomerInput } from '@/types/customer.types';
import type { Conversation } from '@/types/chat.types';
import {
  CUSTOMER_STATUS_COLORS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SOURCE_LABELS,
} from '@/types/customer.types';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineTag,
  HiOutlineChat,
  HiOutlineClock,
} from 'react-icons/hi';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerWithCompany | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<UpdateCustomerInput>({});

  // Tab state with URL hash support
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchBookings();
    }
  }, [id]);

  // Fetch conversations after customer is loaded
  useEffect(() => {
    if (customer) {
      fetchConversations();
    }
  }, [customer]);

  // Read active tab from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (hash && ['overview', 'chat', 'history', 'bookings', 'notes'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, '', `#${value}`);
  };

  const fetchCustomer = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await customerService.getCustomer(id);
      setCustomer(data);
      setEditData({
        notes: data.notes || '',
        tags: data.tags || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!id) return;
    try {
      const data = await customerService.getCustomerBookings(id, 1, 20);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const fetchConversations = async () => {
    if (!customer) return;
    setIsLoadingConversations(true);
    try {
      console.log('[CustomerDetail] Fetching property-scoped conversations');
      console.log('[CustomerDetail] Customer:', customer.id, 'Property:', customer.property_id);

      // Fetch active conversations via new endpoint
      const activeResponse = await customerService.getCustomerConversations(customer.id, false);
      console.log('[CustomerDetail] Active conversations:', activeResponse.length);

      // Fetch archived conversations via new endpoint
      const archivedResponse = await customerService.getCustomerConversations(customer.id, true);
      console.log('[CustomerDetail] Archived conversations:', archivedResponse.length);

      setActiveConversations(activeResponse);
      setArchivedConversations(archivedResponse);
      setConversations([...activeResponse, ...archivedResponse]);
    } catch (err) {
      console.error('[CustomerDetail] Failed to load conversations:', err);
      // Don't throw - conversations are optional
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await customerService.updateCustomer(id, editData);
      setSuccess('Customer updated successfully');
      setIsEditing(false);
      await fetchCustomer();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactViaEmail = () => {
    if (customer?.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  const handleContactViaPhone = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Customer Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!customer) {
    return (
      <AuthenticatedLayout title="Customer Details">
        <Alert variant="error">Customer not found</Alert>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={customer.full_name || customer.email}
      subtitle={customer.email}
      noPadding
    >
      <div className="flex flex-col min-h-full">
        {/* Customer Detail Sidebar - Dark Top Bar */}
        <CustomerDetailSidebar
          customer={customer}
          activeConversationsCount={activeConversations.length}
          onSendEmail={handleContactViaEmail}
          onCall={handleContactViaPhone}
          onNavigateBack={() => navigate('/manage/customers')}
        />

        {/* Main Content + Sticky Summary Wrapper */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {/* Alerts */}
              {error && (
                <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList variant="underline">
                  <TabsTrigger value="overview" variant="underline" className="inline-flex items-center whitespace-nowrap">
                    <HiOutlineUser className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="chat" variant="underline" className="inline-flex items-center whitespace-nowrap">
                    <HiOutlineChat className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Chat ({conversations.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" variant="underline" className="inline-flex items-center whitespace-nowrap">
                    <HiOutlineClock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>History</span>
                  </TabsTrigger>
                  <TabsTrigger value="bookings" variant="underline" className="inline-flex items-center whitespace-nowrap">
                    <HiOutlineShoppingBag className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Bookings ({bookings.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" variant="underline" className="inline-flex items-center whitespace-nowrap">
                    <HiOutlineDocumentText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Notes & Tags</span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <Card>
                      <Card.Header>
                        <div className="flex items-center gap-2">
                          <HiOutlineUser className="w-5 h-5" />
                          <span>Contact Information</span>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              Email
                              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Guest-controlled
                              </span>
                            </label>
                            <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.email}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              Phone
                              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Guest-controlled
                              </span>
                            </label>
                            <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.phone || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              Full Name
                              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Guest-controlled
                              </span>
                            </label>
                            <p className="text-gray-900 dark:text-gray-100 mt-1">{customer.full_name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400">Property</label>
                            <p className="text-gray-900 dark:text-gray-100 mt-1">
                              {customer.property?.name || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Contact details can only be updated by the guest. You can edit notes, tags, and preferences below.
                          </p>
                        </div>
                      </Card.Body>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <Card.Body>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <HiOutlineShoppingBag className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">Total Bookings</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {customer.total_bookings}
                          </p>
                        </Card.Body>
                      </Card>

                      <Card>
                        <Card.Body>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <HiOutlineCurrencyDollar className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">Total Spent</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(customer.total_spent, customer.currency)}
                          </p>
                        </Card.Body>
                      </Card>

                      <Card>
                        <Card.Body>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <HiOutlineCalendar className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">First Booking</span>
                          </div>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {formatDate(customer.first_booking_date)}
                          </p>
                        </Card.Body>
                      </Card>

                      <Card>
                        <Card.Body>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <HiOutlineCalendar className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">Last Booking</span>
                          </div>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {formatDate(customer.last_booking_date)}
                          </p>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat">
                  {isLoadingConversations ? (
                    <Card>
                      <Card.Body>
                        <div className="flex items-center justify-center py-12">
                          <Spinner size="md" />
                        </div>
                      </Card.Body>
                    </Card>
                  ) : conversations.length === 0 ? (
                    <Card>
                      <Card.Body>
                        <div className="text-center py-12">
                          <HiOutlineChat className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No conversations yet
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            Conversations will appear here when the customer contacts you
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {/* Active Conversations Card */}
                      <Card>
                        <Card.Header>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HiOutlineChat className="w-5 h-5 text-green-600 dark:text-green-500" />
                              <span>Active Conversations</span>
                            </div>
                            <Badge variant="success">
                              {activeConversations.length} active
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {activeConversations.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-gray-500 dark:text-gray-400">
                                No active conversations
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {activeConversations.map((conversation) => {
                                const participantCount = conversation.participants?.length || 0;
                                const otherParticipants = conversation.participants?.filter(
                                  p => p.user_id !== customer.user_id
                                ) || [];
                                const lastMessageTime = conversation.last_message_at || conversation.created_at;
                                const isRecent = new Date(lastMessageTime) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                                return (
                                  <div
                                    key={conversation.id}
                                    onClick={() => navigate(`/manage/chat/conversations/${conversation.id}`)}
                                    className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-dark-card dark:to-gray-900 border-2 border-gray-200 dark:border-dark-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer transition-all duration-300"
                                  >
                                    {/* Status Indicator Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>

                                    <div className="p-6">
                                      {/* Header Section */}
                                      <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                          {/* Conversation Icon & Title */}
                                          <div className="flex items-start gap-3 mb-2">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                              <HiOutlineChat className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1 truncate">
                                                {conversation.title || 'Untitled Conversation'}
                                              </h4>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 capitalize border border-green-200 dark:border-green-800">
                                                  {conversation.type.replace('_', ' ')}
                                                </span>
                                                {isRecent && (
                                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                    Recent
                                                  </span>
                                                )}
                                                {conversation.unread_count > 0 && (
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    {conversation.unread_count} new
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Badge variant="success" className="flex-shrink-0 text-xs px-3 py-1">
                                          Active
                                        </Badge>
                                      </div>

                                      {/* Metadata Grid */}
                                      <div className="grid grid-cols-2 gap-3 mb-4">
                                        {/* Participants */}
                                        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                          <div className="flex items-center gap-2 mb-1">
                                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              Participants
                                            </span>
                                          </div>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {participantCount} {participantCount === 1 ? 'person' : 'people'}
                                          </p>
                                          {otherParticipants.length > 0 && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                                              with {otherParticipants.map(p => p.user?.full_name || p.user?.email).filter(Boolean).join(', ') || 'staff'}
                                            </p>
                                          )}
                                        </div>

                                        {/* Last Activity */}
                                        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                          <div className="flex items-center gap-2 mb-1">
                                            <HiOutlineClock className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              Last Activity
                                            </span>
                                          </div>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {new Date(lastMessageTime).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {(() => {
                                              const diffMs = Date.now() - new Date(lastMessageTime).getTime();
                                              const diffMins = Math.floor(diffMs / 60000);
                                              const diffHours = Math.floor(diffMins / 60);
                                              const diffDays = Math.floor(diffHours / 24);

                                              if (diffMins < 1) return 'Just now';
                                              if (diffMins < 60) return `${diffMins}m ago`;
                                              if (diffHours < 24) return `${diffHours}h ago`;
                                              return `${diffDays}d ago`;
                                            })()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Footer Actions */}
                                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                          <span>Conversation ID: {conversation.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                                          <span>Open Conversation</span>
                                          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card.Body>
                      </Card>

                      {/* Archived Conversations Card */}
                      <Card>
                        <Card.Header>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HiOutlineChat className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              <span>Archived Conversations</span>
                            </div>
                            <Badge variant="default">
                              {archivedConversations.length} archived
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {archivedConversations.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-gray-500 dark:text-gray-400">
                                No archived conversations
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {archivedConversations.map((conversation) => {
                                const participantCount = conversation.participants?.length || 0;
                                const otherParticipants = conversation.participants?.filter(
                                  p => p.user_id !== customer.user_id
                                ) || [];
                                const lastMessageTime = conversation.last_message_at || conversation.created_at;

                                return (
                                  <div
                                    key={conversation.id}
                                    onClick={() => navigate(`/manage/chat/conversations/${conversation.id}`)}
                                    className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer transition-all duration-300 opacity-80 hover:opacity-100"
                                  >
                                    {/* Status Indicator Bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500"></div>

                                    <div className="p-6">
                                      {/* Header Section */}
                                      <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                          {/* Conversation Icon & Title */}
                                          <div className="flex items-start gap-3 mb-2">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                              <HiOutlineChat className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-gray-700 dark:text-gray-200 text-lg mb-1 truncate">
                                                {conversation.title || 'Untitled Conversation'}
                                              </h4>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize border border-gray-300 dark:border-gray-600">
                                                  {conversation.type.replace('_', ' ')}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Badge variant="default" className="flex-shrink-0 text-xs px-3 py-1">
                                          Archived
                                        </Badge>
                                      </div>

                                      {/* Metadata Grid */}
                                      <div className="grid grid-cols-2 gap-3 mb-4">
                                        {/* Participants */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600">
                                          <div className="flex items-center gap-2 mb-1">
                                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              Participants
                                            </span>
                                          </div>
                                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {participantCount} {participantCount === 1 ? 'person' : 'people'}
                                          </p>
                                          {otherParticipants.length > 0 && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                                              with {otherParticipants.map(p => p.user?.full_name || p.user?.email).filter(Boolean).join(', ') || 'staff'}
                                            </p>
                                          )}
                                        </div>

                                        {/* Archived Date */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-600">
                                          <div className="flex items-center gap-2 mb-1">
                                            <HiOutlineClock className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              Archived
                                            </span>
                                          </div>
                                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {new Date(lastMessageTime).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </p>
                                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {(() => {
                                              const diffMs = Date.now() - new Date(lastMessageTime).getTime();
                                              const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

                                              if (diffDays < 7) return `${diffDays}d ago`;
                                              if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
                                              if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
                                              return `${Math.floor(diffDays / 365)}y ago`;
                                            })()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Footer Actions */}
                                      <div className="flex items-center justify-between pt-4 border-t border-gray-300 dark:border-gray-600">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                          <span>Conversation ID: {conversation.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:gap-3 transition-all">
                                          <span>View Archived</span>
                                          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                  <Card>
                    <Card.Header>
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="w-5 h-5" />
                        <span>Customer Timeline</span>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-4">
                        {/* Timeline items */}
                        <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700">
                          {/* First Contact */}
                          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary"></div>
                          <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                            First Contact
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {formatDate(customer.created_at)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Customer added to system via {CUSTOMER_SOURCE_LABELS[customer.source]}
                          </p>
                          {customer.tags?.includes('promo_claim') && (
                            <Badge variant="info" className="mt-2">
                              Promo Claim Lead
                            </Badge>
                          )}
                        </div>

                        {/* First Booking */}
                        {customer.first_booking_date && (
                          <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-green-600"></div>
                            <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                              First Booking
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {formatDate(customer.first_booking_date)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Made their first reservation
                            </p>
                          </div>
                        )}

                        {/* Conversations */}
                        {conversations.length > 0 && (
                          <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600"></div>
                            <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                              Conversations
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {conversations.length} total
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Has engaged in {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {/* Total Bookings */}
                        {customer.total_bookings > 0 && (
                          <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-600"></div>
                            <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                              Total Bookings: {customer.total_bookings}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Last: {formatDate(customer.last_booking_date)}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total revenue: {formatCurrency(customer.total_spent, customer.currency)}
                            </p>
                          </div>
                        )}

                        {/* Current Status */}
                        <div className="relative pl-8">
                          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                          <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                            Current Status
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {formatDate(customer.updated_at)}
                          </div>
                          <Badge variant={CUSTOMER_STATUS_COLORS[customer.status] as any}>
                            {CUSTOMER_STATUS_LABELS[customer.status]}
                          </Badge>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </TabsContent>

                {/* Bookings Tab */}
                <TabsContent value="bookings">
                  <Card>
                    <Card.Header>
                      <div className="flex items-center gap-2">
                        <HiOutlineShoppingBag className="w-5 h-5" />
                        <span>Booking History</span>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Reference</TableHeader>
                            <TableHeader>Property</TableHeader>
                            <TableHeader>Check-in</TableHeader>
                            <TableHeader>Check-out</TableHeader>
                            <TableHeader>Status</TableHeader>
                            <TableHeader className="text-right">Amount</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bookings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No bookings found
                              </TableCell>
                            </TableRow>
                          ) : (
                            bookings.map((booking) => (
                              <TableRow
                                key={booking.id}
                                onClick={() => navigate(`/manage/bookings/${booking.id}`)}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover"
                              >
                                <TableCell className="font-medium">{booking.booking_reference}</TableCell>
                                <TableCell>{booking.property?.name || '-'}</TableCell>
                                <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                                <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                                <TableCell>
                                  <Badge variant={booking.booking_status === 'confirmed' ? 'success' : 'default'}>
                                    {booking.booking_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(booking.total_amount, booking.currency)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card.Body>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                  <Card>
                    <Card.Header className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HiOutlineDocumentText className="w-5 h-5" />
                        <span>Notes</span>
                      </div>
                      {!isEditing && (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      )}
                    </Card.Header>
                    <Card.Body>
                      {isEditing ? (
                        <div className="space-y-4">
                          <textarea
                            value={editData.notes || ''}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100"
                            placeholder="Add notes about this customer..."
                          />
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                setEditData({
                                  notes: customer.notes || '',
                                  tags: customer.tags || [],
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSave} isLoading={isSaving}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {customer.notes ? (
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {customer.notes}
                            </p>
                          ) : (
                            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                              No notes yet. Click Edit to add notes about this customer.
                            </p>
                          )}
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          {/* End of Main Content Area */}

          {/* Sticky Summary Panel - Right Side */}
          <div className="hidden xl:block xl:w-[280px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
            <div className="sticky top-0 h-screen overflow-y-auto p-4">
              {/* Customer Summary Card */}
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="w-16 h-16 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                    <HiOutlineUser className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {customer.full_name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant={CUSTOMER_STATUS_COLORS[customer.status] as any}>
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {CUSTOMER_SOURCE_LABELS[customer.source]}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  {customer.email && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleContactViaEmail}
                      className="justify-start"
                    >
                      <HiOutlineMail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                  {customer.phone && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleContactViaPhone}
                      className="justify-start"
                    >
                      <HiOutlinePhone className="w-4 h-4 mr-2" />
                      Call Customer
                    </Button>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Active Chats</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">{activeConversations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Archived Chats</span>
                    <span className="font-semibold text-gray-500 dark:text-gray-400">{archivedConversations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Bookings</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{customer.total_bookings}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Spent</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(customer.total_spent, customer.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">First Booking</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(customer.first_booking_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Last Booking</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(customer.last_booking_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End of Sticky Summary Panel */}
        </div>
        {/* End of Main Content + Summary Wrapper */}
      </div>
      {/* End of flex flex-col min-h-full */}
    </AuthenticatedLayout>
  );
};
