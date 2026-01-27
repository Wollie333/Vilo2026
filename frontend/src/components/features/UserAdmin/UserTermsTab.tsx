/**
 * UserTermsTab Component
 *
 * Displays terms and conditions for a user's properties
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Spinner,
  Badge,
  Button,
} from '@/components/ui';
import { usersService } from '@/services';

interface PropertyTerms {
  id: string;
  name: string;
  terms_and_conditions: string | null;
  updated_at: string;
}

interface UserTermsTabProps {
  userId: string;
  userName: string;
}

export const UserTermsTab: React.FC<UserTermsTabProps> = ({ userId, userName }) => {
  // State
  const [properties, setProperties] = useState<PropertyTerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

  // Fetch terms
  useEffect(() => {
    fetchTerms();
  }, [userId]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserTerms(userId);
      setProperties(result || []);
    } catch (err: any) {
      console.error('Error fetching user terms:', err);
      setError(err.message || 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleExpand = (propertyId: string) => {
    setExpandedPropertyId(expandedPropertyId === propertyId ? null : propertyId);
  };

  const propertiesWithTerms = properties.filter((p) => p.terms_and_conditions);
  const propertiesWithoutTerms = properties.filter((p) => !p.terms_and_conditions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Property Terms & Conditions for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Properties</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {properties.length}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Terms</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {propertiesWithTerms.length}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Without Terms</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {propertiesWithoutTerms.length}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading terms...</p>
          </Card.Body>
        </Card>
      ) : error ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card.Body>
        </Card>
      ) : properties.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No properties found for this user.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Properties with Terms */}
          {propertiesWithTerms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Properties with Terms & Conditions
              </h3>
              {propertiesWithTerms.map((property) => (
                <Card key={property.id}>
                  <Card.Body>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {property.name}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Last updated: {formatDate(property.updated_at)}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleExpand(property.id)}
                        >
                          {expandedPropertyId === property.id ? 'Hide' : 'View'}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Terms Content */}
                    {expandedPropertyId === property.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Terms & Conditions
                        </div>
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 p-4 rounded-md"
                          dangerouslySetInnerHTML={{ __html: property.terms_and_conditions || '' }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          <strong>Note:</strong> To edit these terms, the property owner can update them in
                          their Property Settings → Legal tab.
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Properties without Terms */}
          {propertiesWithoutTerms.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Properties Without Terms & Conditions
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The following properties do not have custom terms and conditions set:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {propertiesWithoutTerms.map((property) => (
                      <Badge key={property.id} variant="warning" size="sm">
                        {property.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Property owners can add custom terms in Property Settings → Legal tab.
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
