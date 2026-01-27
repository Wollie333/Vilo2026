/**
 * Start Chat Modal
 *
 * Modal for initiating chat with property host
 * Handles both authenticated and unauthenticated users
 */

import React, { useState } from 'react';
import { Modal, ModalBody } from '@/components/ui/Modal';
import { Button, Input, Alert } from '@/components/ui';
import { chatService, authService } from '@/services';
import { Spinner } from '@/components/ui';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  propertyOwnerId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
  onChatStarted: (conversationId: string) => void;
}

export const StartChatModal: React.FC<StartChatModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  propertyOwnerId,
  isAuthenticated,
  currentUserId,
  onChatStarted,
}) => {
  console.log('[StartChatModal] Rendering', { isOpen, propertyId, isAuthenticated });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle authenticated user - start chat immediately
  const handleAuthenticatedChat = async () => {
    console.log('[StartChatModal] Starting chat for authenticated user');
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if conversation already exists
      const existingConversations = await chatService.getConversations({
        property_id: propertyId,
      });

      console.log('[StartChatModal] Existing conversations:', existingConversations);

      let conversationId: string;

      if (existingConversations.conversations && existingConversations.conversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations.conversations[0].id;
        console.log('[StartChatModal] Using existing conversation:', conversationId);
      } else {
        // Create new conversation
        console.log('[StartChatModal] Creating conversation with owner:', propertyOwnerId);

        if (!propertyOwnerId) {
          throw new Error('Property owner information is not available');
        }

        const newConversation = await chatService.createConversation({
          type: 'guest_inquiry',
          property_id: propertyId,
          participant_user_ids: [propertyOwnerId],
        });
        conversationId = newConversation.id;
        console.log('[StartChatModal] Created new conversation:', conversationId);
      }

      onChatStarted(conversationId);
      onClose();
    } catch (err: any) {
      console.error('[StartChatModal] Failed to start chat:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to start chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle guest user - collect email and create account or login
  const handleGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[StartChatModal] Starting chat for guest user', { email, name });

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Try to check if user exists and start chat
      console.log('[StartChatModal] Checking if user exists...');

      const response = await chatService.startGuestChat({
        property_id: propertyId,
        property_owner_id: propertyOwnerId,
        guest_email: email.trim().toLowerCase(),
        guest_name: name.trim(),
      });

      console.log('[StartChatModal] Guest chat response:', response);

      if (response.conversation_id) {
        // Chat started successfully
        if (response.is_new_user) {
          // New user - show success message about password email
          setSuccessMessage(
            `Welcome! We've created your account and sent a password setup email to ${email}. ` +
            `Opening your chat with ${propertyName}...`
          );

          setTimeout(() => {
            onChatStarted(response.conversation_id);
            onClose();
          }, 2000);
        } else {
          // Existing user - redirect to chat immediately
          setSuccessMessage(`Opening your chat with ${propertyName}...`);

          setTimeout(() => {
            onChatStarted(response.conversation_id);
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('[StartChatModal] Failed to start guest chat:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to start chat. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render authenticated user view
  if (isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Message ${propertyName}`} size="sm">
        <ModalBody>
          <div className="py-6 px-2">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Start a conversation with the property host to ask questions, discuss your stay, or make special requests.
            </p>

            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAuthenticatedChat}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Starting Chat...' : 'Start Chat'}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  // Render guest user view - collect email and name
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Message ${propertyName}`} size="sm">
      <ModalBody>
        <form onSubmit={handleGuestChat} className="py-6 px-2">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To start a chat with the property host, please provide your details below.
          </p>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mb-4">
              {successMessage}
            </Alert>
          )}

          <div className="space-y-4 mb-6">
            <Input
              label="Your Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={isSubmitting || !!successMessage}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              disabled={isSubmitting || !!successMessage}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>New to the platform?</strong> We'll create a guest account for you and send a password setup email.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || !!successMessage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !!successMessage}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Starting Chat...' : 'Start Chat'}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
};
