/**
 * Payment Rules Management Page
 *
 * Centralized page for managing all payment rules across properties.
 * Allows creating, editing, deleting rules and assigning them to rooms.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCash,
  HiOutlineHome,
} from 'react-icons/hi';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Spinner,
  Modal,
  ViewModeSelector,
} from '@/components/ui';
import { useViewMode } from '@/hooks';
import { paymentRulesService, propertyService } from '@/services';
import { PaymentRule } from '@/types/payment-rules.types';
import { useAuth } from '@/context/AuthContext';

/**
 * Room Count Badge Component
 * Displays the number of rooms assigned to a payment rule
 */
const RoomCountBadge: React.FC<{ rule: PaymentRule; onClick?: () => void }> = ({ rule, onClick }) => {
  const roomCount = rule.room_count || 0;

  if (roomCount === 0) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        0 rooms
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-full text-sm font-medium transition-colors"
    >
      <HiOutlineHome className="w-4 h-4" />
      <span>{roomCount} {roomCount === 1 ? 'room' : 'rooms'}</span>
    </button>
  );
};

// System Default Payment Rule (always shown, cannot be edited or deleted)
const SYSTEM_DEFAULT_RULE: PaymentRule = {
  id: 'system-default-flexible',
  rule_name: 'Flexible Payment Terms',
  description: 'No payment schedule required. Guests can pay at their convenience before or during their stay.',
  rule_type: 'flexible',
  is_active: true,
  priority: 0,
  applies_to_dates: false,
  start_date: null,
  end_date: null,
  schedule_config: [],
  allowed_payment_methods: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  room_count: 0, // System default, not tracked per room
  assigned_room_ids: [],
} as PaymentRule;

export const PaymentRulesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode('payment-rules-view', 'table');
  const [rules, setRules] = useState<PaymentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingAssignments, setViewingAssignments] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<{ room_id: string; room_name: string }[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; rule: PaymentRule | null }>({ isOpen: false, rule: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  // Combined rules: system default + custom rules
  const allRules = [SYSTEM_DEFAULT_RULE, ...rules];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await paymentRulesService.listAllPaymentRules();
      console.log('[PaymentRulesPage] Received data:', data);
      console.log('[PaymentRulesPage] Is array?', Array.isArray(data));
      console.log('[PaymentRulesPage] Length:', data?.length);
      setRules(data || []);
    } catch (err) {
      console.error('Failed to fetch payment rules:', err);
      setRules([]); // Ensure rules is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Fetch user's owned properties via API
      const response = await propertyService.getMyProperties();
      const properties = response.properties || [];

      if (properties.length === 0) {
        setErrorModal({
          isOpen: true,
          message: 'No properties found. Please create a property first.',
        });
        setIsCreating(false);
        return;
      }

      // Use first property (or primary if available)
      const primaryProperty = properties.find((p) => p.is_primary);
      const propertyId = primaryProperty?.id || properties[0].id;

      navigate(`/manage/rooms/payment-rules/new?property_id=${propertyId}`);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load properties. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isSystemDefault = (rule: PaymentRule) => {
    return rule.id === 'system-default-flexible';
  };

  const handleEdit = (rule: PaymentRule) => {
    if (isSystemDefault(rule)) {
      alert('System default payment rules cannot be edited.');
      return;
    }
    navigate(`/manage/rooms/payment-rules/${rule.id}/edit`);
  };

  const handleDelete = (rule: PaymentRule) => {
    if (isSystemDefault(rule)) {
      return;
    }
    setDeleteConfirmation({ isOpen: true, rule });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.rule) return;

    setIsDeleting(true);
    try {
      await paymentRulesService.deletePaymentRuleGlobal(deleteConfirmation.rule.id);
      setDeleteConfirmation({ isOpen: false, rule: null });
      await fetchRules();
    } catch (err) {
      console.error('Failed to delete payment rule:', err);
      setDeleteConfirmation({ isOpen: false, rule: null });
      setErrorModal({
        isOpen: true,
        message: 'Failed to delete payment rule. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAssignments = async (ruleId: string) => {
    try {
      const data = await paymentRulesService.getPaymentRuleAssignments(ruleId);
      setAssignments(data);
      setViewingAssignments(ruleId);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load room assignments.',
      });
    }
  };

  const getRuleTypeBadgeVariant = (ruleType: string) => {
    switch (ruleType) {
      case 'deposit':
        return 'info';
      case 'payment_schedule':
        return 'warning';
      case 'flexible':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'deposit':
        return 'Deposit';
      case 'payment_schedule':
        return 'Schedule';
      case 'flexible':
        return 'Flexible';
      default:
        return ruleType;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment Rules
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage payment rules across all your rooms
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSelector
              value={viewMode}
              onChange={setViewMode}
              storageKey="payment-rules-view"
            />
            <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              {isCreating ? 'Loading...' : 'Create Payment Rule'}
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Rule Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Rooms</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {allRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {rule.rule_name}
                          </span>
                          {isSystemDefault(rule) && (
                            <Badge variant="default" size="sm">
                              System Default
                            </Badge>
                          )}
                        </div>
                        {rule.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRuleTypeBadgeVariant(rule.rule_type)}>
                        {getRuleTypeLabel(rule.rule_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isSystemDefault(rule) ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          All rooms (default)
                        </span>
                      ) : (
                        <RoomCountBadge
                          rule={rule}
                          onClick={() => handleViewAssignments(rule.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'success' : 'default'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isSystemDefault(rule) && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(rule)}
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(rule)}
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allRules.map((rule) => (
              <Card key={rule.id} className={`transition-shadow ${!isSystemDefault(rule) ? 'hover:shadow-md cursor-pointer' : ''}`}>
                <div onClick={() => !isSystemDefault(rule) && handleEdit(rule)} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rule.rule_name}
                        </h3>
                        {isSystemDefault(rule) && (
                          <Badge variant="default" size="sm">
                            System
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                      <Badge variant={getRuleTypeBadgeVariant(rule.rule_type)} size="sm">
                        {getRuleTypeLabel(rule.rule_type)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                      <Badge variant={rule.is_active ? 'success' : 'default'} size="sm">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Rooms</span>
                      {isSystemDefault(rule) ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          All (default)
                        </span>
                      ) : (
                        <RoomCountBadge
                          rule={rule}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAssignments(rule.id);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {!isSystemDefault(rule) && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-dark-border">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(rule);
                        }}
                        className="flex-1"
                      >
                        <HiOutlinePencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rule);
                        }}
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // List View (compact rows)
          <div className="space-y-2">
            {allRules.map((rule) => (
              <Card key={rule.id} className={`transition-shadow ${!isSystemDefault(rule) ? 'hover:shadow-md cursor-pointer' : ''}`}>
                <div onClick={() => !isSystemDefault(rule) && handleEdit(rule)} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HiOutlineCash className="w-5 h-5 text-primary" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {rule.rule_name}
                        </h3>
                        {isSystemDefault(rule) && (
                          <Badge variant="default" size="sm">
                            System Default
                          </Badge>
                        )}
                        <Badge variant={getRuleTypeBadgeVariant(rule.rule_type)} size="sm">
                          {getRuleTypeLabel(rule.rule_type)}
                        </Badge>
                        <Badge variant={rule.is_active ? 'success' : 'default'} size="sm">
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {rule.description}
                        </p>
                      )}
                    </div>

                    {/* Rooms Count */}
                    {isSystemDefault(rule) ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        All rooms (default)
                      </span>
                    ) : (
                      <RoomCountBadge
                        rule={rule}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAssignments(rule.id);
                        }}
                      />
                    )}

                    {/* Actions */}
                    {!isSystemDefault(rule) && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(rule);
                          }}
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rule);
                          }}
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.rule && (
          <Modal
            isOpen={deleteConfirmation.isOpen}
            onClose={() => setDeleteConfirmation({ isOpen: false, rule: null })}
            title="Delete Payment Rule"
          >
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>"{deleteConfirmation.rule.rule_name}"</strong>?
              </p>

              {deleteConfirmation.rule.room_count && deleteConfirmation.rule.room_count > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-amber-600 dark:text-amber-500">
                      ⚠️
                    </div>
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      This rule is currently assigned to <strong>{deleteConfirmation.rule.room_count} room{deleteConfirmation.rule.room_count === 1 ? '' : 's'}</strong>.
                      It will be unassigned from all rooms and deleted permanently.
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false, rule: null })}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  Delete Payment Rule
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Room Assignments Modal */}
        {viewingAssignments && (
          <Modal
            isOpen={!!viewingAssignments}
            onClose={() => setViewingAssignments(null)}
            title="Room Assignments"
          >
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  This payment rule is not assigned to any rooms yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment.room_id}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <HiOutlineHome className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {assignment.room_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Modal>
        )}

        {/* Error Modal */}
        {errorModal.isOpen && (
          <Modal
            isOpen={errorModal.isOpen}
            onClose={() => setErrorModal({ isOpen: false, message: '' })}
            title="Error"
          >
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {errorModal.message}
              </p>
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="primary"
                  onClick={() => setErrorModal({ isOpen: false, message: '' })}
                >
                  OK
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
