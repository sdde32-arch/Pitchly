import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus, 
  Loader2, 
  Building2, 
  Lock, 
  Unlock, 
  Activity, 
  Wrench, 
  ChevronRight, 
  TrendingUp, 
  Phone, 
  ShieldCheck, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Smartphone,
  Users,
  ArrowRight,
  Compass,
  Layers,
  Zap,
  HelpCircle,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pitchService } from '../../services/pitchService';
import { bookingService } from '../../services/bookingService';
import { useUser } from '../../context/UserContext';
import { useInteractiveWalkthrough } from '../../context/InteractiveWalkthroughContext';
import { Pitch, SlotAvailability } from '../../types/firebase';
import { WeeklyOccupancyHeatmap } from './WeeklyOccupancyHeatmap';

interface BentoKpiProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  accentColor: string;
  badgeText?: string;
  badgeBg?: string;
  onClick?: () => void;
}

const BentoKpiCard: React.FC<BentoKpiProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  badgeText,
  badgeBg = 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
  onClick
}) => (
  <div 
    id={id} 
    onClick={onClick}
    className={`bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-xs ${
      onClick ? 'cursor-pointer active:scale-[0.98]' : ''
    }`}
  >
    <div className="flex items-center justify-between mb-3.5">
      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
        {title}
      </span>
      <div className={`w-10 h-10 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center ${accentColor} transition-transform group-hover:scale-105`}>
        <Icon size={18} />
      </div>
    </div>
    
    <div className="space-y-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-extrabold text-text-primary tracking-tight font-display">
          {value}
        </span>
        {badgeText && (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeBg}`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-text-secondary font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

export const OwnerOverview: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useUser();
  const { openWalkthrough } = useInteractiveWalkthrough();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const navigate = useNavigate();

  // Live Slot Toggle Grid State
  const [selectedPitchId, setSelectedPitchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'OPEN' | 'LOCKED' | 'BOOKED'>('ALL');
  const [slotsAvailability, setSlotsAvailability] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  const handleSeedDemoPitch = async () => {
    const uId = userProfile?.id || user?.uid;
    if (!uId) return;
    setSeedingDemo(true);
    try {
      const demoPitch: Pitch = {
        id: `pitch_demo_${uId.slice(0, 8)}`,
        ownerId: uId,
        name: "Kigozi Sports Arena - Pitch 1",
        location: "Lugogo Bypass, Kampala",
        formattedAddress: "Plot 12 Lugogo Bypass, Near UMA Showgrounds, Kampala",
        pricePerHour: 120000,
        openingHour: "07:00",
        closingHour: "23:00",
        pitchFormats: ["7-a-side", "Synthetic AstroTurf"],
        amenities: ["Floodlights", "Changing Rooms", "Secure Parking", "Showers", "Cafeteria", "Free WiFi"],
        images: [
          "https://images.unsplash.com/photo-1529900241451-b8f416550794?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80"
        ],
        status: "ACTIVE" as any,
        surfaceType: "FIFA Synthetic Turf",
        latitude: 0.3275,
        longitude: 32.6041,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await pitchService.create(demoPitch);
      setPitches([demoPitch]);
      setSelectedPitchId(demoPitch.id);
    } catch (err) {
      console.warn("Could not save demo pitch to Firestore, activating in-memory preview:", err);
      const localDemo: Pitch = {
        id: `pitch_demo_local`,
        ownerId: uId,
        name: "Kigozi Sports Arena - Pitch 1",
        location: "Lugogo Bypass, Kampala",
        formattedAddress: "Plot 12 Lugogo Bypass, Near UMA Showgrounds, Kampala",
        pricePerHour: 120000,
        openingHour: "07:00",
        closingHour: "23:00",
        pitchFormats: ["7-a-side", "Synthetic AstroTurf"],
        amenities: ["Floodlights", "Changing Rooms", "Secure Parking", "Showers"],
        images: ["https://images.unsplash.com/photo-1529900241451-b8f416550794?auto=format&fit=crop&q=80"],
        status: "ACTIVE" as any,
        surfaceType: "FIFA Synthetic Turf",
        latitude: 0.3275,
        longitude: 32.6041,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPitches([localDemo]);
      setSelectedPitchId(localDemo.id);
    } finally {
      setSeedingDemo(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const uId = userProfile?.id || user?.uid;
        if (!uId) return;

        const [realPitches, realBookings] = await Promise.all([
          pitchService.listByOwner(uId),
          bookingService.listByOwner(uId)
        ]);

        setPitches(realPitches);
        setBookings(realBookings);

        if (realPitches.length > 0 && !selectedPitchId) {
          setSelectedPitchId(realPitches[0].id);
        }
        setLoading(false);
      } catch (e) {
        console.error('Dashboard load error:', e);
        setLoading(false);
      }
    };
    load();
  }, [user, userProfile, authLoading]);

  // Subscribe to live slot availability for selected pitch and date
  useEffect(() => {
    if (!selectedPitchId || !selectedDate) return;

    setLoadingSlots(true);
    const unsubscribe = bookingService.subscribeSlotAvailability(
      selectedPitchId,
      selectedDate,
      (availList) => {
        setSlotsAvailability(availList);
        setLoadingSlots(false);
      },
      (err) => {
        console.error('Error subscribing to owner slot grid:', err);
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [selectedPitchId, selectedDate]);

  const activePitch = pitches.find(p => p.id === selectedPitchId) || pitches[0];

  // Generate standard operating slots for pitch
  const operatingTimes = React.useMemo(() => {
    const open = activePitch?.openingHour || "07:00";
    const close = activePitch?.closingHour || "23:00";
    const openH = parseInt(open.split(':')[0], 10) || 7;
    const closeH = parseInt(close.split(':')[0], 10) || 23;
    const list: string[] = [];
    for (let h = openH; h < closeH; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, [activePitch]);

  const handleToggleSlotLock = async (time: string, currentStatus: string) => {
    if (!selectedPitchId || !selectedDate) return;
    const isCurrentlyBlocked = currentStatus === 'blocked';
    const newBlockedState = !isCurrentlyBlocked;

    setTogglingSlot(time);
    try {
      await bookingService.toggleSlotBlock(
        selectedPitchId,
        selectedDate,
        time,
        newBlockedState,
        'walk-in-maintenance'
      );
    } catch (err) {
      console.error('Failed to toggle slot lock state', err);
    } finally {
      setTogglingSlot(null);
    }
  };

  const setDateToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setDateTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 w-full overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-card rounded-2xl p-4 border border-border-subtle h-28 shimmer-effect space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 rounded bg-surface-raised" />
                <div className="w-8 h-8 rounded-xl bg-surface-raised" />
              </div>
              <div className="h-6 w-28 rounded-md bg-surface-raised" />
              <div className="h-2.5 w-36 rounded bg-surface-raised" />
            </div>
          ))}
        </div>
        <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-72 shimmer-effect space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-36 rounded bg-surface-raised" />
            <div className="h-8 w-24 rounded-xl bg-surface-raised" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map(s => (
              <div key={s} className="h-16 rounded-xl bg-surface-raised" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state when owner has zero pitches: Grand Responsive Facility Onboarding Hub
  if (pitches.length === 0) {
    return (
      <div id="owner-onboarding-hub" className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-card border border-border-subtle p-6 sm:p-8 lg:p-10 shadow-lg">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-lime/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 tracking-wide uppercase">
                  <Building2 size={13} strokeWidth={2.5} />
                  Turf Facility Onboarding
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-raised text-text-secondary border border-border-subtle">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  Kampala Partner Network
                </span>
              </div>

              <h1 id="onboarding-hero-title" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
                Welcome to Your Turf Facility Command Center
              </h1>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Connect your sports ground to thousands of football players, squads, and captains across Kampala.
                Manage live slot reservations, lock maintenance hours, and track automated Mobile Money payouts with zero escrow delays.
              </p>
            </div>

            {/* Direct Action Hub */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
              <button
                id="btn-onboarding-add-pitch"
                onClick={() => navigate('/owner/add-pitch')}
                className="w-full px-5 py-3.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary-lime/25 active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>List Your Pitch Ground</span>
              </button>

              <button
                id="btn-onboarding-seed-demo"
                onClick={handleSeedDemoPitch}
                disabled={seedingDemo}
                className="w-full px-5 py-3 bg-surface-raised hover:bg-surface-raised/80 text-text-primary border border-border-subtle hover:border-primary-lime/40 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {seedingDemo ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-primary-lime" />
                    <span>Loading Demo Data...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} className="text-primary-lime" />
                    <span>⚡ Load Sample Facility Data</span>
                  </>
                )}
              </button>

              <button
                id="btn-onboarding-walkthrough"
                onClick={() => openWalkthrough(8)}
                className="w-full px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass size={14} className="text-primary-lime" />
                <span>Take Venue Owner Tour</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Step Setup Roadmap */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                3 Steps to Live Match Bookings
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary">
                Complete these three quick steps to start receiving squad bookings and MoMo payouts.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-surface-card border border-border-subtle text-text-tertiary">
              Setup Progress: 0 / 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle hover:border-primary-lime/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-lime/10 border border-primary-lime/20 flex items-center justify-center text-primary-lime">
                    <Building2 size={20} />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary-lime/10 text-primary-lime border border-primary-lime/25">
                    Step 1 · Required
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary-lime transition-colors">
                    Ground Profile & Surface
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    Upload turf photos, set surface type (FIFA Synthetic AstroTurf or Natural Grass), and declare formats (5-a-side to 11-a-side).
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/owner/add-pitch')}
                className="w-full py-2.5 px-3 bg-surface-raised hover:bg-surface-raised/80 text-text-primary font-bold text-xs rounded-xl flex items-center justify-between border border-border-subtle group-hover:border-primary-lime/30 transition-all cursor-pointer"
              >
                <span>Add Ground Details</span>
                <ArrowRight size={14} className="text-primary-lime" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle hover:border-primary-lime/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/20 flex items-center justify-center text-[#FACC15]">
                    <Clock size={20} />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/25">
                    Step 2 · Pricing
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary-lime transition-colors">
                    Operating Hours & Rates
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    Configure standard day rates (e.g. UGX 80k) and floodlit night rates (e.g. UGX 120k). Set opening hours from 07:00 to 23:00.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/owner/add-pitch')}
                className="w-full py-2.5 px-3 bg-surface-raised hover:bg-surface-raised/80 text-text-primary font-bold text-xs rounded-xl flex items-center justify-between border border-border-subtle group-hover:border-primary-lime/30 transition-all cursor-pointer"
              >
                <span>Set Hourly Rates</span>
                <ArrowRight size={14} className="text-primary-lime" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle hover:border-primary-lime/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                    <Smartphone size={20} />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25">
                    Step 3 · Financials
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary-lime transition-colors">
                    MoMo Merchant Payouts
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    Link MTN MoMo (*165#) or Airtel Money (*185#) merchant lines to receive instant match payouts with zero escrow holding fees.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/owner?tab=Finances')}
                className="w-full py-2.5 px-3 bg-surface-raised hover:bg-surface-raised/80 text-text-primary font-bold text-xs rounded-xl flex items-center justify-between border border-border-subtle group-hover:border-primary-lime/30 transition-all cursor-pointer"
              >
                <span>Connect MoMo Wallet</span>
                <ArrowRight size={14} className="text-primary-lime" />
              </button>
            </div>
          </div>
        </div>

        {/* Why Facility Owners Choose Footlink Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 flex items-center justify-center text-primary-lime mb-3">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">
              Anti-Double Booking Engine
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              When a player opens checkout, their slot is held live for 10 minutes in the cloud, completely preventing walk-in double booking.
            </p>
          </div>

          <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 flex items-center justify-center text-primary-lime mb-3">
              <Wrench size={18} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">
              1-Tap Slot Lock Controls
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Instantly lock any match hour for pitch grass grooming, floodlight servicing, or cash walk-ins right from your mobile phone.
            </p>
          </div>

          <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 flex items-center justify-center text-primary-lime mb-3">
              <Users size={18} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">
              Direct Squad Matchmaking
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Access over 40+ active Kampala neighborhood squads and tournament organizers seeking recurring weekly match slots.
            </p>
          </div>
        </div>

        {/* Onboarding Concierge Support Footer */}
        <div className="bg-surface-card/60 rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center text-text-secondary shrink-0">
              <Phone size={18} className="text-primary-lime" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-text-primary">
                Need concierge help setting up your sports arena?
              </p>
              <p className="text-[11px] sm:text-xs text-text-secondary">
                Our Kampala Turf Operations team will assist you with pitch verification and slot pricing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+256700000000"
              className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-raised/80 text-text-primary text-xs font-bold border border-border-subtle transition-all flex items-center gap-1.5"
            >
              <Phone size={13} />
              <span>+256 700 000 000</span>
            </a>
            <button
              onClick={() => openWalkthrough(8)}
              className="px-3.5 py-2 rounded-xl bg-primary-lime/10 hover:bg-primary-lime/20 text-primary-lime border border-primary-lime/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle size={13} />
              <span>Owner FAQ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // KPI Calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeBookings = bookings.filter(b => 
    b.status !== 'CANCELLED' && 
    b.status?.toUpperCase() !== 'CANCELLED' && 
    b.status !== 'REJECTED' && 
    b.status?.toUpperCase() !== 'REJECTED'
  );

  const todaysBookings = activeBookings.filter(b => b.date === todayStr);
  const todaysBookingsCount = todaysBookings.length;

  const revenueThisMonth = activeBookings
    .filter(b => {
      const isCurrentMonth = b.date && b.date.startsWith(currentYearMonth);
      const isConfirmedOrPaid = 
        b.status === 'CONFIRMED' || 
        b.status === 'CHECKED_IN' || 
        b.status === 'COMPLETED' || 
        b.paymentStatus === 'PAID' || 
        b.paymentStatus === 'APPROVED';
      return isCurrentMonth && isConfirmedOrPaid;
    })
    .reduce((sum, b) => sum + (b.price || b.totalPrice || 0), 0);

  // Pitch Utilization Calculation
  const totalOperatingSlotsToday = (pitches.length || 1) * 14;
  const pitchUtilizationRate = Math.min(100, Math.round((todaysBookingsCount / (totalOperatingSlotsToday || 1)) * 100));

  // Filtered Slots for the Live Matrix
  const filteredOperatingTimes = operatingTimes.filter(time => {
    if (slotFilter === 'ALL') return true;
    const slotInfo = slotsAvailability.find(s => s.time === time);
    const status = slotInfo?.status || 'open';
    if (slotFilter === 'OPEN') return status === 'open';
    if (slotFilter === 'LOCKED') return status === 'blocked';
    if (slotFilter === 'BOOKED') return status === 'booked' || status === 'held';
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn font-sans w-full">
      {/* Top Banner with Quick Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider">
              Pitch Owner Hub
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#22C55E] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              Live Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Facility Overview
          </h1>
          <p className="text-xs text-text-secondary">
            {pitches.length} active {pitches.length === 1 ? 'pitch' : 'pitches'} · Kampala, Uganda
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <button
            onClick={() => navigate('/owner?tab=Bookings')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
          >
            All Bookings
          </button>
          <button
            onClick={() => navigate('/owner/add-pitch')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Pitch</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid: Stacks gracefully on mobile (1 col), tablet (2 col), desktop (4 col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <BentoKpiCard
          id="kpi-todays-bookings"
          title="Today's Matches"
          value={todaysBookingsCount}
          subtitle={`${todaysBookings.filter(b => b.status === 'CONFIRMED').length} confirmed`}
          icon={Calendar}
          accentColor="text-[#38BDF8]"
          badgeText="Live"
          badgeBg="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
          onClick={() => navigate('/owner?tab=Bookings')}
        />

        <BentoKpiCard
          id="kpi-revenue"
          title="Monthly Revenue"
          value={`UGX ${(revenueThisMonth / 1000).toFixed(0)}k`}
          subtitle={`UGX ${revenueThisMonth.toLocaleString()} gross`}
          icon={DollarSign}
          accentColor="text-primary-lime"
          badgeText="UGX"
          badgeBg="bg-primary-lime/10 text-primary-lime border-primary-lime/30"
          onClick={() => navigate('/owner?tab=Finances')}
        />

        <BentoKpiCard
          id="kpi-utilization"
          title="Pitch Utilization"
          value={`${pitchUtilizationRate}%`}
          subtitle={`${todaysBookingsCount} of ${totalOperatingSlotsToday} slots`}
          icon={Activity}
          accentColor="text-[#A78BFA]"
          badgeText={pitchUtilizationRate > 50 ? "High" : "Normal"}
          badgeBg="bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30"
        />

        <BentoKpiCard
          id="kpi-facilities"
          title="Active Grounds"
          value={pitches.length}
          subtitle="Managed turf arenas"
          icon={Building2}
          accentColor="text-[#FACC15]"
          badgeText="Active"
          badgeBg="bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
          onClick={() => navigate('/owner/pitches')}
        />
      </div>

      {/* Weekly Occupancy Heatmap Grid */}
      <WeeklyOccupancyHeatmap pitches={pitches} bookings={bookings} />

      {/* Live Slot Toggle Matrix (Maintenance & Walk-ins) */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-5 shadow-sm">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-[#38BDF8]" />
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Live Slot Control
              </h2>
            </div>
            <p className="text-xs text-text-secondary max-w-xl">
              Tap any slot to lock/unlock for walk-in cash players or pitch repairs in real time.
            </p>
          </div>

          {/* Facility & Date Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {pitches.length > 1 && (
              <select
                value={selectedPitchId}
                onChange={(e) => setSelectedPitchId(e.target.value)}
                className="flex-1 sm:flex-initial bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#38BDF8] min-h-[40px]"
              >
                {pitches.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            {/* Quick Today/Tomorrow Pills */}
            <div className="flex items-center bg-surface-raised p-1 rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={setDateToday}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedDate === todayStr 
                    ? "bg-primary-lime text-accent-text font-extrabold" 
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={setDateTomorrow}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedDate !== todayStr 
                    ? "bg-primary-lime text-accent-text font-extrabold" 
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Date Picker Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#38BDF8] min-h-[40px]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['ALL', 'OPEN', 'LOCKED', 'BOOKED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSlotFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                slotFilter === f
                  ? "bg-text-primary text-app-base font-extrabold"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {f === 'ALL' ? 'All Slots' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="text-[11px] text-text-tertiary ml-auto hidden sm:inline">
            Showing {filteredOperatingTimes.length} of {operatingTimes.length} slots
          </span>
        </div>

        {/* Slot Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        {loadingSlots ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-text-secondary">
            <Loader2 size={20} className="animate-spin text-[#38BDF8]" />
            <span>Loading real-time availability...</span>
          </div>
        ) : filteredOperatingTimes.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-tertiary bg-surface-raised rounded-xl border border-border-subtle">
            No slots match the "{slotFilter}" filter for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredOperatingTimes.map((time) => {
              const slotInfo = slotsAvailability.find(s => s.time === time);
              const status = slotInfo?.status || 'open';
              const isBlocked = status === 'blocked';
              const isBooked = status === 'booked';
              const isHeld = status === 'held';
              const isToggling = togglingSlot === time;

              let badgeStyle = "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30";
              let statusLabel = "Available for Players";
              let cardBg = "bg-surface-raised/60 hover:bg-surface-raised border-border-subtle";

              if (isBlocked) {
                badgeStyle = "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30";
                statusLabel = "Locked (Maintenance/Walk-in)";
                cardBg = "bg-[#FACC15]/5 border-[#FACC15]/30";
              } else if (isBooked) {
                badgeStyle = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
                statusLabel = "Booked by Player";
                cardBg = "bg-surface-card border-border-subtle opacity-80";
              } else if (isHeld) {
                badgeStyle = "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30";
                statusLabel = "In Player Checkout Cart";
                cardBg = "bg-[#38BDF8]/5 border-[#38BDF8]/30";
              }

              const startHour = parseInt(time.split(':')[0], 10);
              const nextHourStr = `${String(startHour + 1).padStart(2, '0')}:00`;

              return (
                <div
                  key={time}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-text-tertiary" />
                      <span className="text-sm font-bold text-text-primary">
                        {time} – {nextHourStr}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                      {isBlocked ? "Locked" : isBooked ? "Booked" : isHeld ? "In Cart" : "Open"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs gap-2">
                    <span className="text-[11px] text-text-secondary truncate">
                      {statusLabel}
                    </span>

                    {/* Toggle Button for Owner */}
                    {!isBooked ? (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleSlotLock(time, status)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px] shrink-0 ${
                          isBlocked
                            ? "bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30"
                            : "bg-[#FACC15]/15 hover:bg-[#FACC15]/25 text-[#FACC15] border border-[#FACC15]/30"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : isBlocked ? (
                          <>
                            <Unlock size={13} />
                            <span>Unlock</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} />
                            <span>Lock Slot</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wider px-2 py-1 bg-[#EF4444]/10 rounded-md">
                        Reserved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Match Queue */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-lime" />
            <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              Today's Scheduled Matches
            </h2>
          </div>
          <button
            onClick={() => navigate('/owner?tab=Bookings')}
            className="text-xs font-bold text-primary-lime hover:underline flex items-center gap-1"
          >
            <span>View All ({todaysBookings.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {todaysBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaysBookings.slice(0, 6).map((b) => (
              <div 
                key={b.id} 
                className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-border-subtle hover:border-border-prominent transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center text-primary-lime shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {b.userName || b.playerName || 'Player Match'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {b.time} · {pitches.find(p => p.id === b.pitchId)?.name || 'Main Turf'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30' 
                      : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30'
                  }`}>
                    {b.status}
                  </span>
                  {b.userPhone && (
                    <a
                      href={`tel:${b.userPhone}`}
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary"
                      title="Call Player"
                    >
                      <Phone size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-surface-raised rounded-xl border border-border-subtle text-xs text-text-secondary">
            No player bookings scheduled for today yet.
          </div>
        )}
      </div>
    </div>
  );
};
