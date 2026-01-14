/**
 * Payment Rules Service
 *
 * Service for managing payment rules configuration.
 * Handles CRUD operations, validation, and rule application logic.
 */

import { getAdminClient } from '../config/supabase';
import {
  PaymentRule,
  PaymentRuleWithDetails,
  CreatePaymentRuleRequest,
  UpdatePaymentRuleRequest,
  ListPaymentRulesResponse,
  FindActiveRuleOptions,
  PaymentRuleValidationResult,
  PaymentRuleValidationError,
  ScheduleMilestoneConfig,
} from '../types/payment-rules.types';
import { AppError } from '../utils/errors';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new payment rule
 */
export const createPaymentRule = async (
  userId: string,
  input: CreatePaymentRuleRequest
): Promise<PaymentRule> => {
  // Validate the rule
  const validation = validatePaymentRule(input);
  if (!validation.valid) {
    throw new AppError(
      `Invalid payment rule: ${validation.errors.map((e) => e.message).join(', ')}`,
      400
    );
  }

  // Verify user owns the room
  const { data: room, error: roomError } = await getAdminClient()
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', input.room_id)
    .single();

  if (roomError || !room) {
    throw new AppError('Room not found', 404);
  }

  if ((room.properties as any).owner_id !== userId) {
    throw new AppError('You do not have permission to create rules for this room', 403);
  }

  // Create the rule
  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .insert({
      room_id: input.room_id,
      rule_name: input.rule_name,
      description: input.description || null,
      rule_type: input.rule_type,
      deposit_type: input.deposit_type || null,
      deposit_amount: input.deposit_amount || null,
      deposit_due: input.deposit_due || null,
      deposit_due_days: input.deposit_due_days || null,
      balance_due: input.balance_due || null,
      balance_due_days: input.balance_due_days || null,
      schedule_config: input.schedule_config || null,
      allowed_payment_methods: input.allowed_payment_methods || null,
      is_active: input.is_active ?? true,
      applies_to_dates: input.applies_to_dates ?? false,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      priority: input.priority ?? 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create payment rule: ${error.message}`, 500);
  }

  return data as PaymentRule;
};

/**
 * Get a payment rule by ID
 * Works for both room-level and property-level rules
 */
export const getPaymentRule = async (
  userId: string,
  ruleId: string
): Promise<PaymentRuleWithDetails> => {
  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .select(`
      *,
      rooms (
        id,
        name,
        property_id,
        properties!inner (
          id,
          name,
          owner_id
        )
      ),
      properties!room_payment_rules_property_id_fkey (
        id,
        name,
        owner_id
      )
    `)
    .eq('id', ruleId)
    .single();

  if (error || !data) {
    throw new AppError('Payment rule not found', 404);
  }

  // Handle property-level rules (room_id is null)
  if ((data as any).property_id && (data as any).properties) {
    const property = (data as any).properties;

    // Verify ownership
    if (property.owner_id !== userId) {
      throw new AppError('You do not have permission to view this payment rule', 403);
    }

    return {
      ...data,
      room_name: undefined,
      property_id: property.id,
      property_name: property.name,
    } as PaymentRuleWithDetails;
  }

  // Handle room-level rules (room_id is set)
  if ((data as any).room_id && (data as any).rooms) {
    const room = (data as any).rooms;
    const property = room.properties;

    // Verify ownership
    if (property.owner_id !== userId) {
      throw new AppError('You do not have permission to view this payment rule', 403);
    }

    return {
      ...data,
      room_name: room.name,
      property_id: property.id,
      property_name: property.name,
    } as PaymentRuleWithDetails;
  }

  throw new AppError('Payment rule not found or invalid configuration', 404);
};

/**
 * List payment rules for a room
 */
export const listRoomPaymentRules = async (
  userId: string,
  roomId: string
): Promise<ListPaymentRulesResponse> => {
  // Verify user owns the room
  const { data: room, error: roomError } = await getAdminClient()
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new AppError('Room not found', 404);
  }

  if ((room.properties as any).owner_id !== userId) {
    throw new AppError('You do not have permission to view rules for this room', 403);
  }

  // Fetch rules via junction table (room_payment_rule_assignments)
  const { data, error } = await getAdminClient()
    .from('room_payment_rule_assignments')
    .select(`
      payment_rule_id,
      room_payment_rules (*)
    `)
    .eq('room_id', roomId);

  if (error) {
    throw new AppError(`Failed to fetch payment rules: ${error.message}`, 500);
  }

  // Extract payment rules from junction table results
  const rules = (data || [])
    .map((assignment: any) => assignment.room_payment_rules)
    .filter(Boolean) as PaymentRule[];

  // Sort by priority (descending) then created_at (descending)
  rules.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    rules: rules,
    total: rules.length,
  };
};

/**
 * Update a payment rule
 */
export const updatePaymentRule = async (
  userId: string,
  ruleId: string,
  input: UpdatePaymentRuleRequest
): Promise<PaymentRule> => {
  // Get existing rule and verify ownership
  const existing = await getPaymentRule(userId, ruleId);

  // Validate the updated rule
  const mergedRule = { ...existing, ...input };
  const validation = validatePaymentRule(mergedRule as CreatePaymentRuleRequest);
  if (!validation.valid) {
    throw new AppError(
      `Invalid payment rule update: ${validation.errors.map((e) => e.message).join(', ')}`,
      400
    );
  }

  // Check if rule is in use by active bookings
  const isInUse = await isRuleInUse(ruleId);
  if (isInUse && input.is_active === false) {
    throw new AppError(
      'Cannot deactivate rule that is currently being used by active bookings',
      400
    );
  }

  // Update the rule
  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .update({
      rule_name: input.rule_name,
      description: input.description,
      rule_type: input.rule_type,
      deposit_type: input.deposit_type,
      deposit_amount: input.deposit_amount,
      deposit_due: input.deposit_due,
      deposit_due_days: input.deposit_due_days,
      balance_due: input.balance_due,
      balance_due_days: input.balance_due_days,
      schedule_config: input.schedule_config,
      allowed_payment_methods: input.allowed_payment_methods,
      is_active: input.is_active,
      applies_to_dates: input.applies_to_dates,
      start_date: input.start_date,
      end_date: input.end_date,
      priority: input.priority,
    })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update payment rule: ${error.message}`, 500);
  }

  return data as PaymentRule;
};

/**
 * Delete a payment rule
 */
export const deletePaymentRule = async (
  userId: string,
  ruleId: string
): Promise<void> => {
  // Verify ownership
  await getPaymentRule(userId, ruleId);

  // Check if rule is in use
  const isInUse = await isRuleInUse(ruleId);
  if (isInUse) {
    throw new AppError(
      'Cannot delete payment rule that is being used by active bookings. Deactivate it instead.',
      400
    );
  }

  // Delete the rule
  const { error } = await getAdminClient()
    .from('room_payment_rules')
    .delete()
    .eq('id', ruleId);

  if (error) {
    throw new AppError(`Failed to delete payment rule: ${error.message}`, 500);
  }
};

// ============================================================================
// RULE SELECTION & APPLICATION
// ============================================================================

/**
 * Find the active payment rule that applies to a booking
 * Returns the highest priority rule that matches the booking dates
 */
export const findActivePaymentRule = async (
  options: FindActiveRuleOptions
): Promise<PaymentRule | null> => {
  const { room_id, booking_date, check_in_date } = options;

  // Query for active rules for this room
  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .select('*')
    .eq('room_id', room_id)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return null;
  }

  // Filter rules based on date applicability
  const bookingDate = new Date(booking_date);
  const checkInDate = new Date(check_in_date);

  const applicableRules = (data as PaymentRule[]).filter((rule) => {
    // If rule doesn't apply to dates, it's always applicable
    if (!rule.applies_to_dates) {
      return true;
    }

    // Check if check-in date falls within rule's date range
    if (rule.start_date && rule.end_date) {
      const startDate = new Date(rule.start_date);
      const endDate = new Date(rule.end_date);
      return checkInDate >= startDate && checkInDate <= endDate;
    }

    return false;
  });

  // Return highest priority rule (already sorted by priority DESC)
  return applicableRules.length > 0 ? applicableRules[0] : null;
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a payment rule configuration
 */
export function validatePaymentRule(
  input: CreatePaymentRuleRequest | UpdatePaymentRuleRequest
): PaymentRuleValidationResult {
  const errors: PaymentRuleValidationError[] = [];

  // Validate rule_name
  if ('rule_name' in input && (!input.rule_name || input.rule_name.trim().length === 0)) {
    errors.push({ field: 'rule_name', message: 'Rule name is required' });
  }

  // Validate based on rule_type
  if (input.rule_type === 'deposit') {
    // Deposit rule validation
    if (!input.deposit_type) {
      errors.push({ field: 'deposit_type', message: 'Deposit type is required for deposit rules' });
    }
    if (!input.deposit_amount || input.deposit_amount <= 0) {
      errors.push({
        field: 'deposit_amount',
        message: 'Deposit amount must be greater than 0',
      });
    }
    if (input.deposit_type === 'percentage' && input.deposit_amount && input.deposit_amount > 100) {
      errors.push({
        field: 'deposit_amount',
        message: 'Deposit percentage cannot exceed 100%',
      });
    }
    if (!input.deposit_due) {
      errors.push({ field: 'deposit_due', message: 'Deposit due timing is required' });
    }
    if (
      (input.deposit_due === 'days_before_checkin' || input.deposit_due === 'days_after_booking') &&
      (!input.deposit_due_days || input.deposit_due_days < 0)
    ) {
      errors.push({
        field: 'deposit_due_days',
        message: 'Days value is required and must be >= 0',
      });
    }
    if (!input.balance_due) {
      errors.push({ field: 'balance_due', message: 'Balance due timing is required' });
    }
    if (
      (input.balance_due === 'days_before_checkin' || input.balance_due === 'days_after_booking') &&
      (!input.balance_due_days || input.balance_due_days < 0)
    ) {
      errors.push({
        field: 'balance_due_days',
        message: 'Days value is required and must be >= 0',
      });
    }
  } else if (input.rule_type === 'payment_schedule') {
    // Payment schedule validation
    if (!input.schedule_config || input.schedule_config.length === 0) {
      errors.push({
        field: 'schedule_config',
        message: 'Payment schedule must have at least one milestone',
      });
    } else {
      // Validate schedule milestones
      const scheduleErrors = validateScheduleConfig(input.schedule_config);
      errors.push(...scheduleErrors);
    }
  }

  // Validate seasonal dates if applicable
  if (input.applies_to_dates) {
    if (!input.start_date || !input.end_date) {
      errors.push({
        field: 'dates',
        message: 'Start and end dates are required when rule applies to specific dates',
      });
    } else if (new Date(input.start_date) > new Date(input.end_date)) {
      errors.push({
        field: 'dates',
        message: 'Start date must be before or equal to end date',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment schedule configuration
 */
function validateScheduleConfig(
  milestones: ScheduleMilestoneConfig[]
): PaymentRuleValidationError[] {
  const errors: PaymentRuleValidationError[] = [];

  // Check sequences are consecutive starting from 1
  const sequences = milestones.map((m) => m.sequence).sort((a, b) => a - b);
  for (let i = 0; i < sequences.length; i++) {
    if (sequences[i] !== i + 1) {
      errors.push({
        field: 'schedule_config',
        message: `Milestone sequences must be consecutive starting from 1`,
      });
      break;
    }
  }

  // Validate each milestone
  milestones.forEach((milestone, index) => {
    if (!milestone.name || milestone.name.trim().length === 0) {
      errors.push({
        field: `schedule_config[${index}].name`,
        message: `Milestone ${milestone.sequence} must have a name`,
      });
    }

    if (!milestone.amount_type) {
      errors.push({
        field: `schedule_config[${index}].amount_type`,
        message: `Milestone ${milestone.sequence} must have an amount type`,
      });
    }

    if (!milestone.amount || milestone.amount <= 0) {
      errors.push({
        field: `schedule_config[${index}].amount`,
        message: `Milestone ${milestone.sequence} amount must be greater than 0`,
      });
    }

    if (milestone.amount_type === 'percentage' && milestone.amount > 100) {
      errors.push({
        field: `schedule_config[${index}].amount`,
        message: `Milestone ${milestone.sequence} percentage cannot exceed 100%`,
      });
    }

    if (!milestone.due) {
      errors.push({
        field: `schedule_config[${index}].due`,
        message: `Milestone ${milestone.sequence} must have a due timing`,
      });
    }

    if (
      (milestone.due === 'days_before_checkin' || milestone.due === 'days_after_booking') &&
      (milestone.days === undefined || milestone.days < 0)
    ) {
      errors.push({
        field: `schedule_config[${index}].days`,
        message: `Milestone ${milestone.sequence} requires days value >= 0`,
      });
    }

    if (milestone.due === 'specific_date' && !milestone.specific_date) {
      errors.push({
        field: `schedule_config[${index}].specific_date`,
        message: `Milestone ${milestone.sequence} requires a specific date`,
      });
    }
  });

  // Check that percentages sum to 100% (if all milestones use percentage)
  const allPercentages = milestones.every((m) => m.amount_type === 'percentage');
  if (allPercentages) {
    const totalPercentage = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      // Allow 0.01 tolerance for floating point
      errors.push({
        field: 'schedule_config',
        message: `Milestone percentages must sum to 100% (current: ${totalPercentage}%)`,
      });
    }
  }

  return errors;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a payment rule is currently in use by any active bookings
 */
async function isRuleInUse(ruleId: string): Promise<boolean> {
  const { data, error } = await getAdminClient()
    .from('booking_payment_schedules')
    .select('id')
    .eq('created_from_rule_id', ruleId)
    .limit(1);

  if (error) {
    console.error('Error checking if rule is in use:', error);
    return false;
  }

  return data !== null && data.length > 0;
}

// ============================================================================
// CENTRALIZED MANAGEMENT - Global Listing & Room Assignments
// ============================================================================

/**
 * List all payment rules across user's properties with room counts
 * For centralized management page
 */
export const listAllPaymentRules = async (
  userId: string,
  propertyId?: string
): Promise<ListPaymentRulesResponse> => {
  // Query room_payment_rules directly and join with properties via room_id OR property_id
  // ALSO join with room_payment_rule_assignments to get assigned rooms count
  const query = getAdminClient()
    .from('room_payment_rules')
    .select(`
      *,
      rooms (
        id,
        name,
        property_id,
        properties!inner (
          owner_id
        )
      ),
      properties!room_payment_rules_property_id_fkey (
        id,
        name,
        owner_id
      ),
      room_payment_rule_assignments (
        id,
        room_id,
        assigned_at
      )
    `)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[listAllPaymentRules] Query error:', error);
    throw new AppError(`Failed to fetch payment rules: ${error.message}`, 500);
  }

  console.log('[listAllPaymentRules] Raw data:', JSON.stringify(data, null, 2));
  console.log('[listAllPaymentRules] User ID:', userId);
  console.log('[listAllPaymentRules] Property filter:', propertyId);

  // Filter by ownership AND property (if specified) - check both room-level and property-level rules
  const filteredRules = (data || []).filter((rule: any) => {
    console.log('[Filter] Rule:', rule.id, 'property_id:', rule.property_id, 'room_id:', rule.room_id);

    // Property-level rules (room_id is null, property_id is set)
    if (rule.property_id && rule.properties) {
      const ownershipMatch = rule.properties.owner_id === userId;
      const propertyMatch = !propertyId || rule.property_id === propertyId;
      const matches = ownershipMatch && propertyMatch;
      console.log('[Filter] Property-level check: ownership=', ownershipMatch, 'property=', propertyMatch, 'result=', matches);
      return matches;
    }

    // Room-level rules (room_id is set, property_id is null)
    if (rule.room_id && rule.rooms) {
      const ownershipMatch = rule.rooms.properties?.owner_id === userId;
      const propertyMatch = !propertyId || rule.rooms.property_id === propertyId;
      const matches = ownershipMatch && propertyMatch;
      console.log('[Filter] Room-level check: ownership=', ownershipMatch, 'property=', propertyMatch, 'result=', matches);
      return matches;
    }

    console.log('[Filter] No match - returning false');
    return false;
  });

  console.log('[listAllPaymentRules] Filtered rules count:', filteredRules.length);

  // Map rules to include room_count and assigned_room_ids from the junction table
  const rulesWithCount = filteredRules.map((rule: any) => ({
    ...rule,
    room_count: rule.room_payment_rule_assignments?.length || 0,
    assigned_room_ids: rule.room_payment_rule_assignments?.map((a: any) => a.room_id) || [],
  }));

  return {
    rules: rulesWithCount as PaymentRule[],
    total: rulesWithCount.length,
  };
};

/**
 * Get assigned rooms for a payment rule
 */
export const getPaymentRuleAssignments = async (
  userId: string,
  ruleId: string
): Promise<{ room_id: string; room_name: string }[]> => {
  // Verify ownership first
  await getPaymentRule(userId, ruleId);

  const { data, error } = await getAdminClient()
    .from('room_payment_rule_assignments')
    .select(`
      room_id,
      rooms!inner (
        id,
        name
      )
    `)
    .eq('payment_rule_id', ruleId);

  if (error) {
    throw new AppError(`Failed to fetch rule assignments: ${error.message}`, 500);
  }

  return (data || []).map((assignment: any) => ({
    room_id: assignment.room_id,
    room_name: assignment.rooms.name,
  }));
};

/**
 * Assign payment rule to multiple rooms
 */
export const assignPaymentRuleToRooms = async (
  userId: string,
  ruleId: string,
  roomIds: string[]
): Promise<void> => {
  // Verify ownership of the rule
  await getPaymentRule(userId, ruleId);

  // Verify user owns all rooms
  for (const roomId of roomIds) {
    const { data: room, error } = await getAdminClient()
      .from('rooms')
      .select('id, property_id, properties!inner(owner_id)')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      throw new AppError(`Room ${roomId} not found`, 404);
    }

    if ((room.properties as any).owner_id !== userId) {
      throw new AppError(`You do not have permission to modify room ${roomId}`, 403);
    }
  }

  // Insert assignments (ON CONFLICT DO NOTHING handles duplicates)
  const assignments = roomIds.map((roomId) => ({
    room_id: roomId,
    payment_rule_id: ruleId,
    assigned_by: userId,
  }));

  const { error } = await getAdminClient()
    .from('room_payment_rule_assignments')
    .upsert(assignments, { onConflict: 'room_id,payment_rule_id' });

  if (error) {
    throw new AppError(`Failed to assign payment rule to rooms: ${error.message}`, 500);
  }
};

/**
 * Unassign payment rule from a room
 */
export const unassignPaymentRuleFromRoom = async (
  userId: string,
  ruleId: string,
  roomId: string
): Promise<void> => {
  // Verify ownership
  await getPaymentRule(userId, ruleId);

  // Verify room ownership
  const { data: room, error: roomError } = await getAdminClient()
    .from('rooms')
    .select('id, property_id, properties!inner(owner_id)')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new AppError('Room not found', 404);
  }

  if ((room.properties as any).owner_id !== userId) {
    throw new AppError('You do not have permission to modify this room', 403);
  }

  // Delete the assignment
  const { error } = await getAdminClient()
    .from('room_payment_rule_assignments')
    .delete()
    .eq('payment_rule_id', ruleId)
    .eq('room_id', roomId);

  if (error) {
    throw new AppError(`Failed to unassign payment rule: ${error.message}`, 500);
  }
};

// ============================================================================
// GLOBAL PROPERTY-LEVEL CRUD OPERATIONS
// ============================================================================

/**
 * Create a payment rule at property level (without room_id)
 */
export const createPaymentRuleGlobal = async (
  userId: string,
  propertyId: string,
  input: Omit<CreatePaymentRuleRequest, 'room_id'>
): Promise<PaymentRule> => {
  // Validate the rule
  const validation = validatePaymentRule({ ...input, room_id: 'placeholder' } as CreatePaymentRuleRequest);
  if (!validation.valid) {
    throw new AppError(
      `Invalid payment rule: ${validation.errors.map((e) => e.message).join(', ')}`,
      400
    );
  }

  // Verify user owns the property
  const { data: property, error: propertyError } = await getAdminClient()
    .from('properties')
    .select('id, owner_id')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    throw new AppError('Property not found', 404);
  }

  if (property.owner_id !== userId) {
    throw new AppError('You do not have permission to create rules for this property', 403);
  }

  // Create the rule (property-level, no room_id)
  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .insert({
      property_id: propertyId,
      room_id: null,  // Property-level rule
      rule_name: input.rule_name,
      description: input.description || null,
      rule_type: input.rule_type,
      deposit_type: input.deposit_type || null,
      deposit_amount: input.deposit_amount || null,
      deposit_due: input.deposit_due || null,
      deposit_due_days: input.deposit_due_days || null,
      balance_due: input.balance_due || null,
      balance_due_days: input.balance_due_days || null,
      schedule_config: input.schedule_config || null,
      allowed_payment_methods: input.allowed_payment_methods || null,
      is_active: input.is_active ?? true,
      applies_to_dates: input.applies_to_dates ?? false,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      priority: input.priority ?? 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create payment rule: ${error.message}`, 500);
  }

  return data as PaymentRule;
};

/**
 * Validate if a payment rule can be edited
 * Returns false if the rule is assigned to any rooms
 */
export const validateRuleEditPermission = async (
  ruleId: string,
  userId: string
): Promise<{ canEdit: boolean; assignedRoomCount: number; roomNames: string[] }> => {
  const assignments = await getPaymentRuleAssignments(userId, ruleId);

  return {
    canEdit: assignments.length === 0,
    assignedRoomCount: assignments.length,
    roomNames: assignments.map((a) => a.room_name || a.room_id),
  };
};

/**
 * Update a payment rule by ID (property-level)
 */
export const updatePaymentRuleGlobal = async (
  userId: string,
  ruleId: string,
  input: UpdatePaymentRuleRequest
): Promise<PaymentRule> => {
  // Get existing rule to verify ownership
  const existingRule = await getPaymentRule(userId, ruleId);

  // Check if rule is assigned to any rooms before allowing edits
  const editPermission = await validateRuleEditPermission(ruleId, userId);
  if (!editPermission.canEdit) {
    throw new AppError(
      'RULE_IN_USE',
      `Cannot edit payment rule: it is currently assigned to ${editPermission.assignedRoomCount} room(s). ` +
      `Please unassign from all rooms before editing.`,
      400
    );
  }

  // Validate the updated rule
  if (input.rule_type || Object.keys(input).length > 1) {
    const fullRule = { ...existingRule, ...input } as CreatePaymentRuleRequest;
    const validation = validatePaymentRule(fullRule);
    if (!validation.valid) {
      throw new AppError(
        `Invalid payment rule: ${validation.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }
  }

  // Update the rule
  const updateData: any = {};
  if (input.rule_name !== undefined) updateData.rule_name = input.rule_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.rule_type !== undefined) updateData.rule_type = input.rule_type;
  if (input.deposit_type !== undefined) updateData.deposit_type = input.deposit_type;
  if (input.deposit_amount !== undefined) updateData.deposit_amount = input.deposit_amount;
  if (input.deposit_due !== undefined) updateData.deposit_due = input.deposit_due;
  if (input.deposit_due_days !== undefined) updateData.deposit_due_days = input.deposit_due_days;
  if (input.balance_due !== undefined) updateData.balance_due = input.balance_due;
  if (input.balance_due_days !== undefined) updateData.balance_due_days = input.balance_due_days;
  if (input.schedule_config !== undefined) updateData.schedule_config = input.schedule_config;
  if (input.allowed_payment_methods !== undefined) updateData.allowed_payment_methods = input.allowed_payment_methods;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.applies_to_dates !== undefined) updateData.applies_to_dates = input.applies_to_dates;
  if (input.start_date !== undefined) updateData.start_date = input.start_date;
  if (input.end_date !== undefined) updateData.end_date = input.end_date;
  if (input.priority !== undefined) updateData.priority = input.priority;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await getAdminClient()
    .from('room_payment_rules')
    .update(updateData)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update payment rule: ${error.message}`, 500);
  }

  return data as PaymentRule;
};

/**
 * Delete a payment rule by ID (property-level)
 */
export const deletePaymentRuleGlobal = async (
  userId: string,
  ruleId: string
): Promise<void> => {
  // Verify ownership
  await getPaymentRule(userId, ruleId);

  // First, unassign the rule from all rooms (cascade delete)
  const { error: unassignError } = await getAdminClient()
    .from('room_payment_rule_assignments')
    .delete()
    .eq('payment_rule_id', ruleId);

  if (unassignError) {
    throw new AppError(`Failed to unassign payment rule from rooms: ${unassignError.message}`, 500);
  }

  // Then delete the rule
  const { error } = await getAdminClient()
    .from('room_payment_rules')
    .delete()
    .eq('id', ruleId);

  if (error) {
    throw new AppError(`Failed to delete payment rule: ${error.message}`, 500);
  }
};

/**
 * Get a payment rule by ID (for editing)
 */
export const getPaymentRuleById = async (
  userId: string,
  ruleId: string
): Promise<PaymentRule> => {
  const { data, error} = await getAdminClient()
    .from('room_payment_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error || !data) {
    throw new AppError('Payment rule not found', 404);
  }

  // Verify ownership through property
  const { data: property } = await getAdminClient()
    .from('properties')
    .select('owner_id')
    .eq('id', data.property_id)
    .single();

  if (!property || property.owner_id !== userId) {
    throw new AppError('You do not have permission to access this payment rule', 403);
  }

  return data as PaymentRule;
};
