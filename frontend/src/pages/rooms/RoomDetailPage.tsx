/**
 * RoomDetailPage Component
 *
 * Professional room detail view with AdminDetailLayout pattern.
 * Matches the design system used in PropertyDetailPage.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { AdminDetailLayout } from '@/components/layout/AdminDetailLayout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout';
import { RoomWizard, RoomStatusBadge, RoomCompletionBadge, BedConfigDisplay, PriceDisplay, SeasonalRatesCalendar } from '@/components/features/Room';
import {
  Spinner,
  Alert,
  Button,
  Card,
  Badge,
  Modal,
} from '@/components/ui';
import { roomService, paymentRulesService, addonService } from '@/services';
import type { RoomWithDetails, UpdateRoomRequest } from '@/types/room.types';
import type { PaymentRule } from '@/types/payment-rules.types';
import { PAYMENT_RULE_TYPE_LABELS } from '@/types/payment-rules.types';
import type { AddOn } from '@/types/addon.types';
import { ADDON_TYPE_LABELS, ADDON_PRICING_TYPE_LABELS } from '@/types/addon.types';
import { useToast } from '@/context/NotificationContext';
import { useHashTab } from '@/hooks';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlinePhotograph,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineCash,
  HiOutlineCube,
  HiOutlineViewGrid,
  HiOutlineStar,
} from 'react-icons/hi';

// View configuration for hash tab
const ROOM_VIEWS = ['overview', 'beds', 'gallery', 'rates', 'promotions', 'payment-rules', 'addons'];

type ViewType = 'overview' | 'beds' | 'gallery' | 'rates' | 'promotions' | 'payment-rules' | 'addons';

export const RoomDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const successMessage = location.state?.success;
  const startInEditMode = location.state?.edit === true;
  const { toast } = useToast();

  // Hash-based tab state
  const [activeView, setActiveView] = useHashTab(ROOM_VIEWS, 'overview');

  // State
  const [room, setRoom] = useState<RoomWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success message
  const [showSuccess, setShowSuccess] = useState(!!successMessage);

  // Payment rules state
  const [paymentRules, setPaymentRules] = useState<PaymentRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Add-ons state
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Fetch payment rules
  const fetchPaymentRules = async () => {
    if (!id) return;

    try {
      setRulesLoading(true);
      const rules = await paymentRulesService.listRoomPaymentRules(id);
      setPaymentRules(rules);
    } catch (err) {
      console.error('Failed to load payment rules:', err);
      setPaymentRules([]);
    } finally {
      setRulesLoading(false);
    }
  };

  // Fetch add-ons
  const fetchAddons = async () => {
    if (!id || !room) return;

    try {
      setAddonsLoading(true);
      const roomAddons = await addonService.getAddOnsForRoom(id, room.property_id);
      setAddons(roomAddons);
    } catch (err) {
      console.error('Failed to load add-ons:', err);
      setAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  // Fetch room data and payment rules in parallel
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setRulesLoading(true);

      try {
        setError(null);
        const [roomData, rules] = await Promise.all([
          roomService.getRoom(id),
          paymentRulesService.listRoomPaymentRules(id)
        ]);

        React.startTransition(() => {
          setRoom(roomData);
          setPaymentRules(rules);
        });
      } catch (err) {
        setError('Failed to load room');
        console.error(err);
      } finally {
        setLoading(false);
        setRulesLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Load add-ons after room is loaded
  useEffect(() => {
    if (room && id) {
      fetchAddons();
    }
  }, [room?.id, id]);

  // Clear success message after timeout
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Handle update
  const handleUpdate = async (data: UpdateRoomRequest) => {
    if (!id) return;

    try {
      setSubmitting(true);
      setError(null);

      // Update the room
      await roomService.updateRoom(id, data);

      // Refetch the full room data with all details (promotions, beds, rates, etc.)
      const refreshedRoom = await roomService.getRoom(id);
      setRoom(refreshedRoom);

      // Fetch payment rules and add-ons in the background
      fetchPaymentRules();
      fetchAddons();

      // Close the wizard immediately
      setIsEditing(false);

      // Show success toast notification
      toast({
        variant: 'success',
        title: 'Saved Successfully',
        message: 'Room has been updated with all changes.',
        duration: 3000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update room';
      setError(message);

      // Show error toast
      toast({
        variant: 'error',
        title: 'Save Failed',
        message: message,
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await roomService.deleteRoom(id);
      navigate('/manage/rooms', { state: { success: 'Room deleted successfully' } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete room';
      setError(message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Handle pause/unpause
  const handleTogglePause = async () => {
    if (!room || !id) return;

    try {
      if (room.is_paused) {
        await roomService.unpauseRoom(id);
      } else {
        await roomService.pauseRoom(id);
      }
      const updatedRoom = await roomService.getRoom(id);
      setRoom(updatedRoom);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update room status';
      setError(message);
    }
  };

  // Navigation sections for sidebar
  const navSections: AdminNavSection[] = useMemo(() => [
    {
      title: 'ROOM DETAILS',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <HiOutlineViewGrid className="w-5 h-5" />,
        },
        {
          id: 'beds',
          label: 'Beds & Amenities',
          icon: <HiOutlineCube className="w-5 h-5" />,
        },
        {
          id: 'gallery',
          label: `Gallery (${room?.gallery_images?.length || 0})`,
          icon: <HiOutlinePhotograph className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'PRICING & BOOKING',
      items: [
        {
          id: 'rates',
          label: `Seasonal Rates (${room?.seasonal_rates?.length || 0})`,
          icon: <HiOutlineCalendar className="w-5 h-5" />,
        },
        {
          id: 'promotions',
          label: `Promotions (${room?.promotions?.length || 0})`,
          icon: <HiOutlineTag className="w-5 h-5" />,
        },
        {
          id: 'payment-rules',
          label: `Payment Rules (${paymentRules?.length || 0})`,
          icon: <HiOutlineCash className="w-5 h-5" />,
        },
        {
          id: 'addons',
          label: `Add-ons (${addons?.length || 0})`,
          icon: <HiOutlineStar className="w-5 h-5" />,
        },
      ],
    },
  ], [room?.gallery_images?.length, room?.seasonal_rates?.length, room?.promotions?.length, paymentRules?.length, addons?.length]);

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout title="Room Details">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Not found
  if (!room) {
    return (
      <AuthenticatedLayout title="Room Not Found">
        <Alert variant="error">Room not found or you don't have access to it.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/manage/rooms')}>
            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <AuthenticatedLayout
        title={`Edit: ${room.name}`}
        subtitle={room.property_name}
      >
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
            Cancel Editing
          </Button>

          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <RoomWizard
            mode="edit"
            room={room}
            paymentRules={paymentRules}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={submitting}
          />
        </div>
      </AuthenticatedLayout>
    );
  }

  // View mode - Use AdminDetailLayout for professional 3-column design
  return (
    <AuthenticatedLayout title={room.name} subtitle={room.property_name}>
      <div className="space-y-6">
        {/* Back Button and Action Buttons */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/manage/rooms')}>
            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleTogglePause} size="sm">
              {room.is_paused ? (
                <>
                  <HiOutlinePlay className="w-4 h-4 mr-2" />
                  Unpause
                </>
              ) : (
                <>
                  <HiOutlinePause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button onClick={() => setIsEditing(true)} size="sm">
              <HiOutlinePencil className="w-4 h-4 mr-2" />
              Edit Room
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <HiOutlineTrash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" dismissible onDismiss={() => setShowSuccess(false)}>
            {successMessage || 'Room updated successfully!'}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Room Header Info */}
        <Card variant="bordered">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Featured Image */}
            <div className="w-full md:w-64 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-sidebar">
              {room.featured_image ? (
                <img
                  src={room.featured_image}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <HiOutlinePhotograph className="w-12 h-12" />
                  <span className="text-sm mt-1">No image</span>
                </div>
              )}
            </div>

            {/* Room Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {room.name}
                    </h1>
                    <code className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-dark-sidebar rounded">
                      {room.room_code}
                    </code>
                  </div>
                  {room.property_name && (
                    <p className="text-gray-500 dark:text-gray-400">{room.property_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <RoomStatusBadge
                    isActive={room.is_active}
                    isPaused={room.is_paused}
                    pausedReason={room.paused_reason}
                  />
                  <RoomCompletionBadge score={room.completeness_score} />
                </div>
              </div>

              {room.description && (
                <p className="text-gray-600 dark:text-gray-300">{room.description}</p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Max Guests</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{room.max_guests}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Min Nights</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{room.min_nights}</p>
                </div>
                {room.room_size_sqm && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Size</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{room.room_size_sqm} m²</p>
                  </div>
                )}
                {room.inventory_mode === 'room_type' && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Units</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{room.total_units}</p>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="pt-3 border-t border-gray-200 dark:border-dark-border">
                <PriceDisplay
                  price={room.base_price_per_night}
                  currency={room.currency}
                  pricingMode={room.pricing_mode}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Admin Detail Layout with Sidebar Navigation */}
        <AdminDetailLayout
          navSections={navSections}
          activeId={activeView}
          onNavChange={(id) => setActiveView(id as ViewType)}
        >
        {/* Overview */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Room Summary</h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Room Code</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.room_code}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Max Guests</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.max_guests}</dd>
                      </div>
                      {room.max_adults && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Max Adults</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.max_adults}</dd>
                        </div>
                      )}
                      {room.max_children && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Max Children</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.max_children}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Booking Rules</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Min Nights</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.min_nights}</dd>
                      </div>
                      {room.max_nights && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Max Nights</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.max_nights}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Inventory Mode</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{room.inventory_mode.replace('_', ' ')}</dd>
                      </div>
                      {room.inventory_mode === 'room_type' && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500 dark:text-gray-400">Total Units</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">{room.total_units}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Pricing Information</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Base Rate</p>
                    <PriceDisplay
                      price={room.base_price_per_night}
                      currency={room.currency}
                      pricingMode={room.pricing_mode}
                    />
                  </div>
                  {room.additional_person_rate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Additional Person Rate</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-ZA', {
                          style: 'currency',
                          currency: room.currency,
                        }).format(room.additional_person_rate)} per night
                      </p>
                    </div>
                  )}
                  {room.child_price_per_night && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Child Rate</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-ZA', {
                          style: 'currency',
                          currency: room.currency,
                        }).format(room.child_price_per_night)} per night
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Beds & Amenities */}
        {activeView === 'beds' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Beds & Amenities</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Beds */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Bed Configuration
                  </h3>
                  <BedConfigDisplay beds={room.beds} />
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="pt-6 border-t border-gray-200 dark:border-dark-border">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="default">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Gallery */}
        {activeView === 'gallery' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Gallery</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.gallery_images?.length || 0} images
              </p>
            </Card.Header>
            <Card.Body>
              {room.gallery_images && room.gallery_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {room.gallery_images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-sidebar hover:ring-2 hover:ring-primary transition-all"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Gallery image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HiOutlinePhotograph className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No gallery images yet
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <HiOutlinePencil className="w-4 h-4 mr-2" />
                    Add Photos
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Seasonal Rates */}
        {activeView === 'rates' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Seasonal Rates</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.seasonal_rates?.length || 0} rate periods configured
              </p>
            </Card.Header>
            <Card.Body>
              {room.seasonal_rates && room.seasonal_rates.length > 0 ? (
                <SeasonalRatesCalendar
                  room={{
                    id: room.id,
                    name: room.name,
                    max_guests: room.max_guests,
                    base_price_per_night: room.base_price_per_night,
                    currency: room.currency,
                    seasonal_rates: room.seasonal_rates,
                  }}
                  daysToShow={7}
                  showNavigation={true}
                />
              ) : (
                <div className="text-center py-12">
                  <HiOutlineCalendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No seasonal rates configured
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <HiOutlinePencil className="w-4 h-4 mr-2" />
                    Add Seasonal Pricing
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Promotions */}
        {activeView === 'promotions' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Promotions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.promotions?.length || 0} promo codes
              </p>
            </Card.Header>
            <Card.Body>
              {room.promotions && room.promotions.length > 0 ? (
                <div className="space-y-3">
                  {room.promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <HiOutlineTag className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-mono font-bold">
                              {promo.code}
                            </code>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {promo.name}
                            </span>
                            {!promo.is_active && (
                              <Badge variant="default" size="sm">Inactive</Badge>
                            )}
                          </div>
                          {promo.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {promo.description}
                            </p>
                          )}
                          {(promo.min_nights || promo.valid_from || promo.valid_until) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {promo.min_nights && <span>Min {promo.min_nights} nights</span>}
                              {promo.valid_from && <span>From {new Date(promo.valid_from).toLocaleDateString()}</span>}
                              {promo.valid_until && <span>Until {new Date(promo.valid_until).toLocaleDateString()}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-lg font-bold text-primary">
                          {promo.discount_type === 'percentage'
                            ? `${promo.discount_value}% off`
                            : promo.discount_type === 'fixed_amount'
                            ? new Intl.NumberFormat('en-ZA', {
                                style: 'currency',
                                currency: room.currency,
                              }).format(promo.discount_value) + ' off'
                            : `${promo.discount_value} free night${promo.discount_value !== 1 ? 's' : ''}`}
                        </p>
                        {promo.max_uses && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {promo.uses_count || 0} / {promo.max_uses} uses
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HiOutlineTag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No promotions configured
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <HiOutlinePencil className="w-4 h-4 mr-2" />
                    Add Promo Code
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Payment Rules */}
        {activeView === 'payment-rules' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Payment Rules</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {paymentRules?.length || 0} rules configured
              </p>
            </Card.Header>
            <Card.Body>
              {rulesLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : paymentRules && paymentRules.length > 0 ? (
                <div className="space-y-3">
                  {paymentRules.map((rule) => {
                    let subtitle = '';
                    if (rule.rule_type === 'deposit') {
                      subtitle = `${rule.deposit_amount}${rule.deposit_type === 'percentage' ? '%' : ' ZAR'} deposit at booking, balance ${rule.balance_due === 'on_checkin' ? 'on check-in' : 'before check-in'}`;
                    } else if (rule.rule_type === 'payment_schedule') {
                      const milestoneCount = rule.schedule_config?.length || 0;
                      subtitle = `${milestoneCount} payment milestone${milestoneCount !== 1 ? 's' : ''}`;
                    } else if (rule.rule_type === 'flexible') {
                      subtitle = 'Flexible payment (no requirements)';
                    }

                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <HiOutlineCash className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {rule.rule_name}
                              </span>
                              {rule.rule_type && PAYMENT_RULE_TYPE_LABELS[rule.rule_type] && (
                                <Badge variant="info" size="sm">
                                  {PAYMENT_RULE_TYPE_LABELS[rule.rule_type]}
                                </Badge>
                              )}
                              {rule.applies_to_dates && (
                                <Badge variant="warning" size="sm">
                                  Seasonal
                                </Badge>
                              )}
                              {!rule.is_active && (
                                <Badge variant="default" size="sm">Inactive</Badge>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {rule.description}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {subtitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HiOutlineCash className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No payment rules configured
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <HiOutlinePencil className="w-4 h-4 mr-2" />
                    Add Payment Rule
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Add-ons */}
        {activeView === 'addons' && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold">Add-ons</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {addons?.length || 0} add-ons available
              </p>
            </Card.Header>
            <Card.Body>
              {addonsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : addons && addons.length > 0 ? (
                <div className="space-y-3">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <HiOutlineStar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {addon.name}
                            </p>
                            <Badge variant="info" size="sm">
                              {ADDON_TYPE_LABELS[addon.type]}
                            </Badge>
                          </div>
                          {addon.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {addon.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {ADDON_PRICING_TYPE_LABELS[addon.pricing_type]}
                            {addon.max_quantity && addon.max_quantity > 1 && ` • Max ${addon.max_quantity}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('en-ZA', {
                            style: 'currency',
                            currency: addon.currency,
                            minimumFractionDigits: 2,
                          }).format(addon.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HiOutlineStar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No add-ons assigned
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <HiOutlinePencil className="w-4 h-4 mr-2" />
                    Manage Add-ons
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
        </AdminDetailLayout>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Room"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong>{room.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Room
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
};
