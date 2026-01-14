/**
 * Payment Rule Detail Page
 *
 * Displays complete details of a payment rule with tabs for:
 * - Overview: Rule configuration
 * - Rooms: Assigned rooms with management
 * - History: Change history (audit log)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineLockClosed,
  HiOutlineHome,
} from 'react-icons/hi';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
} from '@/components/ui';
import { paymentRulesService } from '@/services';
import { PaymentRule, RuleEditPermission } from '@/types/payment-rules.types';

type TabValue = 'overview' | 'rooms' | 'history';

export const PaymentRuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL or default to 'overview'
  const activeTab = (searchParams.get('tab') as TabValue) || 'overview';

  // State
  const [rule, setRule] = useState<PaymentRule | null>(null);
  const [editPermission, setEditPermission] = useState<RuleEditPermission | null>(null);
  const [assignments, setAssignments] = useState<Array<{ room_id: string; room_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRuleDetails();
      fetchEditPermission();
      fetchAssignments();
    }
  }, [id]);

  const fetchRuleDetails = async () => {
    if (!id) return;

    try {
      const data = await paymentRulesService.getPaymentRuleById(id);
      setRule(data);
    } catch (err) {
      setError('Failed to load payment rule details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEditPermission = async () => {
    if (!id) return;

    try {
      const permission = await paymentRulesService.checkEditPermission(id);
      setEditPermission(permission);
    } catch (err) {
      console.error('Failed to check edit permission:', err);
    }
  };

  const fetchAssignments = async () => {
    if (!id) return;

    try {
      const data = await paymentRulesService.getPaymentRuleAssignments(id);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to fetch room assignments:', err);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleEdit = () => {
    if (editPermission?.canEdit) {
      navigate(`/manage/rooms/payment-rules/${id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!id || !rule) return;

    const confirmMsg = editPermission?.canEdit
      ? `Are you sure you want to delete the payment rule "${rule.rule_name}"?`
      : `Cannot delete this rule - it is assigned to ${editPermission?.assignedRoomCount} room(s). Please unassign all rooms first.`;

    if (!editPermission?.canEdit) {
      alert(confirmMsg);
      return;
    }

    if (!confirm(confirmMsg)) return;

    try {
      await paymentRulesService.deletePaymentRuleGlobal(id);
      navigate('/manage/rooms/payment-rules');
    } catch (err) {
      alert('Failed to delete payment rule. It may still be assigned to rooms.');
      console.error(err);
    }
  };

  const handleUnassign = async (roomId: string) => {
    if (!id) return;

    if (!confirm('Are you sure you want to unassign this room from the payment rule?')) return;

    try {
      await paymentRulesService.unassignPaymentRuleFromRoom(id, roomId);
      await fetchAssignments();
      await fetchEditPermission(); // Refresh edit permission after unassigning
      await fetchRuleDetails(); // Refresh rule to update room count
    } catch (err) {
      alert('Failed to unassign room from payment rule.');
      console.error(err);
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'deposit':
        return 'Deposit + Balance';
      case 'payment_schedule':
        return 'Payment Schedule';
      case 'flexible':
        return 'Flexible Payment';
      default:
        return ruleType;
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !rule) {
    return (
      <AuthenticatedLayout>
        <Alert variant="error" className="mb-6">
          {error || 'Payment rule not found'}
        </Alert>
        <Button variant="outline" onClick={() => navigate('/manage/rooms/payment-rules')}>
          ← Back to Payment Rules
        </Button>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/manage/rooms/payment-rules')}
          className="flex items-center gap-2"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Payment Rules
        </Button>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleEdit}
            disabled={!editPermission?.canEdit}
            className="flex items-center gap-2"
            title={!editPermission?.canEdit ? `Cannot edit: assigned to ${editPermission?.assignedRoomCount} rooms` : ''}
          >
            <HiOutlinePencil className="w-4 h-4" />
            Edit Rule
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Delete Rule
          </Button>
        </div>
      </div>

      {/* Read-only Banner (if in use) */}
      {editPermission && !editPermission.canEdit && (
        <Alert variant="warning" className="mb-6">
          <HiOutlineLockClosed className="w-5 h-5" />
          <div>
            <strong>This rule is currently in use</strong>
            <p>
              This payment rule is assigned to {editPermission.assignedRoomCount} room(s) and cannot be edited.
              To modify this rule, first unassign it from all rooms in the "Rooms" tab.
            </p>
          </div>
        </Alert>
      )}

      {/* Rule Header Card */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {rule.rule_name}
              </h1>
              {rule.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {rule.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={rule.is_active ? 'success' : 'default'}>
                {rule.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="info">
                {rule.room_count || 0} {rule.room_count === 1 ? 'room' : 'rooms'}
              </Badge>
              <Badge variant="default">
                {getRuleTypeLabel(rule.rule_type)}
              </Badge>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">
            Rooms ({rule.room_count || 0})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <Card.Header>Payment Rule Configuration</Card.Header>
            <Card.Body>
              <div className="space-y-6">
                {/* Rule Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rule Type
                  </h3>
                  <Badge variant="info">{getRuleTypeLabel(rule.rule_type)}</Badge>
                </div>

                {/* Deposit Configuration */}
                {rule.rule_type === 'deposit' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Deposit Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Deposit Type:</span>
                        <span className="ml-2 font-medium">{rule.deposit_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Deposit Amount:</span>
                        <span className="ml-2 font-medium">
                          {rule.deposit_type === 'percentage' ? `${rule.deposit_amount}%` : `R${rule.deposit_amount}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Deposit Due:</span>
                        <span className="ml-2 font-medium">{rule.deposit_due}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Balance Due:</span>
                        <span className="ml-2 font-medium">{rule.balance_due}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Configuration */}
                {rule.rule_type === 'payment_schedule' && rule.schedule_config && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Schedule
                    </h3>
                    <div className="space-y-2">
                      {rule.schedule_config.map((milestone, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-md">
                          <div>
                            <p className="font-medium">{milestone.name}</p>
                            <p className="text-sm text-gray-500">Due: {milestone.due}</p>
                          </div>
                          <Badge variant="default">
                            {milestone.amount_type === 'percentage' ? `${milestone.amount}%` : `R${milestone.amount}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicability */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Applicability
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <Badge variant={rule.is_active ? 'success' : 'default'} className="ml-2">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                      <span className="ml-2 font-medium">{rule.priority}</span>
                    </div>
                    {rule.applies_to_dates && (
                      <>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                          <span className="ml-2 font-medium">{rule.start_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                          <span className="ml-2 font-medium">{rule.end_date}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3>Assigned Rooms</h3>
                <Button
                  variant="primary"
                  onClick={() => {
                    // TODO: Implement assign rooms modal/page
                    alert('Assign rooms functionality - to be implemented');
                  }}
                >
                  + Assign to Rooms
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <HiOutlineHome className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No rooms assigned
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    This payment rule is not currently assigned to any rooms.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      // TODO: Implement assign rooms modal/page
                      alert('Assign rooms functionality - to be implemented');
                    }}
                  >
                    Assign to Rooms
                  </Button>
                </div>
              ) : (
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.Header>Room Name</Table.Header>
                      <Table.Header>Room ID</Table.Header>
                      <Table.Header>Actions</Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {assignments.map((assignment) => (
                      <Table.Row key={assignment.room_id}>
                        <Table.Cell>{assignment.room_name || 'Unnamed Room'}</Table.Cell>
                        <Table.Cell className="text-gray-500">{assignment.room_id}</Table.Cell>
                        <Table.Cell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassign(assignment.room_id)}
                          >
                            Unassign
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Card.Body>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <Card.Header>Change History</Card.Header>
            <Card.Body>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Audit log integration coming soon
                </p>
              </div>
            </Card.Body>
          </Card>
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};

export default PaymentRuleDetailPage;
