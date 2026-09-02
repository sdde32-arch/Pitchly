import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { pitchService } from './pitchService';
import { bookingService } from './bookingService';
import { Booking, Payout, StaffMember, Transaction, Turf, BusinessProfile, PitchStatus } from '../types';
import { collection, doc } from 'firebase/firestore';

export const OwnerService = {
  // 1. DASHBOARD STATS
  getDashboardStats: async () => {
    const user = getAuth().currentUser;
    if (!user) return { todayRevenue: 0, todayBookingsCount: 0, occupancyRate: 0, pendingRequests: 0 };

    const today = new Date().toISOString().split('T')[0];
    const bookings = await bookingService.listByOwner(user.uid);
    const todayBookings = bookings.filter((b) => b.date === today && b.status !== 'CANCELLED');
    const revenue = todayBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const pending = bookings.filter((b) => b.status === 'PENDING').length;

    const pitches = await pitchService.listByOwner(user.uid);
    const totalSlots = pitches.length * 10;
    const occupancyRate = totalSlots > 0 ? Math.round((todayBookings.length / totalSlots) * 100) : 0;

    return { todayRevenue: revenue, todayBookingsCount: todayBookings.length, occupancyRate, pendingRequests: pending };
  },

  getRevenueChartData: async () => {
    const user = getAuth().currentUser;
    if (!user) return [];

    const bookings = await bookingService.listByOwner(user.uid);
    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = days.map(day => ({ name: day, sales: 0 }));
    activeBookings.forEach((b) => {
      const dayIndex = new Date(b.date).getDay();
      chartData[dayIndex].sales += (b.price || 0);
    });
    return chartData;
  },

  getTodaySchedule: async () => {
    const user = getAuth().currentUser;
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];
    const bookings = await bookingService.listByOwner(user.uid);
    const todayBookings = bookings.filter(b => b.date === today && b.status !== 'CANCELLED');

    return todayBookings
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((b) => ({
        id: b.id,
        time: b.time,
        turfName: b.turfName || 'Pitch',
        status: b.status,
        userName: b.userName || 'Customer',
      }));
  },

  // 2. PITCHES
  getPitches: async (): Promise<any[]> => {
    const user = getAuth().currentUser;
    if (!user) return [];

    const pitches = await pitchService.listByOwner(user.uid);
    // Map back to the older Turf type expected by components without disrupting UI
    return pitches.map(p => ({
      id: p.id,
      ownerId: p.ownerId,
      name: p.name,
      location: p.location,
      fullAddress: p.fullAddress || p.location,
      pricePerHour: p.pricePerHour,
      image: p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1000',
      status: p.status,
      contactPhone: (p as any).contactPhone || '',
      submittedAt: p.createdAt,
    }));
  },

  addTurf: async (turf: Partial<Turf>): Promise<any | null> => {
    const user = getAuth().currentUser;
    if (!user) return null;

    const newId = doc(collection(db, 'pitches')).id;
    const newPitch = await pitchService.create({
      id: newId,
      ownerId: user.uid,
      name: turf.name!,
      location: turf.location!,
      fullAddress: turf.fullAddress,
      pricePerHour: turf.pricePerHour!,
      images: [turf.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'],
      amenities: turf.amenities || [],
      openingHour: turf.openingHour || '08:00',
      closingHour: turf.closingHour || '23:00',
      contactPhone: turf.contactPhone,
      status: PitchStatus.PENDING_APPROVAL,
      pitchFormats: turf.pitchFormats || [],
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    
    return {
      ...turf,
      id: newPitch.id
    };
  },

  updateTurfDetails: async (id: string, updates: Partial<Turf>) => {
    await pitchService.update(id, {
      name: updates.name,
      location: updates.location,
      pricePerHour: updates.pricePerHour,
      amenities: updates.amenities,
    });
    return true;
  },

  updatePitchStatus: async (id: string, status: string) => {
    await pitchService.update(id, { status: status as any });
    return true;
  },

  // 3. BOOKINGS
  getBookings: async (): Promise<any[]> => {
    const user = getAuth().currentUser;
    if (!user) return [];

    return await bookingService.listByOwner(user.uid);
  },

  updateBookingStatus: async (id: string, status: Booking['status']) => {
    await bookingService.update(id, { status });
    return true;
  },

  // 5. FINANCES (Mock fallback)
  getFinancials: async () => {
    const user = getAuth().currentUser;
    if (!user) return { balance: 0, totalRevenue: 0, transactions: [], payouts: [] };

    const bookings = await bookingService.listByOwner(user.uid);
    const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

    const transactions: Transaction[] = bookings.map((b) => ({
      id: `txn-${b.id}`,
      bookingId: b.id,
      type: 'CREDIT' as const,
      amount: b.price || 0,
      description: `Booking: ${b.turfName || 'Pitch'} (${b.date})`,
      date: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : b.date,
    }));

    return {
      balance: revenue,
      totalRevenue: revenue,
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      payouts: [],
    };
  },

  requestPayout: async (amount: number) => {
    return { id: String(Date.now()), amount, status: 'PENDING', requestDate: new Date().toISOString(), method: 'MOBILE_MONEY' } as Payout;
  },

  // 6. BUSINESS PROFILE
  getBusinessProfile: async (): Promise<BusinessProfile> => {
    const user = getAuth().currentUser;
    if (!user) return OwnerService.getBusinessProfileById('guest');
    return OwnerService.getBusinessProfileById(user.uid);
  },

  getBusinessProfileById: async (ownerId: string): Promise<BusinessProfile> => {
    const defaults: BusinessProfile = {
      businessName: 'My Turf Business',
      contactEmail: '',
      contactPhone: '',
      mobileMoneyNumber: '',
      operatingHours: { open: '08:00', close: '23:00' },
      paymentDetails: {
          mtnNumber: '',
          mtnAccountName: '',
          airtelNumber: '',
          airtelAccountName: '',
          acceptsCash: true
      }
    };
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', ownerId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.businessProfile) {
          return { ...defaults, ...data.businessProfile };
        }
      }
    } catch(e) {
      console.warn("Failed to fetch business profile", e);
    }
    return defaults;
  },

  updateBusinessProfile: async (profile: BusinessProfile) => {
    const user = getAuth().currentUser;
    if (!user) return profile;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { businessProfile: profile }, { merge: true });
    } catch(e) {
      console.error("Failed to save business profile", e);
    }
    return profile;
  },

  // 7. STAFF MANAGEMENT
  getStaff: async (): Promise<StaffMember[]> => {
    const user = getAuth().currentUser;
    if (!user) return [];
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().staff) {
        return snap.data().staff as StaffMember[];
      }
    } catch (e) {
      console.warn("Failed to fetch staff", e);
    }
    return [];
  },

  addStaff: async (staffMember: StaffMember) => {
    const user = getAuth().currentUser;
    if (!user) return;
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      const currentStaff: StaffMember[] = snap.exists() && snap.data().staff ? snap.data().staff : [];
      await setDoc(docRef, { staff: [...currentStaff, staffMember] }, { merge: true });
    } catch (e) {
      console.error("Failed to add staff", e);
    }
  },

  deleteStaff: async (staffId: string) => {
    const user = getAuth().currentUser;
    if (!user) return;
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().staff) {
        const updatedStaff = (snap.data().staff as StaffMember[]).filter(s => s.id !== staffId);
        await setDoc(docRef, { staff: updatedStaff }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to delete staff", e);
    }
  },
};
