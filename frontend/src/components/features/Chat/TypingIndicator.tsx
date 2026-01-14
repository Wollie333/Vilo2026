/**
 * TypingIndicator Component
 * Shows who is currently typing
 */

interface TypingIndicatorProps {
  users: Array<{ user_id: string; full_name: string }>;
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].full_name} is typing`;
    }
    if (users.length === 2) {
      return `${users[0].full_name} and ${users[1].full_name} are typing`;
    }
    return `${users[0].full_name} and ${users.length - 1} others are typing`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* Animated dots */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-dark-card rounded-full">
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>

      {/* Typing text */}
      <span className="text-xs text-gray-500 dark:text-gray-400">{getTypingText()}</span>
    </div>
  );
}
