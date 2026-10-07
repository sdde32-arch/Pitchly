
import React, { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
import { Install } from './pages/Install';
import { JoinTeam } from './pages/JoinTeam';

import { ChatList } from './pages/ChatList';
import { ChatRoom } from './pages/ChatRoom';
import { Invitations } from './pages/Invitations';
import { DesignSystemTest } from './pages/DesignSystemTest';
import { TournamentHub } from './pages/tournament/TournamentHub';
import { TournamentManager } from './pages/admin/TournamentManager';

import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
const Router = HashRouter;

const ProviderLifecycleTracker: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => {
  useEffect(() => {
    console.log(`[Pitchly Boot] [Provider: ${name}] 🟢 Mounted`);
    return () => {
      console.log(`[Pitchly Boot] [Provider: ${name}] 🔴 Unmounted`);
    };
  }, [name]);

  return <>{children}</>;
};

const RootRedirect = () => {
  const { user, loading, isAdmin, isOwner, userProfile } = useUser();
  let lastUser: string | null = null;
  try {
    lastUser = localStorage.getItem('pitchly_last_user');
  } catch (e) {
    lastUser = null;
  }

  useEffect(() => {
    console.log('[Pitchly Boot] [RootRedirect] 🧭 State evaluated:', {
      authLoading: loading,
      hasUser: !!user,
      uid: user?.uid,
      role: userProfile?.role,
      isAdmin,
      isOwner,
      hasStoredLastUser: !!lastUser,
    });
  }, [loading, user, isAdmin, isOwner, userProfile, lastUser]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-app-base gap-5">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl font-black text-white tracking-tight font-display">Pitchly</span>
          <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
        </div>
        <Loader2 className="h-7 w-7 animate-spin text-primary-lime" />
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

  // If returning user but not logged in, check if they are Admin or valid profile
  if (lastUser) {
    try {
      const parsed = JSON.parse(lastUser);
      if (parsed && typeof parsed === 'object' && (parsed.name || parsed.email)) {
        const isParsedAdmin = (
          parsed.role === 'ADMIN' || 
          parsed.role === 'admin' || 
          parsed.role === 'super_admin' || 
          parsed.id === "0uVlAOWTy7dpqAW5tsgxQVs4PW43"
        );
        if (isParsedAdmin) {
          // Send Admin straight to /auth with email prefilled, bypassing welcome-back
          return <Navigate to="/auth" state={{ email: parsed.email }} replace />;
        }
        return <Navigate to="/welcome-back" replace />;
      }
    } catch (e) {
      console.warn("Failed to parse lastUser", e);
    }
  }

  return <Navigate to="/onboarding" replace />;
};

interface PageTransitionProps {
  children: React.ReactNode;
  flowType?: 'turf-detail' | 'booking-checkout' | 'default';
}

const pageMotionVariants = {
  'turf-detail': {
    initial: { opacity: 0, y: 12, scale: 0.998 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.998 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }
  },
  'booking-checkout': {
    initial: { opacity: 0, y: 16, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.995 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
  },
  'default': {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, flowType = 'default' }) => {
  const variant = pageMotionVariants[flowType] || pageMotionVariants.default;
  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={variant.transition}
      className="min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  useMatchReminders();

  useEffect(() => {
    console.log(`[Pitchly Boot] [Router] 🗺️ Active route: "${location.pathname}" (search: "${location.search}", hash: "${location.hash}")`);
    
    // Maintain a reliable record of the last browsed page (outside turf details/checkout)
    // to guarantee back buttons work flawlessly even inside sandboxed iframes
    const isDetailOrCheckout = 
      location.pathname.startsWith('/turf/') ||
      location.pathname.startsWith('/checkout/') ||
      location.pathname.startsWith('/booking-confirmation/');
    
    const isAuthOrOnboarding =
      location.pathname === '/' ||
      location.pathname === '/auth' ||
      location.pathname === '/onboarding' ||
      location.pathname === '/welcome-back';

    if (!isDetailOrCheckout && !isAuthOrOnboarding) {
      try {
        const fullPath = location.pathname + (location.search || '');
        sessionStorage.setItem('pitchly_last_browse_page', fullPath);
      } catch (e) {
        // Ignore sessionStorage restrictions if any
      }
    }
  }, [location.pathname, location.search, location.hash]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/welcome-back" element={<PageTransition><WelcomeBack /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/design-system" element={<PageTransition><DesignSystemTest /></PageTransition>} />
        
        {/* Public Routes (No Auth Required) */}
        <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
        <Route path="/teams/join/:inviteCode" element={<PageTransition><JoinTeam /></PageTransition>} />
        <Route path="/teams/join" element={<PageTransition><JoinTeam /></PageTransition>} />
        <Route path="/join-team/:inviteCode" element={<PageTransition><JoinTeam /></PageTransition>} />
        <Route path="/join-team" element={<PageTransition><JoinTeam /></PageTransition>} />
        <Route path="/tournament" element={<Navigate to="/tournament/wehat-s2-w2" replace />} />
        <Route path="/live" element={<Navigate to="/tournament/wehat-s2-w2" replace />} />
        <Route path="/scores" element={<Navigate to="/tournament/wehat-s2-w2" replace />} />
        <Route path="/tournament/:tournamentId" element={<PageTransition><TournamentHub /></PageTransition>} />
        
        {/* Protected User Routes */}
        <Route path="/home" element={<RequireAuth><PageTransition><Home /></PageTransition></RequireAuth>} />
        <Route path="/turf/:id" element={<RequireAuth blockAdmin><PageTransition flowType="turf-detail"><TurfDetail /></PageTransition></RequireAuth>} />
        <Route path="/turf/:id/book" element={<RequireAuth blockAdmin><PageTransition flowType="booking-checkout"><BookPitch /></PageTransition></RequireAuth>} />
        <Route path="/checkout/:id" element={<RequireAuth blockAdmin><PageTransition flowType="booking-checkout"><BookPitch /></PageTransition></RequireAuth>} />
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
  useEffect(() => {
    const bootTime = (window as any).__PITCHLY_BOOT_TIME__;
    const elapsed = bootTime ? (performance.now() - bootTime).toFixed(1) : 'unknown';
    console.log(`[Pitchly Boot] [App] 🟢 <App /> mounted into DOM successfully (boot took: ${elapsed}ms)`);
    console.log('[Pitchly Boot] [App] 📍 Route / Location Info:', {
      hash: window.location.hash || '(empty root - default route)',
      href: window.location.href,
      pathname: window.location.pathname,
    });
    console.log('[Pitchly Boot] [App] 🌐 Runtime Status:', {
      online: navigator.onLine,
      isIframe: window.self !== window.top,
      screen: `${window.innerWidth}x${window.innerHeight}`,
    });

    return () => {
      console.log('[Pitchly Boot] [App] 🔴 <App /> unmounting');
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-app-base text-text-primary">
      <ErrorBoundary>
        <ProviderLifecycleTracker name="ThemeProvider">
          <ThemeProvider>
            <ProviderLifecycleTracker name="UserProvider">
              <UserProvider>
                <ProviderLifecycleTracker name="BookingProvider">
                  <BookingProvider>
                    <ProviderLifecycleTracker name="MatchReminderProvider">
                      <MatchReminderProvider>
                        <ProviderLifecycleTracker name="PWAProvider">
                          <PWAProvider>
                            <HashRouter
                              future={{
                                v7_startTransition: true,
                                v7_relativeSplatPath: true,
                              }}
                            >
                              <ProviderLifecycleTracker name="InteractiveWalkthroughProvider">
                                <InteractiveWalkthroughProvider>
                                  <AnimatedRoutes />
                                  <InteractiveWalkthroughOverlay />
                                  <MatchReminderToast />
                                  <OfflineIndicator />
                                  <Analytics />
                                </InteractiveWalkthroughProvider>
                              </ProviderLifecycleTracker>
                            </HashRouter>
                          </PWAProvider>
                        </ProviderLifecycleTracker>
                      </MatchReminderProvider>
                    </ProviderLifecycleTracker>
                  </BookingProvider>
                </ProviderLifecycleTracker>
              </UserProvider>
            </ProviderLifecycleTracker>
          </ThemeProvider>
        </ProviderLifecycleTracker>
      </ErrorBoundary>
    </div>
  );
};

export default App;
