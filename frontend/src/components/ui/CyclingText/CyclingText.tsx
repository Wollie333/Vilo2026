import React, { useState, useEffect, useCallback } from 'react';
import type { CyclingTextProps } from './CyclingText.types';

/**
 * CyclingText - Smoothly animates between a list of words
 *
 * Features:
 * - Fade up/down animation
 * - Configurable interval
 * - Smooth transitions
 */
export const CyclingText: React.FC<CyclingTextProps> = ({
  words,
  interval = 3000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayWord, setDisplayWord] = useState(words[0]);

  const cycleWord = useCallback(() => {
    setIsAnimating(true);

    // After fade out, change the word
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
      setDisplayWord(words[(currentIndex + 1) % words.length]);
      setIsAnimating(false);
    }, 300); // Half of the transition duration
  }, [currentIndex, words]);

  useEffect(() => {
    const timer = setInterval(cycleWord, interval);
    return () => clearInterval(timer);
  }, [cycleWord, interval]);

  return (
    <span className={`inline-block relative ${className}`}>
      <span
        className={`
          inline-block transition-all duration-300 ease-in-out
          ${isAnimating
            ? 'opacity-0 transform -translate-y-2'
            : 'opacity-100 transform translate-y-0'
          }
        `}
      >
        {displayWord}
      </span>
    </span>
  );
};

export default CyclingText;
