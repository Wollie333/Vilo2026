import { useTheme } from '@/context/ThemeContext';
import { ThemeToggleProps } from './ThemeToggle.types';

const SunIcon = () => (
  <svg
    className="w-4 h-4"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
      clipRule="evenodd"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-4 h-4"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

export function ThemeToggle({
  showLabel = false,
  className = '',
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex items-center gap-2 p-1
        bg-gray-200 dark:bg-dark-card
        rounded-full transition-colors
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle track with icons */}
      <div className="flex items-center gap-1 px-1">
        {/* Sun icon */}
        <span
          className={`
            p-1.5 rounded-full transition-all duration-200
            ${!isDark
              ? 'bg-white text-yellow-500 shadow-sm'
              : 'text-gray-400 hover:text-gray-300'
            }
          `}
        >
          <SunIcon />
        </span>

        {/* Moon icon */}
        <span
          className={`
            p-1.5 rounded-full transition-all duration-200
            ${isDark
              ? 'bg-dark-border text-primary shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
            }
          `}
        >
          <MoonIcon />
        </span>
      </div>

      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-2">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
