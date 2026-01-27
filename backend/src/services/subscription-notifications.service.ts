/**
 * Subscription Notifications Service
 * Handles sending email + in-app + chat notifications for subscription management events
 * All subscription actions trigger triple notifications (unless explicitly disabled)
 */

import { createNotification } from './notifications.service';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// NOTIFY UPGRADE REQUEST
// ============================================================================

/**
 * Send upgrade request notification (Email + In-app + Chat)
 * Triggered when admin requests user to upgrade their plan
 */
export const notifyUpgradeRequest = async (
  userId: string,
  adminName: string,
  currentPlanName: string,
  newPlanName: string,
  currentPrice: string,
  newPrice: string,
  currentInterval: string,
  newInterval: string,
  priceDifference: string,
  nextBillingDate: string,
  adminNotes: string,
  requestId: string,
  expiresAt: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const templateData = {
    user_name: user.full_name,
    admin_name: adminName,
    current_plan_name: currentPlanName,
    new_plan_name: newPlanName,
    current_price: currentPrice,
    new_price: newPrice,
    current_interval: currentInterval,
    new_interval: newInterval,
    price_difference: priceDifference,
    next_billing_date: nextBillingDate,
    admin_notes: adminNotes,
    app_url: appUrl,
    expires_at: new Date(expiresAt).toLocaleDateString(),
  };

  // 1. Create in-app notification
  await createNotification({
    user_id: userId,
    template_name: 'subscription_upgrade_request',
    data: templateData,
    action_url: '/profile?tab=billing',
    action_label: 'Review Upgrade',
    send_email: true, // This will trigger email send
  });

  // 2. Create chat message in support conversation (or create new conversation)
  await createUpgradeChatMessage(
    userId,
    adminName,
    currentPlanName,
    newPlanName,
    adminNotes
  );

  logger.info(`Upgrade request notifications sent to user ${userId}`);
};

// ============================================================================
// NOTIFY SUBSCRIPTION PAUSED
// ============================================================================

/**
 * Send subscription paused notification (Email + In-app + Chat)
 * Triggered when admin pauses a user's subscription
 */
export const notifySubscriptionPaused = async (
  userId: string,
  adminName: string,
  planName: string,
  reason: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const templateData = {
    user_name: user.full_name,
    admin_name: adminName,
    plan_name: planName,
    pause_reason: reason,
    app_url: appUrl,
  };

  // 1. Create in-app notification
  await createNotification({
    user_id: userId,
    template_name: 'subscription_paused',
    data: templateData,
    action_url: '/pricing',
    action_label: 'Reactivate Account',
    send_email: true,
  });

  // 2. Create chat message
  await createPausedChatMessage(userId, adminName, planName, reason);

  logger.info(`Subscription paused notifications sent to user ${userId}`);
};

// ============================================================================
// NOTIFY SUBSCRIPTION CANCELLED
// ============================================================================

/**
 * Send subscription cancelled notification (Email + In-app + Chat)
 * Triggered when admin cancels a user's subscription
 */
export const notifySubscriptionCancelled = async (
  userId: string,
  adminName: string,
  planName: string,
  reason: string,
  accessEndsAt: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const templateData = {
    user_name: user.full_name,
    admin_name: adminName,
    plan_name: planName,
    cancel_reason: reason,
    access_end_date: new Date(accessEndsAt).toLocaleDateString(),
    app_url: appUrl,
  };

  // 1. Create in-app notification
  await createNotification({
    user_id: userId,
    template_name: 'subscription_cancelled',
    data: templateData,
    action_url: '/pricing',
    action_label: 'Reactivate Subscription',
    send_email: true,
  });

  // 2. Create chat message
  await createCancelledChatMessage(userId, adminName, planName, reason, accessEndsAt);

  logger.info(`Subscription cancelled notifications sent to user ${userId}`);
};

// ============================================================================
// NOTIFY UPGRADE CONFIRMED
// ============================================================================

/**
 * Send upgrade confirmed notification (Email + In-app + Chat)
 * Triggered when user accepts an upgrade request
 */
export const notifyUpgradeConfirmed = async (
  userId: string,
  currentPlanName: string,
  newPlanName: string,
  currentPrice: string,
  newPrice: string,
  currentInterval: string,
  newInterval: string,
  effectiveDate: string,
  currentPeriodEnd: string,
  newFeatures: string[]
): Promise<void> => {
  const supabase = getAdminClient();

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const templateData = {
    user_name: user.full_name,
    current_plan_name: currentPlanName,
    new_plan_name: newPlanName,
    current_price: currentPrice,
    new_price: newPrice,
    current_interval: currentInterval,
    new_interval: newInterval,
    effective_date: new Date(effectiveDate).toLocaleDateString(),
    current_period_end: new Date(currentPeriodEnd).toLocaleDateString(),
    new_features: newFeatures,
    app_url: appUrl,
  };

  // 1. Create in-app notification
  await createNotification({
    user_id: userId,
    template_name: 'subscription_upgrade_confirmed',
    data: templateData,
    action_url: '/profile?tab=billing',
    action_label: 'View Billing',
    send_email: true,
  });

  // 2. Create chat message
  await createUpgradeConfirmedChatMessage(userId, newPlanName, effectiveDate);

  logger.info(`Upgrade confirmed notifications sent to user ${userId}`);
};

// ============================================================================
// NOTIFY SUBSCRIPTION RESUMED
// ============================================================================

/**
 * Send subscription resumed notification (Email + In-app + Chat)
 * Triggered when admin reactivates a paused subscription
 */
export const notifySubscriptionResumed = async (
  userId: string,
  planName: string,
  price: string,
  interval: string,
  nextBillingDate: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const templateData = {
    user_name: user.full_name,
    plan_name: planName,
    price,
    interval,
    next_billing_date: new Date(nextBillingDate).toLocaleDateString(),
    app_url: appUrl,
  };

  // 1. Create in-app notification
  await createNotification({
    user_id: userId,
    template_name: 'subscription_resumed',
    data: templateData,
    action_url: '/dashboard',
    action_label: 'Go to Dashboard',
    send_email: true,
  });

  // 2. Create chat message
  await createResumedChatMessage(userId, planName);

  logger.info(`Subscription resumed notifications sent to user ${userId}`);
};

// ============================================================================
// HELPER: Create Chat Messages
// ============================================================================

/**
 * Create chat message for upgrade request
 */
async function createUpgradeChatMessage(
  userId: string,
  adminName: string,
  currentPlanName: string,
  newPlanName: string,
  adminNotes: string
): Promise<void> {
  const supabase = getAdminClient();

  // Find or create subscription-related conversation
  const conversation = await findOrCreateSubscriptionConversation(userId);

  // Create system message
  const messageText = `**Subscription Upgrade Recommended**\n\n` +
    `${adminName} has recommended upgrading your subscription from **${currentPlanName}** to **${newPlanName}**.\n\n` +
    `**Admin Notes:**\n${adminNotes}\n\n` +
    `Please review this upgrade request in your billing settings and accept or decline within 7 days.`;

  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: null, // System message
      message_text: messageText,
      message_type: 'system',
    });
}

/**
 * Create chat message for subscription paused
 */
async function createPausedChatMessage(
  userId: string,
  adminName: string,
  planName: string,
  reason: string
): Promise<void> {
  const supabase = getAdminClient();

  const conversation = await findOrCreateSubscriptionConversation(userId);

  const messageText = `**Subscription Paused**\n\n` +
    `Your **${planName}** subscription has been paused by ${adminName}.\n\n` +
    `**Reason:** ${reason}\n\n` +
    `Your account now has read-only access. To restore full access, please select a subscription plan or contact support.`;

  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: null,
      message_text: messageText,
      message_type: 'system',
    });
}

/**
 * Create chat message for subscription cancelled
 */
async function createCancelledChatMessage(
  userId: string,
  adminName: string,
  planName: string,
  reason: string,
  accessEndsAt: string
): Promise<void> {
  const supabase = getAdminClient();

  const conversation = await findOrCreateSubscriptionConversation(userId);

  const messageText = `**Subscription Cancelled**\n\n` +
    `Your **${planName}** subscription has been cancelled by ${adminName}.\n\n` +
    `**Reason:** ${reason}\n\n` +
    `You will retain full access until **${new Date(accessEndsAt).toLocaleDateString()}**. ` +
    `After this date, your account will switch to read-only mode.`;

  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: null,
      message_text: messageText,
      message_type: 'system',
    });
}

/**
 * Create chat message for upgrade confirmed
 */
async function createUpgradeConfirmedChatMessage(
  userId: string,
  newPlanName: string,
  effectiveDate: string
): Promise<void> {
  const supabase = getAdminClient();

  const conversation = await findOrCreateSubscriptionConversation(userId);

  const messageText = `**Subscription Upgrade Confirmed!**\n\n` +
    `Your upgrade to **${newPlanName}** has been confirmed and will take effect on **${new Date(effectiveDate).toLocaleDateString()}**.\n\n` +
    `All new features and increased limits will be available as soon as the upgrade is activated.`;

  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: null,
      message_text: messageText,
      message_type: 'system',
    });
}

/**
 * Create chat message for subscription resumed
 */
async function createResumedChatMessage(
  userId: string,
  planName: string
): Promise<void> {
  const supabase = getAdminClient();

  const conversation = await findOrCreateSubscriptionConversation(userId);

  const messageText = `**Subscription Reactivated!**\n\n` +
    `Welcome back! Your **${planName}** subscription has been successfully reactivated.\n\n` +
    `You now have full access to all features. Normal billing will resume.`;

  await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: null,
      message_text: messageText,
      message_type: 'system',
    });
}

/**
 * Find or create a subscription-related conversation for the user
 */
async function findOrCreateSubscriptionConversation(userId: string): Promise<{ id: string }> {
  const supabase = getAdminClient();

  // Try to find existing subscription conversation
  const { data: existingConv } = await supabase
    .from('chat_conversations')
    .select('id')
    .eq('type', 'support')
    .eq('subject', 'Subscription Management')
    .filter('chat_participants.user_id', 'eq', userId)
    .limit(1)
    .maybeSingle();

  if (existingConv) {
    return existingConv;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('chat_conversations')
    .insert({
      type: 'support',
      subject: 'Subscription Management',
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !newConv) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create conversation');
  }

  // Add user as participant
  await supabase
    .from('chat_participants')
    .insert({
      conversation_id: newConv.id,
      user_id: userId,
      role: 'owner',
    });

  return newConv;
}
