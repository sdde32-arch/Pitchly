import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { notificationService, UpcomingMatchItem } from '../services/notificationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const UpcomingMatchesBell: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<UpcomingMatchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [prefs, setPrefs] = useState({ upcomingMatches: false, push: false });
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const fetchMatches = async (upcomingMatchesEnabled: boolean, pushEnabled: boolean) => {
    if (!user || !upcomingMatchesEnabled) return;
    try {
      const upcoming = await notificationService.getUpcomingMatches(user.uid);
      setMatches(upcoming);
      
      // Native notification
      if (upcoming.length > 0 && pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
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

  // Re-fetch every 5 minutes
  useEffect(() => {
    if (!prefsLoaded) return;
    
    const interval = setInterval(() => {
      fetchMatches(prefs.upcomingMatches, prefs.push);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [prefsLoaded, prefs.upcomingMatches, prefs.push]);

  if (!user || !prefs.upcomingMatches) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
        aria-label="Upcoming Match Notifications"
        title="Upcoming Match Notifications"
      >
        <Bell size={20} className="text-text-primary" />
        {matches.length > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-lime rounded-full border-2 border-app-base animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface-card border border-border-subtle rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-border-subtle">
            <h3 className="font-bold text-xs uppercase tracking-widest text-text-primary">Upcoming Matches</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {matches.length === 0 ? (
              <div className="p-4 text-center text-[#71717A] text-xs font-medium">
                No upcoming matches.
              </div>
            ) : (
              matches.map((match) => {
                const now = new Date();
                const [h, m] = match.time.split(':').map(Number);
                const [Y, M, D] = match.date.split('-').map(Number);
                const matchTime = new Date(Y, M - 1, D, h, m);
                const minsLeft = Math.round((matchTime.getTime() - now.getTime()) / 60000);
                
                return (
                  <div 
                    key={match.id} 
                    className="p-4 border-b border-border-subtle hover:bg-surface-raised transition-colors cursor-pointer"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <div className="flex justify-between items-center mb-1.5">
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
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-black uppercase tracking-wider bg-primary-lime text-accent-text hover:bg-[#B2FF1A] transition-all w-full justify-center shadow-md active:scale-95"
                      >
                        <MapPin size={12} />
                        Directions
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
