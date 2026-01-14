import React, { useState, useEffect } from 'react';
import { Spinner, LogoIcon } from '@/components/ui';

const MESSAGES = [
  'Creating your account...',
  'Let\'s get you set up...',
  'Almost ready...',
];

const MESSAGE_INTERVAL = 2500; // Change message every 2.5 seconds

export const InitializationLoader: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setFadeClass('opacity-0');

      // After fade out, change message and fade in
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setFadeClass('opacity-100');
      }, 300); // Match transition duration
    }, MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg">
      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <LogoIcon size="lg" />
            </div>

            {/* Spinner */}
            <div className="mb-6 flex justify-center">
              <Spinner size="xl" variant="primary" />
            </div>

            {/* Cycling message with fade transition */}
            <p
              className={`text-lg font-medium text-gray-700 dark:text-gray-300 transition-opacity duration-300 ${fadeClass}`}
            >
              {MESSAGES[currentMessageIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Vilo. All rights reserved.
      </div>
    </div>
  );
};
