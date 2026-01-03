import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute, PublicRoute, AdminRoute, SuperAdminRoute } from '@/routes';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { Dashboard } from '@/pages/Dashboard';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from '@/pages/auth';
import {
  UserListPage,
  UserDetailPage,
  CreateUserPage,
  PendingApprovalsPage,
  RoleManagementPage,
  CreateRolePage,
  AuditLogPage,
  AdminDashboardPage,
} from '@/pages/admin';
import { ProfilePage } from '@/pages/profile';
import {
  DesignSystemOverview,
  ButtonsShowcase,
  FormsShowcase,
  CardsShowcase,
  UIElementsShowcase,
  ModalsShowcase,
  ChartsShowcase,
  ColorsTypography,
  NavigationShowcase,
  DataDisplayShowcase,
  FeedbackShowcase,
  FormControlsShowcase,
} from '@/pages/design-system';

const PendingApprovalPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-2xl font-bold mb-4">Pending Approval</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Your account is awaiting admin approval. You will be notified once approved.
      </p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Unauthorized</h1>
      <p className="text-gray-600 dark:text-gray-400">
        You do not have permission to access this page.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UserListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/new"
              element={
                <SuperAdminRoute>
                  <CreateUserPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <AdminRoute>
                  <UserDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <AdminRoute>
                  <PendingApprovalsPage />
                </AdminRoute>
              }
            />

            {/* Super Admin routes */}
            <Route
              path="/admin/roles"
              element={
                <SuperAdminRoute>
                  <RoleManagementPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/roles/new"
              element={
                <SuperAdminRoute>
                  <CreateRolePage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <SuperAdminRoute>
                  <AuditLogPage />
                </SuperAdminRoute>
              }
            />

            {/* Design System routes - Admin Only */}
            <Route
              path="/design-system"
              element={
                <AdminRoute>
                  <DesignSystemOverview />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/buttons"
              element={
                <AdminRoute>
                  <ButtonsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/forms"
              element={
                <AdminRoute>
                  <FormsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/cards"
              element={
                <AdminRoute>
                  <CardsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/elements"
              element={
                <AdminRoute>
                  <UIElementsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/modals"
              element={
                <AdminRoute>
                  <ModalsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/charts"
              element={
                <AdminRoute>
                  <ChartsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/colors"
              element={
                <AdminRoute>
                  <ColorsTypography />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/navigation"
              element={
                <AdminRoute>
                  <NavigationShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/data-display"
              element={
                <AdminRoute>
                  <DataDisplayShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/feedback"
              element={
                <AdminRoute>
                  <FeedbackShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/form-controls"
              element={
                <AdminRoute>
                  <FormControlsShowcase />
                </AdminRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
