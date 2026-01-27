/**
 * WhatsAppReplyInput Component
 * Smart input for replying to WhatsApp conversations with 24-hour window awareness
 */

import { useState, useEffect, useRef } from 'react';
import { Input, Button, Alert, Badge } from '@/components/ui';
import { chatService } from '@/services';

interface WhatsAppReplyInputProps {
  conversationId: string;
  recipientPhone: string;
  onSent: () => void;
}

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function WhatsAppReplyInput({
  conversationId,
  recipientPhone,
  onSent,
}: WhatsAppReplyInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [windowActive, setWindowActive] = useState(true);
  const [checkingWindow, setCheckingWindow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check conversation window on mount
  useEffect(() => {
    checkWindow();
  }, [conversationId]);

  const checkWindow = async () => {
    try {
      setCheckingWindow(true);
      const result = await chatService.checkWhatsAppWindow(conversationId);
      setWindowActive(result.windowActive);
    } catch (error) {
      console.error('Failed to check window:', error);
      setWindowActive(false); // Assume expired on error
    } finally {
      setCheckingWindow(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);
      setError(null);

      await chatService.replyWhatsApp(conversationId, {
        content: message,
        recipientPhone,
      });

      setMessage('');
      onSent();
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('Failed to send reply:', error);

      if (error.response?.data?.error === 'template_required') {
        setWindowActive(false);
        setError('24-hour window expired. Template messaging coming soon.');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading state
  if (checkingWindow) {
    return (
      <div className="border-t border-gray-200 dark:border-dark-border p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Checking conversation status...</span>
        </div>
      </div>
    );
  }

  // Window expired - template required
  if (!windowActive) {
    return (
      <div className="border-t border-gray-200 dark:border-dark-border p-4">
        <Alert variant="warning" className="mb-0">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                24-Hour Conversation Window Expired
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                More than 24 hours have passed since the guest's last message. WhatsApp requires
                using pre-approved templates to continue the conversation.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                Template messaging feature is coming soon. For now, please wait for the guest to
                send another message to reopen the conversation window.
              </p>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Active window - free-form messaging allowed
  return (
    <div className="border-t border-gray-200 dark:border-dark-border">
      {/* Status Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-sidebar border-b border-gray-200 dark:border-dark-border">
        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Replying via WhatsApp
        </span>
        <Badge variant="success" size="sm" className="text-xs">
          Free-form allowed
        </Badge>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pt-3">
          <Alert variant="error" className="text-sm mb-0">
            {error}
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-4">
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            className="resize-none"
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Press Enter to send • {message.length}/4096 characters
          </p>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending || message.length > 4096}
          isLoading={sending}
          variant="primary"
          className="flex-shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
