import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { PropertyProvider } from '@/context/PropertyContext';
import { ChatProvider } from '@/context/ChatContext';
import { ProtectedRoute, PublicRoute, AdminRoute, SuperAdminRoute } from '@/routes';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { Dashboard } from '@/pages/Dashboard';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SetPasswordPage,
  VerifyEmailPage,
  PlanSignupPage,
} from '@/pages/auth';
import { OnboardingPage } from '@/pages/onboarding';
import {
  UserListPage,
  UserDetailPage,
  CreateUserPage,
  PendingApprovalsPage,
  BillingSettingsPage,
  CreatePlanPage,
  EditPlanPage,
  CreateMemberTypePage,
  EditMemberTypePage,
  RefundListPage,
  RefundDetailPage,
  CreditMemoListPage,
} from '@/pages/admin';
import { EmailManagementPage } from '@/pages/admin/email';
import { TemplateEditorPage } from '@/pages/admin/email/TemplateEditorPage';
import {
  CreditNoteListPage,
  IssueCreditNotePage,
} from '@/pages/admin/credit-notes';
import { ProfilePage } from '@/pages/profile';
import { NotificationsPage } from '@/pages/notifications';
import { ChatPage, ChatHubPage } from '@/pages/chat';
import {
  CompanyListPage,
  CompanyDetailPage,
  CreateCompanyPage,
} from '@/pages/companies';
import {
  PropertyListPage,
  PropertyDetailPage,
  CreatePropertyPage,
} from '@/pages/properties';
import {
  CustomerListPage,
  CustomerDetailPage,
} from '@/pages/customers';
import {
  RoomListPage,
  RoomDetailPage,
  CreateRoomPage,
  PaymentRulesManagementPage,
  PaymentRuleDetailPage,
  CreatePaymentRulePage,
  EditPaymentRulePage,
} from '@/pages/rooms';
import {
  PromoCodesListPage,
  PromoCodeFormPage,
} from '@/pages/promo-codes';
import {
  BookingDetailPage,
  EditBookingPage,
  CreateBookingPage,
  CalendarPage,
  PaymentProofUploadPage,
  GuestBookingStatusPage,
} from '@/pages/bookings';
import {
  GuestCheckoutPage,
  ConfirmationPage,
} from '@/pages/discovery';
import {
  DirectoryHomePage,
  SearchResultsPage,
  CategoriesPage,
  PublicPropertyDetailPage,
  WishlistPage,
} from '@/pages/directory';
import { BookingWizardPage } from '@/pages/booking-wizard';
import { PaymentCallbackPage } from '@/pages/booking-wizard/PaymentCallbackPage';
import { ForHostsPage } from '@/pages/ForHostsPage';
import { ListYourPropertyPage } from '@/pages/ListYourPropertyPage';
import { AllFeaturesPage } from '@/pages/AllFeaturesPage';
import { FeaturePageRouter } from '@/pages/features';
import {
  PortalBookingsPage,
  PortalBookingDetailPage,
  PortalPropertiesPage,
  PortalPropertyDetailPage,
} from '@/pages/portal';
import { CreateCancellationPolicyPage, EditCancellationPolicyPage } from '@/pages/legal';
import { AddonsPage, CreateAddonPage, EditAddonPage } from '@/pages/addons';
import { MyRefundsPage, RefundDetailPage as GuestRefundDetailPage } from '@/pages/refunds';
import { WriteReviewPage, ReviewListPage } from '@/pages/reviews';
import { QuotesListPage } from '@/pages/quotes';
import { BookingManagementPage } from '@/pages/booking-management';
import { PricingPage } from '@/pages/pricing';
import { PlanCheckoutPage } from '@/pages/plans';
import { CheckoutPage, CheckoutCallbackPage } from '@/pages/checkout';
import { FailedCheckoutsPage } from '@/pages/analytics';
import { PaymentSettingsPage } from '@/pages/settings/PaymentSettingsPage';
import { GuestDashboardPage } from '@/pages/guest';
import { WhatsAppSettingsPage } from '@/pages/settings/WhatsAppSettingsPage';
import { WhatsAppTemplatesPage } from '@/pages/settings/WhatsAppTemplatesPage';
import { SupportDashboardPage } from '@/pages/support/SupportDashboardPage';
import { SupportTicketDetailPage } from '@/pages/support/SupportTicketDetailPage';
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
  NotificationsShowcase,
  IntegrationCardShowcase,
  LayoutsShowcase,
  DatePickersShowcase,
  RatesCalendarShowcase,
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
          <NotificationProvider>
            <SubscriptionProvider>
              <PropertyProvider>
                <Routes>
            {/* PUBLIC DIRECTORY ROUTES */}
            <Route path="/" element={<DirectoryHomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/for-hosts" element={<ForHostsPage />} />
            <Route path="/list-your-property" element={<ListYourPropertyPage />} />
            <Route path="/for-hosts/features" element={<AllFeaturesPage />} />
            <Route path="/for-hosts/feature/:slug" element={<FeaturePageRouter />} />
            <Route path="/accommodation/:slug" element={<PublicPropertyDetailPage />} />
            <Route path="/accommodation/:slug/book" element={<BookingWizardPage />} />
            <Route path="/booking-wizard/payment-callback" element={<PaymentCallbackPage />} />
            <Route path="/accommodation/:slug/checkout" element={<GuestCheckoutPage />} />
            {/* Wishlist disabled for now */}
            {/* <Route path="/wishlist" element={<WishlistPage />} /> */}

            {/* Public Auth routes */}
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
            <Route
              path="/auth/set-password"
              element={
                <PublicRoute>
                  <SetPasswordPage />
                </PublicRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Public pricing page */}
            <Route path="/pricing" element={<PricingPage />} />

            {/* Individual plan checkout pages (public) */}
            <Route path="/plans/:slug" element={<PlanCheckoutPage />} />

            {/* Plan signup page (public - with plan context) */}
            <Route
              path="/signup/:planId"
              element={
                <PublicRoute>
                  <PlanSignupPage />
                </PublicRoute>
              }
            />

            {/* Onboarding wizard (requires authentication) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Checkout routes (require authentication) */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/callback"
              element={
                <ProtectedRoute>
                  <CheckoutCallbackPage />
                </ProtectedRoute>
              }
            />

            {/* GUEST PORTAL ROUTES (Guest users) */}
            <Route
              path="/guest/dashboard"
              element={
                <ProtectedRoute>
                  <GuestDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* PROPERTY MANAGEMENT ROUTES (Authenticated users) */}
            {/* Redirect /manage to /manage/dashboard */}
            <Route
              path="/manage"
              element={
                <ProtectedRoute>
                  <Navigate to="/manage/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/settings/payments"
              element={
                <ProtectedRoute>
                  <PaymentSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/settings/whatsapp"
              element={
                <ProtectedRoute>
                  <WhatsAppSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/whatsapp"
              element={
                <ProtectedRoute>
                  <WhatsAppSettingsPage />
                </ProtectedRoute>
              }
            />
            {/* Unified Chat Hub - Messages, Support & WhatsApp */}
            <Route
              path="/manage/chat"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ChatHubPage />
                  </ChatProvider>
                </ProtectedRoute>
              }
            >
              {/* Nested routes for Chat Hub */}
              <Route index element={<Navigate to="/manage/chat/conversations" replace />} />

              {/* Messages Tab (includes all conversation types + support tickets) */}
              <Route path="conversations" element={<ChatPage />} />
              <Route path="conversations/:conversationId" element={<ChatPage />} />

              {/* Legacy WhatsApp route - redirect to settings */}
              <Route path="whatsapp" element={<Navigate to="/settings/whatsapp" replace />} />

              {/* Legacy support routes - redirect to conversations */}
              <Route path="support" element={<Navigate to="/manage/chat/conversations?type=support" replace />} />
              <Route path="support/:id" element={<Navigate to="/manage/chat/conversations" replace />} />
            </Route>

            {/* Legacy routes - redirect to new structure */}
            <Route path="/support" element={<Navigate to="/manage/chat/conversations?type=support" replace />} />
            <Route path="/support/tickets/:id" element={<Navigate to="/manage/chat/conversations" replace />} />

            {/* Business routes */}
            <Route
              path="/manage/companies"
              element={
                <ProtectedRoute>
                  <CompanyListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/companies/new"
              element={
                <ProtectedRoute>
                  <CreateCompanyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/companies/:id"
              element={
                <ProtectedRoute>
                  <CompanyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/properties"
              element={
                <ProtectedRoute>
                  <PropertyListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/properties/new"
              element={
                <ProtectedRoute>
                  <CreatePropertyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/properties/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Customer routes */}
            <Route
              path="/manage/customers"
              element={
                <ProtectedRoute>
                  <CustomerListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/customers/:id"
              element={
                <ProtectedRoute>
                  <CustomerDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Room routes */}
            <Route
              path="/manage/rooms"
              element={
                <ProtectedRoute>
                  <RoomListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/new"
              element={
                <ProtectedRoute>
                  <CreateRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/payment-rules"
              element={
                <ProtectedRoute>
                  <PaymentRulesManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/payment-rules/new"
              element={
                <ProtectedRoute>
                  <CreatePaymentRulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/payment-rules/:id"
              element={
                <ProtectedRoute>
                  <PaymentRuleDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/payment-rules/:id/edit"
              element={
                <ProtectedRoute>
                  <EditPaymentRulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/promo-codes"
              element={
                <ProtectedRoute>
                  <PromoCodesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/promo-codes/new"
              element={
                <ProtectedRoute>
                  <PromoCodeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/promo-codes/:id/edit"
              element={
                <ProtectedRoute>
                  <PromoCodeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/rooms/:id"
              element={
                <ProtectedRoute>
                  <RoomDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Booking routes */}
            {/* Redirect old bookings route to new booking management */}
            <Route
              path="/manage/bookings"
              element={<Navigate to="/manage/booking-management" replace />}
            />
            <Route
              path="/bookings/new"
              element={
                <ProtectedRoute>
                  <CreateBookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/edit"
              element={
                <ProtectedRoute>
                  <EditBookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/upload-proof"
              element={
                <ProtectedRoute>
                  <PaymentProofUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <ProtectedRoute>
                  <BookingDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Refunds routes */}
            <Route
              path="/refunds"
              element={
                <ProtectedRoute>
                  <MyRefundsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/refunds/:id"
              element={
                <ProtectedRoute>
                  <GuestRefundDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Review routes */}
            <Route
              path="/manage/reviews"
              element={
                <ProtectedRoute>
                  <ReviewListPage />
                </ProtectedRoute>
              }
            />

            {/* Quote Request routes */}
            <Route
              path="/manage/quotes"
              element={
                <ProtectedRoute>
                  <QuotesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews/write"
              element={
                <ProtectedRoute>
                  <WriteReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews/write/:bookingId"
              element={
                <ProtectedRoute>
                  <WriteReviewPage />
                </ProtectedRoute>
              }
            />

            {/* Discovery (Guest checkout) routes */}
            <Route
              path="/discovery/:slug/checkout"
              element={<GuestCheckoutPage />}
            />
            <Route
              path="/discovery/confirmation/:id"
              element={<ConfirmationPage />}
            />

            {/* Portal (Guest booking management) routes */}
            <Route
              path="/portal/properties"
              element={
                <ProtectedRoute>
                  <PortalPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/properties/:slug"
              element={
                <ProtectedRoute>
                  <PortalPropertyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/bookings"
              element={
                <ProtectedRoute>
                  <PortalBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/bookings/:id"
              element={
                <ProtectedRoute>
                  <GuestBookingStatusPage />
                </ProtectedRoute>
              }
            />

            {/* Guest booking status page - also accessible via /guest/bookings/:id */}
            <Route
              path="/guest/bookings/:id"
              element={
                <ProtectedRoute>
                  <GuestBookingStatusPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manage/booking-management"
              element={
                <ProtectedRoute>
                  <BookingManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics routes */}
            <Route
              path="/manage/analytics/failed-checkouts"
              element={
                <ProtectedRoute>
                  <FailedCheckoutsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manage/addons"
              element={
                <ProtectedRoute>
                  <AddonsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addons/new"
              element={
                <ProtectedRoute>
                  <CreateAddonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addons/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAddonPage />
                </ProtectedRoute>
              }
            />
            {/* OLD: Legal page (to be removed after migration) */}
            {/* <Route
              path="/manage/legal"
              element={
                <ProtectedRoute>
                  <LegalPage />
                </ProtectedRoute>
              }
            /> */}

            {/* Legacy cancellation policy routes (no property context) */}
            <Route
              path="/legal/cancellation-policies/new"
              element={
                <ProtectedRoute>
                  <CreateCancellationPolicyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legal/cancellation-policies/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCancellationPolicyPage />
                </ProtectedRoute>
              }
            />

            {/* Property-scoped cancellation policy routes (new) */}
            <Route
              path="/manage/properties/:propertyId/legal/cancellation-policies/new"
              element={
                <ProtectedRoute>
                  <CreateCancellationPolicyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/properties/:propertyId/legal/cancellation-policies/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCancellationPolicyPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
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
              path="/admin/billing"
              element={
                <SuperAdminRoute>
                  <BillingSettingsPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/billing/plans/new"
              element={
                <SuperAdminRoute>
                  <CreatePlanPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/billing/plans/:planId/edit"
              element={
                <SuperAdminRoute>
                  <EditPlanPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/billing/member-types/new"
              element={
                <SuperAdminRoute>
                  <CreateMemberTypePage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/billing/member-types/:typeId/edit"
              element={
                <SuperAdminRoute>
                  <EditMemberTypePage />
                </SuperAdminRoute>
              }
            />

            {/* Email Management routes - Super Admin Only */}
            <Route
              path="/admin/email"
              element={
                <SuperAdminRoute>
                  <EmailManagementPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/email/templates/new"
              element={
                <SuperAdminRoute>
                  <TemplateEditorPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/email/templates/:id"
              element={
                <SuperAdminRoute>
                  <TemplateEditorPage />
                </SuperAdminRoute>
              }
            />

            {/* Refund Management routes - Admin Only */}
            <Route
              path="/admin/refunds"
              element={
                <AdminRoute>
                  <RefundListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/refunds/:id"
              element={
                <AdminRoute>
                  <RefundDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/credit-memos"
              element={
                <AdminRoute>
                  <CreditMemoListPage />
                </AdminRoute>
              }
            />

            {/* Credit Note routes - Admin Only */}
            <Route
              path="/admin/credit-notes"
              element={
                <AdminRoute>
                  <CreditNoteListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/credit-notes/issue"
              element={
                <AdminRoute>
                  <IssueCreditNotePage />
                </AdminRoute>
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
            <Route
              path="/design-system/notifications"
              element={
                <AdminRoute>
                  <NotificationsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/integration-card"
              element={
                <AdminRoute>
                  <IntegrationCardShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/layouts"
              element={
                <AdminRoute>
                  <LayoutsShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/date-pickers"
              element={
                <AdminRoute>
                  <DatePickersShowcase />
                </AdminRoute>
              }
            />
            <Route
              path="/design-system/rates-calendar"
              element={
                <AdminRoute>
                  <RatesCalendarShowcase />
                </AdminRoute>
              }
            />

            {/* Catch-all - redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PropertyProvider>
            </SubscriptionProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
