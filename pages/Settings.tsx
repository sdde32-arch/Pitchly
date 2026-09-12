import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { useTheme } from "../ThemeContext";
import { usePWA } from "../context/PWAContext";
import { Card } from "../components/ui/Card";
import { Toggle } from "../components/ui/Toggle";
import {
  Bell,
  Globe,
  Shield,
  CreditCard,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Zap,
  Smartphone,
  Download,
  CheckCircle,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { RoleOnboarding } from "../components/onboarding/RoleOnboarding";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useMatchReminder } from "../context/MatchReminderContext";
import { PWAInstallButton } from "../components/PWAInstallButton";
import { offlineCacheService } from "../services/offlineCacheService";
import { Database, RefreshCw, Wifi } from "lucide-react";

export const Settings: React.FC = () => {
  const { isEcoMode, toggleEcoMode, theme, toggleTheme } = useTheme();
  const { isInstallable, installApp } = usePWA();
  const { triggerTestNotification, hasBrowserPermission, requestBrowserPermission } = useMatchReminder();
  const {
    user,
    userProfile,
    isAdmin,
    signOut: contextSignOut,
    switchRole,
  } = useUser();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [notifications, setNotifications] = useState({
    push: false,
    email: true,
    sms: false,
    upcomingMatches: true,
  });
  const [offlineStats, setOfflineStats] = useState(() => offlineCacheService.getSummary(user?.uid));
  const [cacheRefreshing, setCacheRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    try {
      const { pitchService } = await import("../services/pitchService");
      await pitchService.listPublic();
      setOfflineStats(offlineCacheService.getSummary(user?.uid));
    } catch (e) {
      console.warn("Failed to refresh offline cache:", e);
    } finally {
      setTimeout(() => setCacheRefreshing(false), 500);
    }
  };

  React.useEffect(() => {
    if (user) {
      const fetchPrefs = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().notificationPrefs) {
            setNotifications((prev) => ({
              ...prev,
              ...snap.data().notificationPrefs,
            }));
          }
        } catch (e) {
          console.error("Failed to fetch notification prefs", e);
        }
      };
      fetchPrefs();
    }
  }, [user]);

  const updateNotificationPref = async (key: string, value: boolean) => {
    const newPrefs = { ...notifications, [key]: value };
    setNotifications(newPrefs);
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { notificationPrefs: newPrefs }, { merge: true });
      } catch (e) {
        console.error("Failed to save notification pref", e);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await contextSignOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3 mt-8 px-4">
      {title}
    </h2>
  );
  const SettingItem = ({
    icon: Icon,
    title,
    description,
    action,
    destructive = false,
  }: any) => (
    <div className="flex items-center justify-between p-4 bg-surface-card border-b border-border-subtle last:border-0 hover:bg-surface-raised/50 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${destructive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-surface-raised border border-border-subtle text-text-secondary"}`}
        >
          <Icon size={18} />
        </div>
        <div>
          <h3
            className={`font-bold text-[15px] ${destructive ? "text-red-500" : "text-text-primary"}`}
          >
            {title}
          </h3>
          {description && (
            <p className="text-[11px] font-medium text-text-secondary mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div>{action}</div>
    </div>
  );
  return (
    <Layout>
      <div className="min-h-full bg-app-base pb-32 font-body text-text-primary">
        <div className="p-4 border-b border-border-subtle sticky top-0 z-30 bg-app-base/90 backdrop-blur-md">
          <div className="flex items-center max-w-xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 w-10 h-10 flex items-center justify-center bg-surface-card border border-border-subtle rounded-full text-text-secondary hover:bg-surface-raised transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <h1 className="text-[18px] font-black text-text-primary">
              Settings
            </h1>
          </div>
        </div>
        <div className="p-4 max-w-xl mx-auto mt-4">
          <PWAInstallButton variant="full" className="mb-6" />
          
          <SectionHeader title="Appearance & Performance" />
          <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm mb-6">
            <SettingItem
              icon={theme === 'dark' ? Moon : Sun}
              title="Dark Mode"
              description="Switch between light and dark themes"
              action={<Toggle checked={theme === 'dark'} onChange={toggleTheme} />}
            />
            <div className="border-t border-border-subtle" />
            <SettingItem
              icon={Zap}
              title="Eco Mode"
              description="Reduce animations and power usage"
              action={<Toggle checked={isEcoMode} onChange={toggleEcoMode} />}
            />
          </div>

          <SectionHeader title="Offline & Connectivity" />
          <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm mb-6">
            <SettingItem
              icon={Wifi}
              title="Service Worker Caching"
              description="Critical assets & shells cached for offline usage"
              action={
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30">
                  Active
                </span>
              }
            />
            <div className="border-t border-border-subtle" />
            <SettingItem
              icon={Database}
              title="Cached Pitchly Records"
              description={`${offlineStats.pitchesCount} pitches & ${offlineStats.userBookingsCount} bookings saved`}
              action={
                <button
                  onClick={handleRefreshCache}
                  disabled={cacheRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-border-subtle text-text-primary text-xs font-bold transition-all border border-border-subtle cursor-pointer disabled:opacity-50"
                  title="Update cached data from network"
                >
                  <RefreshCw size={12} className={cacheRefreshing ? "animate-spin text-primary-lime" : ""} />
                  <span>{cacheRefreshing ? "Syncing..." : "Sync"}</span>
                </button>
              }
            />
          </div>
          
          <SectionHeader title="Notifications" />
          <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm">
            <SettingItem
              icon={Bell}
              title="Push Notifications"
              description="Match invites, updates"
              action={
                <Toggle
                  checked={notifications.push}
                  onChange={async (newValue) => {
                    if (newValue && "Notification" in window) {
                      const permission = await Notification.requestPermission();
                      if (permission === "granted") {
                        updateNotificationPref("push", true);
                      } else {
                        updateNotificationPref("push", false);
                        alert("Notifications blocked — enable in browser settings.");
                      }
                    } else {
                      updateNotificationPref("push", newValue);
                    }
                  }}
                />
              }
            />
            <SettingItem
              icon={Bell}
              title="Upcoming Matches"
              description="Notify 1 hour before scheduled time"
              action={
                <Toggle
                  checked={notifications.upcomingMatches}
                  onChange={(newValue) => {
                    updateNotificationPref("upcomingMatches", newValue);
                  }}
                />
              }
            />
            <SettingItem
              icon={Smartphone}
              title="SMS Alerts"
              description="Important reminders only"
              action={
                <Toggle
                  checked={notifications.sms}
                  onChange={(newValue) =>
                    updateNotificationPref("sms", newValue)
                  }
                />
              }
            />
            <SettingItem
              icon={Sparkles}
              title="Test 1-Hour Match Alert"
              description="Preview the in-app & browser notification"
              action={
                <button
                  type="button"
                  onClick={() => triggerTestNotification()}
                  className="px-3.5 py-1.5 bg-primary-lime/15 text-primary-lime hover:bg-primary-lime/25 border border-primary-lime/30 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Test Trigger</span>
                </button>
              }
            />
          </div>
          
          <SectionHeader title="Account" />
          <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm">
            {!isAdmin && userProfile?.roles?.includes("PLAYER") &&
              userProfile?.roles?.includes("OWNER") && (
                <SettingItem
                  icon={Shield}
                  title="Switch Role"
                  description={`Currently viewing as ${userProfile?.role === "PLAYER" ? "Player" : "Owner"}`}
                  action={
                    <button
                      onClick={() => {
                        switchRole();
                        navigate(
                          userProfile?.role === "PLAYER" ? "/owner" : "/home",
                        );
                      }}
                      className="px-4 py-2 bg-primary-lime/10 text-primary-lime rounded-full text-[12px] font-bold hover:bg-primary-lime/20 transition-colors border border-primary-lime/20 cursor-pointer"
                    >
                      To {userProfile?.role === "PLAYER" ? "Owner" : "Player"}
                    </button>
                  }
                />
              )}
            <SettingItem
              icon={Shield}
              title="Privacy & Security"
              action={
                <ChevronRight size={18} className="text-[#71717A]" />
              }
            />
            <SettingItem
              icon={CreditCard}
              title="Payment Methods"
              action={
                <ChevronRight size={18} className="text-[#71717A]" />
              }
            />
            <SettingItem
              icon={Globe}
              title="Language"
              description="English (UK)"
              action={
                <ChevronRight size={18} className="text-[#71717A]" />
              }
            />
            <SettingItem
              icon={PlayCircle}
              title="Replay App Tutorial"
              description="View the onboarding guide again"
              action={
                <button
                  onClick={() => setShowTutorial(true)}
                  className="px-4 py-2 bg-surface-raised text-text-secondary rounded-full text-[12px] font-bold hover:bg-border-subtle transition-colors border border-border-subtle shadow-sm cursor-pointer"
                >
                  Replay
                </button>
              }
            />
          </div>
          
          <div className="mt-10 mb-8 px-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-full font-bold text-[14px] flex items-center justify-center shadow-sm hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={18} className="mr-2" />
              Log Out
            </button>
          </div>
        </div>
      </div>
      {showTutorial && (
        <RoleOnboarding onComplete={() => setShowTutorial(false)} />
      )}
    </Layout>
  );
};

export default Settings;
