/**
 * ChatHubPage
 * Central hub for messaging and communication
 */

import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';

export function ChatHubPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AuthenticatedLayout
      title="Messages"
      subtitle="All conversations, support tickets, and team communication"
    >
      {/* Tab Content */}
      <Outlet />
    </AuthenticatedLayout>
  );
}
