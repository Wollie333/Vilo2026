/**
 * Variable Documentation Component
 *
 * Displays a table of available template variables with descriptions and examples.
 */

import React from 'react';
import { Card, Badge } from '@/components/ui';
import type { EmailTemplateVariable } from '@/types/email-template.types';

interface VariableDocumentationProps {
  variables: EmailTemplateVariable[];
}

export const VariableDocumentation: React.FC<VariableDocumentationProps> = ({ variables }) => {
  if (variables.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No variables defined for this template yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Available Template Variables
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use these variables in your subject and body templates by wrapping them in double curly braces:
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mx-1 text-xs">
            {'{{variable_name}}'}
          </code>
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Variable
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Example
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Required
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {variables.map((variable, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-primary">
                      {`{{${variable.name}}}`}
                    </code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant="default" size="sm">
                      {variable.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {variable.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {variable.example || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {variable.required ? (
                      <Badge variant="error" size="sm">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        Optional
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Reference */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Usage Examples
          </h4>
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
                Subject: Welcome, {'{{guest_name}}'} - Your Booking Confirmation
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
                Body: Dear {'{{guest_name}}'}, your booking at {'{{property_name}}'} is confirmed for {'{{check_in_date}}'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
