import { useState } from 'react';

interface ColorSwatchProps {
  name: string;
  hex: string;
  className?: string;
}

export function ColorSwatch({ name, hex, className = '' }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`group flex flex-col items-center transition-transform hover:scale-105 ${className}`}
      title={`Click to copy ${hex}`}
    >
      <div
        className="w-16 h-16 rounded-lg shadow-sm border border-gray-200 dark:border-dark-border mb-2 relative overflow-hidden"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-2xs font-medium text-gray-700 dark:text-gray-300">
        {name}
      </span>
      <span className="text-2xs text-gray-500 dark:text-gray-400 uppercase">
        {hex}
      </span>
    </button>
  );
}

interface ColorPaletteProps {
  name: string;
  colors: Record<string, string>;
  className?: string;
}

export function ColorPalette({ name, colors, className = '' }: ColorPaletteProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
        {name}
      </h4>
      <div className="flex flex-wrap gap-3">
        {Object.entries(colors).map(([shade, hex]) => (
          <ColorSwatch
            key={shade}
            name={shade === 'DEFAULT' ? name : shade}
            hex={hex as string}
          />
        ))}
      </div>
    </div>
  );
}
