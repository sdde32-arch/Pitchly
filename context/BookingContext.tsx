import React, { createContext, useContext, useState, useEffect } from 'react';
import { Turf, Booking } from '../types';
import { TURFS, MY_BOOKINGS } from '../constants';
import { useUser } from './UserContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { slotAlertService } from '../services/slotAlertService';

interface BookingContextType { turfs: Turf[]; bookings: Booking[]; loading: boolean; updateTurf: (id: string, updates: Partial<Turf>) => void; addTurf: (turf: Turf) => void; deleteTurf: (id: string) => void; addBooking: (booking: Partial<Booking>) => Promise<{success: boolean, error?: string}>; updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>; updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>; removeBooking: (id: string) => Promise<void>; toggleBlockDate: (turfId: string, date: string) => void;
}
const BookingContext = createContext<BookingContextType | undefined>(undefined);
const BOOKINGS_CACHE_KEY = 'pitchly_offline_bookings_cache';

const getCachedBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

const setCachedBookings = (list: Booking[]) => {
  try {
    localStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save bookings cache:', err);
  }
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { 
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(() => getCachedBookings());
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useUser();

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      // Load turfs from Firestore
      const turfsSnap = await getDocs(query(collection(db, 'pitches'), where("status", "==", "ACTIVE")));
      const firestoreTurfs = turfsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Turf)); 
      setTurfs(firestoreTurfs.length > 0 ? firestoreTurfs : TURFS); 
      
      // Load bookings if logged in 
      if (user) { 
        const playerQ1 = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        const playerQ2 = query(collection(db, 'bookings'), where('playerId', '==', user.uid));
        const ownerQ = query(collection(db, 'bookings'), where('ownerId', '==', user.uid));
        const [snap1, snap2, snap3] = await Promise.all([getDocs(playerQ1), getDocs(playerQ2), getDocs(ownerQ)]);
        const allBookings = [ 
          ...snap1.docs.map(d => ({ id: d.id, ...d.data() } as Booking)), 
          ...snap2.docs.map(d => ({ id: d.id, ...d.data() } as Booking)), 
          ...snap3.docs.map(d => ({ id: d.id, ...d.data() } as Booking)), 
        ];
        const unique = allBookings.filter((b, i, s) => i === s.findIndex(x => x.id === b.id)); 
        unique.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()); 
        setBookings(unique);
        setCachedBookings(unique);
      } else {
        const cached = getCachedBookings();
        setBookings(cached);
      }
    } catch (e) {
      console.error('BookingContext load error:', e);
      setTurfs(TURFS);
      const cached = getCachedBookings();
      setBookings(cached.length > 0 ? cached : []);
    } finally {
      setLoading(false);
    }
  };

  const addBooking = async (booking: Partial<Booking>): Promise<{success: boolean, error?: string}> => { 
    if (!user) return { success: false, error: 'Not authenticated' }; 
    try { 
      if (booking.id) { 
        setBookings(prev => {
          const updated = [booking as Booking, ...prev];
          setCachedBookings(updated);
          return updated;
        });
        return { success: true }; 
      }
      const turfRef = doc(db, 'pitches', booking.turfId || '');
      const turfSnap = await getDoc(turfRef);
      const turfData = turfSnap.data();
      const newBooking = { 
        ...booking, 
        userId: user.uid, 
        ownerId: turfData?.ownerId || booking.ownerId || '', 
        turfName: turfData?.name || booking.turfName || 'Pitch', 
        status: 'PENDING', 
        paymentStatus: 'UNPAID', 
        createdAt: new Date().toISOString(), 
      };
      const docRef = await addDoc(collection(db, 'bookings'), newBooking); 
      setBookings(prev => {
        const updated = [{ id: docRef.id, ...newBooking } as Booking, ...prev];
        setCachedBookings(updated);
        return updated;
      });
      return { success: true };
    } catch (e: any) { 
      return { success: false, error: e.message };
    } 
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => { 
    try {
      const bookingRef = doc(db, 'bookings', id);
      const snap = await getDoc(bookingRef);
      if (snap.exists()) {
        const b = snap.data() as Booking;
        await updateDoc(bookingRef, { status }); 
        setBookings(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, status } : item);
          setCachedBookings(updated);
          return updated;
        }); 
        if (status as any === 'CANCELLED' || status as any === 'rejected' || status as any === 'REJECTED') {
          const targetPitchId = b.pitchId || b.turfId;
          if (targetPitchId) {
            await slotAlertService.triggerAlerts(targetPitchId, b.date, b.time, b.turfName || 'Pitch');
          }
        }
      } else {
        setBookings(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, status } : item);
          setCachedBookings(updated);
          return updated;
        }); 
      }
    } catch (err) {
      console.error("Error in updateBookingStatus", err);
      await updateDoc(doc(db, 'bookings', id), { status }); 
      setBookings(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, status } : item);
        setCachedBookings(updated);
        return updated;
      }); 
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => { 
    await updateDoc(doc(db, 'bookings', id), updates).catch(console.warn); 
    setBookings(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      setCachedBookings(updated);
      return updated;
    }); 
  };

  const removeBooking = async (id: string) => { 
    await deleteDoc(doc(db, 'bookings', id)).catch(console.warn); 
    setBookings(prev => {
      const updated = prev.filter(b => b.id !== id);
      setCachedBookings(updated);
      return updated;
    }); 
  };
const updateTurf = (id: string, updates: Partial<Turf>) => setTurfs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
const addTurf = (turf: Turf) => setTurfs(prev => [turf, ...prev]);
const deleteTurf = (id: string) => setTurfs(prev => prev.filter(t => t.id !== id));
const toggleBlockDate = (turfId: string, date: string) => { setTurfs(prev => prev.map(t => { if (t.id !== turfId) return t;
const blocked = t.blockedDates?.includes(date) ? t.blockedDates.filter(d => d !== date) : [...(t.blockedDates || []), date]; updateDoc(doc(db, 'pitches', turfId), { blockedDates: blocked }).catch(console.error);
return { ...t, blockedDates: blocked }; })); };
return ( <BookingContext.Provider value={{ turfs, bookings, loading, updateTurf, addTurf, deleteTurf, addBooking, updateBookingStatus, updateBooking, removeBooking, toggleBlockDate }}> {children} </BookingContext.Provider> );
};
export const useBookings = () => { const context = useContext(BookingContext);
if (!context) throw new Error('useBookings must be used within a BookingProvider');
return context;
};
export const useBooking = useBookings;
