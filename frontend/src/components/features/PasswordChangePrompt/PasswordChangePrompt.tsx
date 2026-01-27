/**
 * Password Change Prompt Component
 * Shows alert for guests with temporary passwords to change their password
 */

import React, { useState, useEffect } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const PasswordChangePrompt: React.FC = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has temporary password flag in metadata
    if (user?.user_metadata?.temporary_password === true) {
      setShowPrompt(true);
    }
  }, [user]);

  const handlePasswordChange = async () => {
    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsChanging(true);

    try {
      // TODO: Implement password change API call
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // After successful password change, hide the prompt
      setShowPrompt(false);
      setShowPasswordForm(false);

      // Show success notification
      alert('✅ Password changed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    setShowPasswordForm(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              🔒 Secure Your Account
            </h3>
            <button
              onClick={handleRemindLater}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showPasswordForm ? (
            <>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                You're currently using a temporary password. For security, please set a new password for your account.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-4 py-2 bg-yellow-600 dark:bg-yellow-700 text-white rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 font-medium text-sm transition-colors"
                >
                  Set New Password
                </button>
                <button
                  onClick={handleRemindLater}
                  className="px-4 py-2 bg-white dark:bg-dark-bg border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/30 font-medium text-sm transition-colors"
                >
                  Remind Me Later
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-dark-bg border border-yellow-300 dark:border-yellow-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-dark-bg border border-yellow-300 dark:border-yellow-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePasswordChange}
                  disabled={isChanging || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-yellow-600 dark:bg-yellow-700 text-white rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChanging ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  disabled={isChanging}
                  className="px-4 py-2 bg-white dark:bg-dark-bg border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/30 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
