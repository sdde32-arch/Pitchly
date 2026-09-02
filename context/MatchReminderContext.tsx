import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import { bookingService } from '../services/bookingService';
import { notificationService, UpcomingMatchItem } from '../services/notificationService';
import { BookingStatus } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MatchReminderAlert {
  id: string;
  bookingId: string;
  turfName: string;
  pitchName?: string;
  time: string;
  date: string;
  minutesLeft: number;
  mapUrl?: string;
  isTest?: boolean;
}

interface MatchReminderContextType {
  activeToast: MatchReminderAlert | null;
  dismissToast: () => void;
  triggerTestNotification: () => void;
  hasBrowserPermission: boolean;
  requestBrowserPermission: () => Promise<boolean>;
  checkReminders: () => Promise<void>;
  upcoming1HrMatches: MatchReminderAlert[];
}

const MatchReminderContext = createContext<MatchReminderContextType | undefined>(undefined);

// Web Audio API Gentle Match Reminder Chime
function playReminderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Notes: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.12);
      osc.stop(ctx.currentTime + index * 0.12 + 0.36);
    });
  } catch (err) {
    // AudioContext autoplay might be constrained before interaction; fail silently
    console.debug('Audio chime skipped:', err);
  }
}

export const MatchReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [activeToast, setActiveToast] = useState<MatchReminderAlert | null>(null);
  const [upcoming1HrMatches, setUpcoming1HrMatches] = useState<MatchReminderAlert[]>([]);
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const notifiedIds = useRef<Set<string>>(new Set());

  // Load previously notified IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pitchly_1hr_notified_matches');
      if (stored) {
        notifiedIds.current = new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load notified match IDs from storage:', e);
    }
  }, []);

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasBrowserPermission(granted);
      return granted;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const triggerBrowserNotification = useCallback((alertItem: MatchReminderAlert) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const minsText = alertItem.minutesLeft > 0 ? `in ~${alertItem.minutesLeft} minutes` : 'in 1 hour';
      const notification = new Notification('Match Kickoff in 1 Hour! ⚽', {
        body: `Your match at ${alertItem.turfName} starts ${minsText} (${alertItem.time}). Tap for directions & pitch info.`,
        icon: '/icon-192.png',
        badge: '/logo.svg',
        tag: `pitchly-1hr-${alertItem.bookingId}`,
      });

      notification.onclick = () => {
        window.focus();
        if (alertItem.mapUrl) {
          window.open(alertItem.mapUrl, '_blank');
        }
      };
    } catch (e) {
      console.warn('Could not trigger browser notification:', e);
    }
  }, []);

  const checkReminders = useCallback(async () => {
    if (!user) return;

    try {
      // Check user preferences in Firestore
      let upcomingMatchesEnabled = true;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const prefs = userDoc.data().notificationPrefs;
          if (prefs && prefs.upcomingMatches === false) {
            upcomingMatchesEnabled = false;
          }
        }
      } catch (e) {
        // Fallback to enabled
      }

      if (!upcomingMatchesEnabled) return;

      // 1. Fetch upcoming matches from notification service (combines bookings + team matches)
      const upcomingMatches: UpcomingMatchItem[] = await notificationService.getUpcomingMatches(user.uid);
      const now = new Date();
      const matchedAlerts: MatchReminderAlert[] = [];

      for (const match of upcomingMatches) {
        if (!match.date || !match.time) continue;
        const [year, month, day] = match.date.split('-').map(Number);
        const [hours, minutes] = match.time.split(':').map(Number);
        if (isNaN(year) || isNaN(hours)) continue;

        const matchTime = new Date(year, month - 1, day, hours, minutes, 0);
        const diffMs = matchTime.getTime() - now.getTime();
        const ONE_HOUR_MS = 60 * 60 * 1000;

        // Trigger condition: Match is within the next 60 minutes and hasn't ended (diffMs > 0)
        if (diffMs > 0 && diffMs <= ONE_HOUR_MS) {
          const minsLeft = Math.max(1, Math.round(diffMs / 60000));
          const alertItem: MatchReminderAlert = {
            id: `alert-${match.id}`,
            bookingId: match.id,
            turfName: match.turfName || 'Football Turf',
            time: match.time,
            date: match.date,
            minutesLeft: minsLeft,
            mapUrl: match.mapUrl,
          };

          matchedAlerts.push(alertItem);

          // If not notified yet for the 1-hour trigger
          const notificationKey = `pitchly_1hr_${match.id}`;
          if (!notifiedIds.current.has(notificationKey)) {
            notifiedIds.current.add(notificationKey);
            try {
              localStorage.setItem(
                'pitchly_1hr_notified_matches',
                JSON.stringify(Array.from(notifiedIds.current))
              );
            } catch (err) {}

            // 1. In-App Toast
            setActiveToast(alertItem);

            // 2. Play audio & vibration
            playReminderChime();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

            // 3. Browser Native Notification
            triggerBrowserNotification(alertItem);
          }
        }
      }

      setUpcoming1HrMatches(matchedAlerts);
    } catch (err) {
      console.warn('Error during 1-hour match reminder check:', err);
    }
  }, [user, triggerBrowserNotification]);

  // Test Notification Trigger for manual verification
  const triggerTestNotification = useCallback(() => {
    const testAlert: MatchReminderAlert = {
      id: `test-alert-${Date.now()}`,
      bookingId: 'test-booking-123',
      turfName: 'Lugogo Turf Arena',
      pitchName: 'Main Pitch 1 (Floodlit)',
      time: '19:00',
      date: new Date().toISOString().split('T')[0],
      minutesLeft: 58,
      mapUrl: 'https://maps.google.com/?q=Lugogo+Arena+Kampala',
      isTest: true,
    };

    setActiveToast(testAlert);
    playReminderChime();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      triggerBrowserNotification(testAlert);
    }
  }, [triggerBrowserNotification]);

  // Periodic polling every 30 seconds
  useEffect(() => {
    if (!user) return;
    checkReminders();
    const interval = setInterval(checkReminders, 30 * 1000);
    return () => clearInterval(interval);
  }, [user, checkReminders]);

  return (
    <MatchReminderContext.Provider
      value={{
        activeToast,
        dismissToast,
        triggerTestNotification,
        hasBrowserPermission,
        requestBrowserPermission,
        checkReminders,
        upcoming1HrMatches,
      }}
    >
      {children}
    </MatchReminderContext.Provider>
  );
};

export const useMatchReminder = (): MatchReminderContextType => {
  const context = useContext(MatchReminderContext);
  if (!context) {
    throw new Error('useMatchReminder must be used within a MatchReminderProvider');
  }
  return context;
};
