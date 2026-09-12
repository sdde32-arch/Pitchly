
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

import { ThemeProvider } from './ThemeContext';
import { BookingProvider } from './context/BookingContext';
import { UserProvider, useUser } from './context/UserContext';
import { PWAProvider } from './context/PWAContext';
import { InteractiveWalkthroughProvider } from './context/InteractiveWalkthroughContext';
import { InteractiveWalkthroughOverlay } from './components/onboarding/InteractiveWalkthroughOverlay';
import { MatchReminderProvider } from './context/MatchReminderContext';
import { MatchReminderToast } from './components/MatchReminderToast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useMatchReminders } from './hooks/useMatchReminders';
import { RequireAuth, RequireAdmin, RequireOwner } from './components/RouteGuards';
import { Loader2 } from 'lucide-react';
import { Logo } from './components/Logo';

// Pages
import { Onboarding } from './pages/Onboarding';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { TurfDetail } from './pages/TurfDetail';
import { BookPitch } from './pages/BookPitch';
import { Teams } from './pages/Teams';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { OwnerProfile } from './pages/owner/OwnerProfile';
import { ManagePitches } from './pages/owner/ManagePitches';
import { AddPitch } from './pages/owner/AddPitch';
import { AdminLayout } from './pages/admin/layout/AdminLayout';
import { Overview } from './pages/admin/Overview';
import { PitchReviews } from './pages/admin/PitchReviews';
import { UserManagement } from './pages/admin/UserManagement';
import { OwnerManagement } from './pages/admin/OwnerManagement';
import { BookingManagement } from './pages/admin/BookingManagement';
import { PaymentDisputes } from './pages/admin/PaymentDisputes';
import { Reports } from './pages/admin/Reports';
import { AuditLogs } from './pages/admin/AuditLogs';
import { PlatformSettings } from './pages/admin/PlatformSettings';
import { Profile } from './pages/Profile';
import { Bookings } from './pages/Bookings';
import { Settings } from './pages/Settings';
import { Support } from './pages/Support';
import { ExploreMap } from './pages/ExploreMap';
import { WelcomeBack } from './pages/WelcomeBack';
import { MatchSummary } from './pages/MatchSummary';
import { BookingConfirmation } from './pages/BookingConfirmation';

import { ChatList } from './pages/ChatList';
import { ChatRoom } from './pages/ChatRoom';
import { Invitations } from './pages/Invitations';
import { DesignSystemTest } from './pages/DesignSystemTest';
import { TournamentHub } from './pages/tournament/TournamentHub';
import { TournamentManager } from './pages/admin/TournamentManager';

import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
const Router = HashRouter;

const RootRedirect = () => {
  const { user, loading, isAdmin, isOwner } = useUser();
  const lastUser = localStorage.getItem('pitchly_last_user');

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background gap-6">
        <Logo size={60} showText={true} />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, redirect based on role
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin/overview" replace />;
    }
    if (isOwner) {
      return <Navigate to="/owner" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  // If returning user but not logged in, check if they are Admin
  if (lastUser) {
    try {
      const parsed = JSON.parse(lastUser);
      const isParsedAdmin = parsed && (
        parsed.role === 'ADMIN' || 
        parsed.role === 'admin' || 
        parsed.role === 'super_admin' || 
        parsed.id === "0uVlAOWTy7dpqAW5tsgxQVs4PW43"
      );
      if (isParsedAdmin) {
        // Send Admin straight to /auth with email prefilled, bypassing welcome-back
        return <Navigate to="/auth" state={{ email: parsed.email }} replace />;
      }
    } catch (e) {
      console.warn("Failed to parse lastUser", e);
    }
    return <Navigate to="/welcome-back" replace />;
  }

  return <Navigate to="/onboarding" replace />;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  useMatchReminders();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/welcome-back" element={<PageTransition><WelcomeBack /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/design-system" element={<PageTransition><DesignSystemTest /></PageTransition>} />
        
        {/* Public Tournament Hub Routes (No Auth Required) */}
        <Route path="/tournament" element={<Navigate to="/tournament/wehat-s2-w1" replace />} />
        <Route path="/tournament/:tournamentId" element={<PageTransition><TournamentHub /></PageTransition>} />
        
        {/* Protected User Routes */}
        <Route path="/home" element={<RequireAuth><PageTransition><Home /></PageTransition></RequireAuth>} />
        <Route path="/turf/:id" element={<RequireAuth blockAdmin><PageTransition><TurfDetail /></PageTransition></RequireAuth>} />
        <Route path="/turf/:id/book" element={<RequireAuth blockAdmin><PageTransition><BookPitch /></PageTransition></RequireAuth>} />
        <Route path="/checkout/:id" element={<RequireAuth blockAdmin><PageTransition><BookPitch /></PageTransition></RequireAuth>} />
        <Route path="/explore-map" element={<RequireAuth><PageTransition><ExploreMap /></PageTransition></RequireAuth>} />
        <Route path="/teams" element={<RequireAuth><PageTransition><Teams /></PageTransition></RequireAuth>} />
        <Route path="/invitations" element={<RequireAuth><PageTransition><Invitations /></PageTransition></RequireAuth>} />
        <Route path="/bookings" element={<RequireAuth><PageTransition><Bookings /></PageTransition></RequireAuth>} />
        <Route path="/booking-confirmation/:id" element={<RequireAuth><PageTransition><BookingConfirmation /></PageTransition></RequireAuth>} />
        <Route path="/match-summary/:bookingId" element={<RequireAuth><PageTransition><MatchSummary /></PageTransition></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><PageTransition><Profile /></PageTransition></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><PageTransition><Settings /></PageTransition></RequireAuth>} />
        <Route path="/support" element={<RequireAuth><PageTransition><Support /></PageTransition></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth blockAdmin><PageTransition><ChatList /></PageTransition></RequireAuth>} />
        <Route path="/chat/:id" element={<RequireAuth blockAdmin><PageTransition><ChatRoom /></PageTransition></RequireAuth>} />
        
        {/* Protected Owner Routes */}
        <Route path="/owner" element={<RequireOwner><PageTransition><OwnerDashboard /></PageTransition></RequireOwner>} />
        <Route path="/owner/pitches" element={<RequireOwner><PageTransition><ManagePitches /></PageTransition></RequireOwner>} />
        <Route path="/owner/add-pitch" element={<RequireOwner><PageTransition><AddPitch /></PageTransition></RequireOwner>} />
        <Route path="/owner/edit-pitch/:id" element={<RequireOwner><PageTransition><AddPitch /></PageTransition></RequireOwner>} />
        <Route path="/owner-profile" element={<RequireOwner><PageTransition><OwnerProfile /></PageTransition></RequireOwner>} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<RequireAdmin><PageTransition><AdminLayout /></PageTransition></RequireAdmin>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="tournaments" element={<TournamentManager />} />
          <Route path="pitches" element={<PitchReviews />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="owners" element={<OwnerManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="payments" element={<PaymentDisputes />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<PlatformSettings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-full w-full bg-app-base overflow-hidden">
      <ErrorBoundary>
        <ThemeProvider>
          <UserProvider>
            <BookingProvider>
              <MatchReminderProvider>
                <PWAProvider>
                  <HashRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <InteractiveWalkthroughProvider>
                      <AnimatedRoutes />
                      <InteractiveWalkthroughOverlay />
                      <MatchReminderToast />
                      <OfflineIndicator />
                    </InteractiveWalkthroughProvider>
                  </HashRouter>
                </PWAProvider>
              </MatchReminderProvider>
            </BookingProvider>
          </UserProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
};

export default App;
