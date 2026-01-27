/**
 * UserPoliciesTab Component
 *
 * Displays cancellation policies used by a user's properties
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Spinner,
  Badge,
} from '@/components/ui';
import { usersService } from '@/services';

interface RefundTier {
  days: number;
  refund: number;
}

interface CancellationPolicy {
  id: string;
  name: string;
  description: string | null;
  tiers: RefundTier[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PropertyPolicy {
  property_id: string;
  property_name: string;
  policy_id: string | null;
  policy_name: string;
}

interface UserPoliciesTabProps {
  userId: string;
  userName: string;
}

export const UserPoliciesTab: React.FC<UserPoliciesTabProps> = ({ userId, userName }) => {
  // State
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [propertyPolicies, setPropertyPolicies] = useState<PropertyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies
  useEffect(() => {
    fetchPolicies();
  }, [userId]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserPolicies(userId);
      setPolicies(result.policies || []);
      setPropertyPolicies(result.propertyPolicies || []);
    } catch (err: any) {
      console.error('Error fetching user policies:', err);
      setError(err.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const formatRefundTiers = (tiers: RefundTier[]) => {
    if (!tiers || tiers.length === 0) return 'No refund tiers defined';

    // Sort by days descending
    const sortedTiers = [...tiers].sort((a, b) => b.days - a.days);

    return sortedTiers.map((tier, index) => (
      <div key={`${tier.days}-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
        • {tier.days}+ days: {tier.refund}% refund
      </div>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPropertiesUsingPolicy = (policyId: string | null) => {
    return propertyPolicies.filter((pp) => pp.policy_id === policyId);
  };

  const propertiesWithoutPolicy = propertyPolicies.filter((pp) => !pp.policy_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cancellation Policies for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {policies.length} polic{policies.length !== 1 ? 'ies' : 'y'} in use across{' '}
            {propertyPolicies.length} propert{propertyPolicies.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Policies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {policies.length}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Properties with Policy</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {propertyPolicies.filter((pp) => pp.policy_id).length}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Properties without Policy</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {propertiesWithoutPolicy.length}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading policies...</p>
          </Card.Body>
        </Card>
      ) : error ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card.Body>
        </Card>
      ) : propertyPolicies.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No properties found for this user. Add properties to see their cancellation policies.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Policies List */}
          {policies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Cancellation Policies
              </h3>
              {policies.map((policy) => {
                const propertiesUsing = getPropertiesUsingPolicy(policy.id);
                return (
                  <Card key={policy.id}>
                    <Card.Body>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                            {policy.name}
                          </h4>
                          {policy.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {policy.description}
                            </p>
                          )}
                          <div className="mt-3">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                              Refund Tiers
                            </div>
                            <div className="space-y-1">{formatRefundTiers(policy.tiers)}</div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Created: {formatDate(policy.created_at)} • Updated:{' '}
                            {formatDate(policy.updated_at)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge variant="primary" size="sm">
                            {propertiesUsing.length} propert{propertiesUsing.length !== 1 ? 'ies' : 'y'}
                          </Badge>
                        </div>
                      </div>
                      {/* Properties using this policy */}
                      {propertiesUsing.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Properties Using This Policy
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {propertiesUsing.map((pp) => (
                              <Badge key={pp.property_id} variant="secondary" size="sm">
                                {pp.property_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Properties without policy */}
          {propertiesWithoutPolicy.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Properties Without Cancellation Policy
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The following properties do not have a cancellation policy assigned:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {propertiesWithoutPolicy.map((pp) => (
                      <Badge key={pp.property_id} variant="warning" size="sm">
                        {pp.property_name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    These properties should have a cancellation policy assigned to ensure clear refund terms for guests.
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
