import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, MapPin, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { notificationService, UpcomingMatchItem } from '../services/notificationService';
import type { Notification } from '../types/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const UpcomingMatchesBell: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<UpcomingMatchItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState({ upcomingMatches: false, push: false });
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Subscribe to real-time user notifications
  useEffect(() => {
    const authUid = user?.uid || (user as any)?.id;
    if (!authUid) {
      setNotifications([]);
      return;
    }
    const unsubscribe = notificationService.subscribeUserNotifications(authUid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [user]);

  const fetchMatches = async (upcomingMatchesEnabled: boolean, pushEnabled: boolean) => {
    if (!user || !upcomingMatchesEnabled) return;
    try {
      const upcoming = await notificationService.getUpcomingMatches(user.uid);
      setMatches(upcoming);
      
      // Native notification
      try {
        if (upcoming.length > 0 && pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const soonest = upcoming[0];
          const matchKey = `notified_${soonest.id}`;
          if (!localStorage.getItem(matchKey)) {
            const notif = new Notification('Upcoming Match', {
              body: `Your match at ${soonest.turfName || 'the turf'} starts at ${soonest.time}.${soonest.mapUrl ? ' Click to view location on map.' : ''}`,
              icon: '/logo.svg'
            });
            if (soonest.mapUrl) {
              notif.onclick = () => {
                window.open(soonest.mapUrl, '_blank');
              };
            }
            localStorage.setItem(matchKey, 'true');
          }
        }
      } catch (notifErr) {
        // Suppress restricted notification/storage in iframe
      }
    } catch (err) {
      console.warn("Failed to fetch upcoming matches:", err);
    }
  };

  // Re-fetch when the dropdown is opened
  useEffect(() => {
    if (isOpen && prefsLoaded) {
      fetchMatches(prefs.upcomingMatches, prefs.push).catch(err => {
        console.warn("Error in fetchMatches effect:", err);
      });
    }
  }, [isOpen, prefsLoaded]);

  useEffect(() => {
    if (!user) return;
    
    // Check click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    let isMounted = true;

    // Fetch prefs & matches on mount
    const init = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (!isMounted) return;

        const userPrefs = snap.exists() ? snap.data().notificationPrefs || {} : {};
        
        const upcomingMatchesEnabled = userPrefs.upcomingMatches !== false;
        const pushEnabled = userPrefs.push === true;
        setPrefs({ upcomingMatches: upcomingMatchesEnabled, push: pushEnabled });
        setPrefsLoaded(true);
        
        await fetchMatches(upcomingMatchesEnabled, pushEnabled);
      } catch (err) {
        console.warn("Failed to retrieve user preferences or notifications:", err);
        if (!isMounted) return;
        // Graceful fallback to default values
        setPrefs({ upcomingMatches: true, push: false });
        setPrefsLoaded(true);
      }
    };
    
    init();

    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]);

  // Re-fetch matches every 5 minutes
  useEffect(() => {
    if (!prefsLoaded) return;
    
    const interval = setInterval(() => {
      fetchMatches(prefs.upcomingMatches, prefs.push);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [prefsLoaded, prefs.upcomingMatches, prefs.push]);

  if (!user) return null;

  const unreadNotifs = notifications.filter((n) => !n.isRead && !n.read);
  const unreadCount = unreadNotifs.length;
  const hasIndicator = unreadCount > 0 || matches.length > 0;

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_PREEMPTED':
        return <AlertTriangle size={15} className="text-[#EF4444] shrink-0" />;
      case 'BOOKING_REMINDER':
        return <Clock size={15} className="text-[#FACC15] shrink-0" />;
      case 'MATCH_INVITE':
        return <Users size={15} className="text-[#2B8CEE] shrink-0" />;
      case 'PAYMENT_RECEIVED':
        return <CheckCircle2 size={15} className="text-primary-lime shrink-0" />;
      case 'SYSTEM':
      default:
        return <Bell size={15} className="text-text-primary shrink-0" />;
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    setIsOpen(false);
    if (!n.isRead && !n.read) {
      notificationService.markAsRead(n.id).catch(console.warn);
    }
    if (n.type === 'BOOKING_PREEMPTED' || n.bookingId) {
      navigate(`/booking-confirmation/${n.bookingId}`);
    } else if (n.link) {
      navigate(n.link);
    } else {
      navigate('/bookings');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={20} className="text-text-primary" />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-app-base">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : hasIndicator ? (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-lime rounded-full border-2 border-app-base animate-pulse"></span>
        ) : null}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface-card border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-3.5 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-widest text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] px-2 py-0.5 rounded-full border border-[#EF4444]/30">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-subtle">
            {/* Real-time Notifications */}
            {notifications.length > 0 && (
              <div>
                {notifications.map((n) => {
                  const isUnread = !n.isRead && !n.read;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-surface-raised transition-colors cursor-pointer text-left space-y-1 ${
                        isUnread ? 'bg-surface-raised/60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{renderNotificationIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-text-primary truncate">
                              {n.title || 'Notification'}
                            </span>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-primary-lime shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary leading-snug line-clamp-2 mt-0.5">
                            {n.message || n.body}
                          </p>
                          {n.type === 'BOOKING_PREEMPTED' && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-[#EF4444] uppercase tracking-wider">
                              Tap to review & book another slot →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upcoming Matches Section */}
            {matches.length > 0 && (
              <div>
                <div className="px-3.5 py-1.5 bg-surface-raised/40 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Upcoming Kick-Offs
                </div>
                {matches.map((match) => {
                  const now = new Date();
                  const [h, m] = match.time.split(':').map(Number);
                  const [Y, M, D] = match.date.split('-').map(Number);
                  const matchTime = new Date(Y, M - 1, D, h, m);
                  const minsLeft = Math.round((matchTime.getTime() - now.getTime()) / 60000);
                  
                  return (
                    <div 
                      key={match.id} 
                      className="p-3.5 hover:bg-surface-raised transition-colors cursor-pointer"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-text-primary">{match.turfName || 'Match'}</span>
                        <span className="text-xs font-bold text-primary-lime">{minsLeft} min</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{match.time}</span>
                        </div>
                        <span className="opacity-70">{match.title}</span>
                      </div>
                      {match.mapUrl && (
                        <a
                          href={match.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[11px] font-black uppercase tracking-wider bg-primary-lime text-accent-text hover:bg-[#B2FF1A] transition-all w-full justify-center shadow-xs active:scale-95"
                        >
                          <MapPin size={12} />
                          Directions
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {notifications.length === 0 && matches.length === 0 && (
              <div className="p-6 text-center text-text-tertiary text-xs font-medium">
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
