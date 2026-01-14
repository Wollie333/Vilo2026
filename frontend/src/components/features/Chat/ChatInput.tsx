/**
 * ChatInput Component
 * Rich input area with attachments, emoji picker, and reply preview
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Spinner } from '@/components/ui';
import type { ChatMessage } from '@/types/chat.types';

interface ChatInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxAttachments?: number;
  maxAttachmentSize?: number; // in bytes
}

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const AttachmentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const EmojiIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '👏', '🔥', '💯'];

export function ChatInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  disabled = false,
  placeholder = 'Type a message...',
  maxAttachments = 5,
  maxAttachmentSize = 10 * 1024 * 1024, // 10MB
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with editing message content
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Handle typing indicator with debounce
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.();
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }, [onTyping]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);
    handleTyping();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validate file count
    if (attachments.length + files.length > maxAttachments) {
      setError(`Maximum ${maxAttachments} attachments allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFile = files.find((file) => file.size > maxAttachmentSize);
    if (oversizedFile) {
      setError(`File "${oversizedFile.name}" exceeds ${maxAttachmentSize / 1024 / 1024}MB limit`);
      return;
    }

    setAttachments((prev) => [...prev, ...files]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      await onSend(trimmedContent, attachments.length > 0 ? attachments : undefined);
      setContent('');
      setAttachments([]);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Close emoji picker on Escape
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Replying to{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {replyTo.sender.full_name}
              </span>
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Editing message
            </span>
            <p className="text-sm text-yellow-600 dark:text-yellow-500 truncate">
              {editingMessage.content}
            </p>
          </div>
          <button
            onClick={onCancelEdit}
            className="p-1 text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-200 dark:border-dark-border">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-dark-card rounded-lg text-sm"
            >
              <span className="max-w-[150px] truncate text-gray-700 dark:text-gray-300">
                {file.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({formatFileSize(file.size)})
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= maxAttachments}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <AttachmentIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full transition-colors disabled:opacity-50"
            title="Add emoji"
          >
            <EmojiIcon />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 p-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-10">
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1 text-lg hover:bg-gray-100 dark:hover:bg-dark-border rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-card border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!content.trim() && attachments.length === 0)}
          variant="primary"
          size="sm"
          className="rounded-full !p-2.5"
          title="Send message (Ctrl+Enter)"
        >
          {isSending ? <Spinner size="sm" className="w-5 h-5" /> : <SendIcon />}
        </Button>
      </div>

      {/* Helper text */}
      <div className="px-4 pb-2 text-2xs text-gray-400 dark:text-gray-500">
        Press Ctrl+Enter to send
      </div>
    </div>
  );
}
