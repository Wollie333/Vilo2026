/**
 * PasswordStrengthIndicator Component
 *
 * Visual indicator showing password strength with requirements checklist
 */

import React from 'react';
import { HiCheck, HiX } from 'react-icons/hi';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  // Password requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  // Calculate strength
  const getStrength = (): { level: number; label: string; color: string } => {
    if (!password) {
      return { level: 0, label: '', color: 'bg-gray-200 dark:bg-gray-700' };
    }

    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;

    if (score === 4) {
      return { level: 4, label: 'Strong', color: 'bg-green-500' };
    } else if (score === 3) {
      return { level: 3, label: 'Good', color: 'bg-blue-500' };
    } else if (score === 2) {
      return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    } else {
      return { level: 1, label: 'Weak', color: 'bg-red-500' };
    }
  };

  const strength = getStrength();

  const requirements = [
    { met: hasMinLength, text: 'At least 8 characters' },
    { met: hasUppercase, text: 'One uppercase letter' },
    { met: hasLowercase, text: 'One lowercase letter' },
    { met: hasNumber, text: 'One number' },
  ];

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      {password && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Password Strength:
            </span>
            <span className={`text-xs font-semibold ${
              strength.level === 4 ? 'text-green-600' :
              strength.level === 3 ? 'text-blue-600' :
              strength.level === 2 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  level <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && password && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs ${
                req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {req.met ? (
                <HiCheck className="w-4 h-4" />
              ) : (
                <HiX className="w-4 h-4 opacity-50" />
              )}
              <span>{req.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
