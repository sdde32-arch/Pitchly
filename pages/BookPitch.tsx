import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle2, Clock, UploadCloud, FileImage, CreditCard, ShieldCheck, Check, Wallet, Home,
  Zap, AlertCircle, Info, Shield, FileCheck, AlertTriangle
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { pitchService } from "../services/pitchService";
import { SlotAvailability, Booking } from "../types/firebase";
import { Turf, BookingStatus, PaymentMethod, BookingTier } from "../types";
import { bookingService } from "../services/bookingService";
import { storageService } from "../services/storageService";
import { matchInvitationService } from "../services/matchInvitationService";
import { Layout } from "../components/Layout";
import { Loader2 } from "lucide-react";
import { MatchWeatherWidget } from "../components/weather/MatchWeatherWidget";
import { formatBookingDate } from "../lib/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import { BookingProgressIndicator, BookingStep } from "../components/booking/BookingProgressIndicator";

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 18 : -18,
    opacity: 0,
    filter: "blur(2px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -18 : 18,
    opacity: 0,
    filter: "blur(2px)",
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export const BookPitch: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile } = useUser();
  const [realPitch, setRealPitch] = useState<any>(null);
  const [loadingPitch, setLoadingPitch] = useState(true);

  const paramDate = searchParams.get('date');
  const paramTime = searchParams.get('time');
  const proposalId = searchParams.get('proposalId');
  const paramTier = searchParams.get('tier');
  const paramDeposit = searchParams.get('deposit');

  const initialTier: BookingTier = paramTier === 'deposit' || paramDeposit === 'true' || paramTier === 'tentative'
    ? 'DEPOSIT'
    : 'FULL';

  // States
  const todayStr = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const [selectedDate, setSelectedDate] = useState<string>(paramDate || todayStr);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(paramTime ? [paramTime] : []);
  const [slotAvailabilityList, setSlotAvailabilityList] = useState<SlotAvailability[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1); // 1: Date/Time, 2: Details, 3: Payment, 4: Success
  const [stepDirection, setStepDirection] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MTN);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(15 * 60);
  const [selectedTier, setSelectedTier] = useState<BookingTier>(initialTier);
  const [transactionRef, setTransactionRef] = useState<string>("");

  const normalizedId = id?.replace(/^pitch-/, "") || "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const fetchPitch = async () => {
      if (!id) return;
      setLoadingPitch(true);
      try {
        let p = await pitchService.getById(id);
        if (!p && normalizedId && normalizedId !== id) {
          p = await pitchService.getById(normalizedId);
        }
        setRealPitch(p);
      } catch (err) {
        console.error("Error fetching pitch", err);
      } finally {
        setLoadingPitch(false);
      }
    };
    fetchPitch();
  }, [id, normalizedId]);

  const turf: Turf | null = realPitch ? {
    id: realPitch.id,
    ownerId: realPitch.ownerId,
    name: realPitch.name,
    location: realPitch.location,
    pricePerHour: realPitch.pricePerHour,
    type: realPitch.pitchFormats?.[0] || "11-a-side",
    image: realPitch.images?.[0] || "",
    rating: 4.8,
    distance: "2.4km away",
    status: realPitch.status as any,
    amenities: realPitch.amenities || [],
    openingHour: realPitch.openingHour || "06:00",
    closingHour: realPitch.closingHour || "23:00",
    blockedDates: [],
  } : null;

  // Next 14 days calendar starting from today's date
  const calendarDays = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const fullMonthStr = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const fullDateStr = `${year}-${monthNum}-${String(dayNum).padStart(2, '0')}`;
      
      list.push({
        dayName,
        fullDayName,
        dayNum,
        monthStr,
        fullMonthStr,
        year,
        fullDateStr,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const timesList = React.useMemo(() => {
    let open = turf?.openingHour || "07:00";
    let close = turf?.closingHour || "22:00";
    const openHour = parseInt(open.split(':')[0]);
    const closeHour = parseInt(close.split(':')[0]);
    const list: string[] = [];
    for (let h = openHour; h < closeHour; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, [turf]);

  const depositPercentage = (realPitch as any)?.depositPercentage || (turf as any)?.depositPercentage || 30;
  const basePitchTotal = turf ? turf.pricePerHour * selectedTimes.length : 0;
  const depositAmount = Math.max(20000, Math.round((basePitchTotal * (depositPercentage / 100)) / 1000) * 1000);
  const balanceDue = Math.max(0, basePitchTotal - depositAmount);

  const anySelectedSlotIsTentative = useMemo(() => {
    return selectedTimes.some(t => {
      const s = slotAvailabilityList.find(item => item.time === t);
      return s?.status === 'tentative';
    });
  }, [selectedTimes, slotAvailabilityList]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    setLoadingBookings(true);
    setHasError(false);

    // Auto-release any expired pending slots/bookings before loading availability
    bookingService.autoReleasePendingBookings({ pitchId: id, date: selectedDate }).catch(console.warn);

    const unsubscribe = bookingService.subscribeSlotAvailabilityByPitchAndDate(id, selectedDate, (slots) => {
      setSlotAvailabilityList(slots);
      setLoadingBookings(false);
      setHasError(false);
    }, (err) => {
      console.error("Error subscribing to pitch slot availability:", err);
      setLoadingBookings(false);
      setHasError(true);
    });

    return () => unsubscribe();
  }, [id, selectedDate]);

  // 15-minute auto-release payment window timer
  useEffect(() => {
    if (bookingStep < 2 || !holdExpiresAt) return;

    const interval = setInterval(() => {
      const remainingMs = holdExpiresAt - Date.now();
      if (remainingMs <= 0) {
        clearInterval(interval);
        setHoldExpiresAt(null);
        setSelectedTimes([]);
        setBookingStep(1);
        setErrorMsg("Your 15-minute payment window has expired. The held time slots have been automatically released back to the pitch schedule.");
        if (turf?.id) {
          bookingService.releaseExpiredSlotLocks(turf.id, selectedDate).catch(console.warn);
        }
      } else {
        setHoldSecondsRemaining(Math.ceil(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingStep, holdExpiresAt, turf?.id, selectedDate]);

  const getSlotStatus = (time: string) => {
    if (hasError) return 'unavailable';
    const now = Date.now();
    const slot = slotAvailabilityList.find(s => s.time === time);
    if (!slot) return 'available';
    if (slot.status === 'blocked') return 'blocked';
    if (slot.status === 'booked') return 'booked';
    if (slot.status === 'tentative') return 'tentative';
    if (slot.status === 'held') {
      const expiresAt = slot.expiresAt ? new Date(slot.expiresAt).getTime() : 0;
      if (expiresAt > now) {
        return 'held';
      }
      return 'available';
    }
    return 'available';
  };

  const isSlotPassed = (timeStr: string, dateStr: string) => {
    if (dateStr !== todayStr) return false;
    const currentHour = new Date().getHours();
    const slotHour = parseInt(timeStr.split(':')[0]);
    return slotHour <= currentHour;
  };

  const handleSlotClick = (time: string) => {
    setErrorMsg("");
    if (hasError) {
      setErrorMsg("Couldn't load current availability — please refresh before booking.");
      return;
    }
    if (isSlotPassed(time, selectedDate)) {
      setErrorMsg("This time slot has already passed. Please select a future time slot.");
      return;
    }
    setSelectedTimes(prev => {
      if (prev.includes(time)) {
        if (prev.length <= 1) return [];
        const indices = prev.map(t => timesList.indexOf(t)).sort((a, b) => a - b);
        const currentIndex = timesList.indexOf(time);
        if (currentIndex === indices[0]) {
          return prev.filter(t => t !== time);
        } else if (currentIndex === indices[indices.length - 1]) {
          return prev.filter(t => t !== time);
        } else {
          setErrorMsg("Your selection must be consecutive. Deselecting this would leave a gap.");
          return prev;
        }
      } else {
        if (prev.length === 0) return [time];
        const indices = prev.map(t => timesList.indexOf(t)).sort((a, b) => a - b);
        const newIndex = timesList.indexOf(time);
        const isAdjacent = newIndex === indices[0] - 1 || newIndex === indices[indices.length - 1] + 1;
        if (isAdjacent) {
          return [...prev, time].sort((a, b) => timesList.indexOf(a) - timesList.indexOf(b));
        } else {
          setErrorMsg("Please select consecutive time slots.");
          return prev;
        }
      }
    });
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size must be less than 5MB.");
      return;
    }
    try {
      setUploadingProof(true);
      setErrorMsg("");
      const url = await storageService.uploadPaymentProof('pre-booking-' + Date.now(), file);
      setProofUrl(url);
      setProofFileName(file.name);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Failed to upload payment proof.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!user) {
      setErrorMsg("Please log in to complete your booking.");
      return;
    }
    if (!turf) {
      setErrorMsg("Turf information is missing.");
      return;
    }
    if (selectedTimes.length === 0) {
      setErrorMsg("No time slots selected.");
      return;
    }
    if (selectedTier === 'TENTATIVE' && anySelectedSlotIsTentative) {
      setErrorMsg("One or more selected slots are already held tentatively by another team. To secure this slot, you must pay a deposit or pay in full.");
      return;
    }
    if (selectedTier !== 'TENTATIVE' && (paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && !proofUrl && !transactionRef) {
      setErrorMsg("Please upload proof of payment or enter your transaction reference before continuing.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const sortedTimes = [...selectedTimes].sort((a, b) => timesList.indexOf(a) - timesList.indexOf(b));
      const startTime = sortedTimes[0];
      const totalPrice = basePitchTotal;
      const bookingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const bookingData: Booking = {
        id: bookingId,
        pitchId: turf.id,
        turfId: turf.id,
        turfName: turf.name || realPitch?.name || "Sports Ground",
        pitchName: turf.name || realPitch?.name || "Sports Ground",
        image: turf.image || (turf.images && turf.images[0]) || "",
        location: turf.location || (turf as any).fullAddress || "Kampala, Uganda",
        bookingRef: `FTL-${bookingId.substring(0, 6).toUpperCase()}`,
        pitchFormat: turf.pitchFormats?.[0] || turf.type || "7-a-side AstroTurf",
        managerName: (turf as any).managerName || "",
        contactPhone: turf.contactPhone || "",
        playerId: user.uid,
        userId: user.uid,
        userName: userProfile?.name || user.displayName || user.email?.split("@")[0] || "Player",
        playerEmail: user.email || "",
        playerPhone: (userProfile as any)?.phone || (user as any)?.phoneNumber || "",
        ownerId: turf.ownerId || realPitch?.ownerId || "",
        date: selectedDate,
        time: startTime,
        slots: sortedTimes,
        duration: sortedTimes.length,
        price: totalPrice,
        totalPrice: totalPrice,
        bookingTier: selectedTier,
        depositAmount: selectedTier === 'DEPOSIT' ? depositAmount : 0,
        balanceDue: selectedTier === 'DEPOSIT' ? balanceDue : (selectedTier === 'TENTATIVE' ? totalPrice : 0),
        status: selectedTier === 'TENTATIVE'
          ? BookingStatus.TENTATIVE
          : (paymentMethod === PaymentMethod.CASH ? BookingStatus.PENDING : BookingStatus.PAYMENT_SUBMITTED),
        paymentMethod: paymentMethod,
        paymentStatus: selectedTier === 'TENTATIVE'
          ? "UNPAID"
          : (selectedTier === 'DEPOSIT' ? "PARTIAL" : (paymentMethod === PaymentMethod.CASH ? "UNPAID" : "SUBMITTED")),
        paymentProofUrl: proofUrl || "",
        virtualReceiptUrl: proofUrl || "",
        transactionRef: transactionRef || "",
        paymentSubmittedAt: selectedTier !== 'TENTATIVE' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await bookingService.create(bookingData);
      
      if (proposalId) {
        try {
          await matchInvitationService.markAsBooked(proposalId, bookingId);
        } catch (proposalErr) {
          console.warn("Failed to mark match invitation as booked:", proposalErr);
        }
      }

      navigate(`/booking-confirmation/${bookingId}`, { replace: true });
    } catch (err: any) {
      console.error("Booking failed:", err);
      const message = err?.message || "Failed to create booking.";
      setErrorMsg(message);
      if (typeof message === "string" && message.includes("no longer available")) {
        setSelectedTimes([]);
        setBookingStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (bookingStep > 1 && bookingStep < 4) {
      const prevStep = (bookingStep - 1) as 1 | 2 | 3;
      if (prevStep === 1) {
        setHoldExpiresAt(null);
      }
      setStepDirection(-1);
      setBookingStep(prevStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 1: navigate back safely to turf detail
    navigate(id ? `/turf/${id}` : "/home");
  };

  const handleNextStep = (nextStep: 1 | 2 | 3 | 4) => {
    if (nextStep >= 2 && !holdExpiresAt) {
      const expires = Date.now() + 15 * 60 * 1000;
      setHoldExpiresAt(expires);
      setHoldSecondsRemaining(15 * 60);
    } else if (nextStep === 1) {
      setHoldExpiresAt(null);
    }
    setStepDirection(1);
    setBookingStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepIndicatorClick = (step: BookingStep) => {
    if (step < bookingStep) {
      if (step === 1) {
        setHoldExpiresAt(null);
      }
      setStepDirection(-1);
      setBookingStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loadingPitch) {
    return (
      <Layout>
        <div className="flex flex-col h-[calc(100vh-80px)] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-lime" />
        </div>
      </Layout>
    );
  }

  if (!turf) {
    return (
      <Layout>
        <div className="flex flex-col min-h-[60vh] items-center justify-center p-4 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Pitch not found or no longer available</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-sm">
            This pitch could not be found or is not currently active.
          </p>
          <button
            onClick={() => navigate("/home", { replace: true })}
            className="px-6 py-2.5 rounded-xl bg-primary-lime text-accent-text font-bold text-sm cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
        className="w-full max-w-2xl mx-auto p-4 mb-24"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </motion.button>
          <div className="text-center">
            <h1 id="heading-book-pitch" className="text-text-primary font-bold tracking-tight scroll-mt-24">Book Pitch</h1>
            <p className="text-text-secondary text-[11px] uppercase tracking-wider">{turf.name}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            title="Return to Home"
            aria-label="Return to Home"
          >
            <Home size={18} />
          </motion.button>
        </div>

        {/* Multi-step progress indicator */}
        {bookingStep < 4 && (
          <BookingProgressIndicator
            currentStep={bookingStep as BookingStep}
            onStepClick={handleStepIndicatorClick}
          />
        )}

        {/* 15-Minute Payment Window Banner */}
        {bookingStep >= 2 && bookingStep < 4 && (
          <div className="mb-6 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[#FACC15] shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock size={18} className="animate-pulse text-[#FACC15] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">15-Minute Payment Window</p>
                <p className="text-[11px] text-text-secondary truncate">
                  Slots release automatically if payment is not completed within 15 minutes.
                </p>
              </div>
            </div>
            <div className="bg-[#FACC15]/20 text-[#FACC15] px-2.5 py-1 rounded-lg border border-[#FACC15]/30 font-mono font-black text-xs tracking-wider shrink-0">
              {Math.floor(holdSecondsRemaining / 60)}:{String(holdSecondsRemaining % 60).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Error message display */}
        {errorMsg && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* CONTENT WITH ANIMATED STEPS */}
        <AnimatePresence mode="wait" custom={stepDirection}>
          {bookingStep === 1 && (
            <motion.div
              key="step-1"
              custom={stepDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              id="walkthrough-slot-picker"
              className="space-y-6 scroll-mt-24"
            >
              <div>
                <h2 id="heading-select-date" className="text-[14px] font-bold text-text-primary px-1 font-sans mb-3 scroll-mt-24">Select Date</h2>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                  {calendarDays.map((d) => {
                    const isSelected = selectedDate === d.fullDateStr;
                    return (
                      <motion.button
                        key={d.fullDateStr}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => { setSelectedDate(d.fullDateStr); setSelectedTimes([]); }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[64px] h-[76px] shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-primary-lime text-accent-text font-bold border border-primary-lime shadow-md shadow-primary-lime/20"
                            : "bg-surface-card border border-border-subtle text-text-primary hover:border-[#383838] hover:bg-surface-raised"
                        }`}
                      >
                        <div className="w-full flex justify-center text-[11px] mb-0.5">
                          <span className={isSelected ? "font-bold text-accent-text" : "font-medium text-text-secondary"}>
                            {d.dayName}
                          </span>
                        </div>
                        <div className="w-full flex justify-center text-[22px] font-black leading-none mb-0.5">
                          {d.dayNum}
                        </div>
                        <div className="w-full flex justify-center text-[9px] uppercase tracking-wider font-bold">
                          <span className={isSelected ? "text-accent-text/70" : "text-text-secondary"}>
                            {d.monthStr}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Matchday Weather Forecast Widget */}
              <MatchWeatherWidget
                selectedDate={selectedDate}
                selectedTime={selectedTimes.length > 0 ? selectedTimes[0] : null}
                endTime={
                  selectedTimes.length > 0
                    ? `${String(parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1).padStart(2, '0')}:00`
                    : null
                }
                pitchName={turf.name}
                latitude={turf.latitude}
                longitude={turf.longitude}
              />

              <div>
                <h2 id="heading-select-times" className="text-[14px] font-bold text-text-primary px-1 font-sans mb-3 scroll-mt-24">Select Times</h2>
                {loadingBookings ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-lime" /></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timesList.map((time) => {
                      const status = getSlotStatus(time);
                      const isSelected = selectedTimes.includes(time);
                      const isPassed = isSlotPassed(time, selectedDate);
                      const isBooked = status === 'booked' || status === 'blocked';
                      const isHeld = status === 'held';
                      const isTentative = status === 'tentative';
                      const isDisabled = hasError || isBooked || isHeld || isPassed;
                      const endHourNum = parseInt(time.split(':')[0]) + 1;
                      const endHour = `${String(endHourNum).padStart(2, '0')}:00`;
                      
                      return (
                        <motion.button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                          whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          onClick={() => handleSlotClick(time)}
                          className={`w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all text-center gap-1 border cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? "bg-primary-lime border-primary-lime text-accent-text shadow-[0_0_15px_rgba(168,255,0,0.2)]"
                              : isDisabled
                                ? "bg-surface-raised/50 border-transparent text-text-disabled cursor-not-allowed"
                                : isTentative
                                  ? "bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 shadow-xs"
                                  : "bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised"
                          }`}
                        >
                          <span className="text-[15px] font-extrabold tracking-tight">
                            {time} - {endHour}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            isSelected 
                              ? "text-accent-text/70" 
                              : isTentative
                                ? "text-amber-400 font-black flex items-center gap-0.5"
                                : "text-text-secondary"
                          }`}>
                            {isBooked ? "Reserved" : isPassed ? "Passed" : isHeld ? "In Cart" : isTentative ? "⚡ Tentative (Claim)" : `UGX ${(turf.pricePerHour / 1000).toFixed(0)}k`}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {anySelectedSlotIsTentative && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-amber-300 text-xs mt-3.5 animate-fadeIn">
                    <Zap size={16} className="shrink-0 text-amber-400 animate-pulse" />
                    <p className="leading-relaxed">
                      <strong>Tentative Slot Selected:</strong> This slot is held provisionally without upfront payment. You can claim and secure it immediately with a deposit or full payment!
                    </p>
                  </div>
                )}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
                <motion.button
                  type="button"
                  whileHover={selectedTimes.length > 0 ? { scale: 1.01, boxShadow: "0 0 25px rgba(168,255,0,0.3)" } : undefined}
                  whileTap={selectedTimes.length > 0 ? { scale: 0.98 } : undefined}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  disabled={selectedTimes.length === 0}
                  onClick={() => handleNextStep(2)}
                  className="w-full h-14 bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-primary-lime text-accent-text rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none font-bold tracking-wide active:scale-[0.98] cursor-pointer"
                >
                  Continue ({selectedTimes.length} slots)
                </motion.button>
              </div>
            </motion.div>
          )}

          {bookingStep === 2 && (
            <motion.div
              key="step-2"
              custom={stepDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {/* Booking Summary Card */}
              <div id="booking-summary-card" className="bg-surface-card rounded-[20px] p-5 border border-border-subtle scroll-mt-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="heading-booking-summary" className="text-text-primary font-bold scroll-mt-24">Booking Summary</h3>
                  <span className="text-primary-lime text-xs font-bold uppercase tracking-wider">{turf.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-text-primary shrink-0">
                    <Clock size={20} className="text-primary-lime" />
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-0.5">
                      {formatBookingDate(selectedDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-text-primary font-bold text-[15px]">
                      {selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00 ({selectedTimes.length} hr)
                    </div>
                  </div>
                </div>

                {/* Expected Match Weather in Summary */}
                <div className="mt-4 pt-3.5 border-t border-border-subtle">
                  <MatchWeatherWidget
                    selectedDate={selectedDate}
                    selectedTime={selectedTimes[0]}
                    endTime={`${String(parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1).padStart(2, '0')}:00`}
                    pitchName={turf.name}
                    latitude={turf.latitude}
                    longitude={turf.longitude}
                    compact={true}
                  />
                </div>
              </div>

              {/* Booking Position & Slot Security Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-text-primary font-bold text-sm">Choose Booking Position</h3>
                  <span className="text-[11px] text-text-secondary">Select how you want to secure this slot</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Instant Full Payment */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTier('FULL')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedTier === 'FULL'
                        ? 'bg-primary-lime/10 border-primary-lime shadow-md shadow-primary-lime/10'
                        : 'bg-surface-card border-border-subtle hover:border-[#383838] hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          selectedTier === 'FULL' ? 'bg-primary-lime text-accent-text' : 'bg-surface-raised text-text-secondary'
                        }`}>
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-text-primary">Full Payment (Instant Lock)</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                              100% Guaranteed
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Fully secure your slot right away with zero balance due at the pitch.
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-primary-lime block">
                          UGX {(basePitchTotal + 5000).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-text-tertiary">Due now</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Option 2: Instant Deposit Payment */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTier('DEPOSIT')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedTier === 'DEPOSIT'
                        ? 'bg-primary-lime/10 border-primary-lime shadow-md shadow-primary-lime/10'
                        : 'bg-surface-card border-border-subtle hover:border-[#383838] hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          selectedTier === 'DEPOSIT' ? 'bg-primary-lime text-accent-text' : 'bg-surface-raised text-text-secondary'
                        }`}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-text-primary">Deposit Payment ({depositPercentage}%)</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
                              Guaranteed Lock
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Lock slot against any takeovers now. Pay remaining balance on arrival.
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-primary-lime block">
                          UGX {(depositAmount + 5000).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-text-tertiary">Bal: UGX {balanceDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Payment Breakdown Card */}
              <div id="payment-summary-card" className="bg-surface-card rounded-[20px] p-5 border border-border-subtle scroll-mt-24">
                <h3 id="heading-payment-summary" className="text-text-primary font-bold mb-4 scroll-mt-24">Payment Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Pitch Hire ({selectedTimes.length} hr)</span>
                    <span className="text-text-primary font-medium">UGX {basePitchTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Booking & Lights Fee</span>
                    <span className="text-text-primary font-medium">
                      {selectedTier === 'TENTATIVE' ? 'UGX 0 (on arrival)' : 'UGX 5,000'}
                    </span>
                  </div>
                  {selectedTier === 'DEPOSIT' && (
                    <div className="flex justify-between items-center text-sm text-text-secondary border-t border-border-subtle/60 pt-2">
                      <span>Remaining Balance on Matchday</span>
                      <span className="text-text-primary font-semibold">UGX {balanceDue.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedTier === 'TENTATIVE' && (
                    <div className="flex justify-between items-center text-sm text-amber-300 border-t border-border-subtle/60 pt-2">
                      <span>Total Due on Matchday</span>
                      <span className="text-amber-300 font-semibold">UGX {basePitchTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                  <div>
                    <span className="text-text-primary font-bold block text-sm">
                      {selectedTier === 'TENTATIVE' ? 'Due Right Now' : (selectedTier === 'DEPOSIT' ? 'Deposit Payable Now' : 'Total Payable Now')}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {selectedTier === 'TENTATIVE' ? 'Zero upfront fee' : 'Secures instant reservation'}
                    </span>
                  </div>
                  <span className={`font-black text-xl font-display ${selectedTier === 'TENTATIVE' ? 'text-amber-400' : 'text-primary-lime'}`}>
                    UGX {selectedTier === 'TENTATIVE' ? '0' : (selectedTier === 'DEPOSIT' ? (depositAmount + 5000).toLocaleString() : (basePitchTotal + 5000).toLocaleString())}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01, boxShadow: "0 0 25px rgba(168,255,0,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => handleNextStep(3)}
                  className={`w-full h-14 rounded-xl flex items-center justify-center transition-all font-bold tracking-wide active:scale-[0.98] cursor-pointer ${
                    selectedTier === 'TENTATIVE'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-primary-lime hover:bg-[#96E600] text-accent-text shadow-[0_0_20px_rgba(168,255,0,0.2)]'
                  }`}
                >
                  {selectedTier === 'TENTATIVE'
                    ? 'Review Tentative Hold'
                    : (selectedTier === 'DEPOSIT' ? `Proceed with Deposit (UGX ${(depositAmount + 5000).toLocaleString()})` : 'Proceed to Full Payment')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {bookingStep === 3 && (
            <motion.div
              key="step-3"
              custom={stepDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              {selectedTier === 'TENTATIVE' ? (
                /* TENTATIVE HOLD CONFIRMATION VIEW */
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-[20px] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Clock size={22} className="text-amber-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-text-primary font-bold text-base">Tentative Match Reservation</h3>
                        <p className="text-xs text-amber-300 font-medium">Preemptible hold without upfront payment</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-amber-500/20 text-xs text-text-secondary leading-relaxed">
                      <div className="flex items-start gap-2 text-text-primary">
                        <Check size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Zero Payment Today:</strong> Your squad holds this slot provisionally for {selectedTimes.length} hr ({selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00).</span>
                      </div>
                      <div className="flex items-start gap-2 text-amber-200">
                        <Zap size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Preemption Term:</strong> If another team books this time and pays the deposit or full amount, this slot will be immediately reallocated to them.</span>
                      </div>
                      <div className="flex items-start gap-2 text-text-primary">
                        <ShieldCheck size={15} className="text-primary-lime shrink-0 mt-0.5" />
                        <span><strong>Lock In Anytime:</strong> You can secure this slot permanently at any time by paying the deposit from your <em>My Bookings</em> tab.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-[20px] p-5 border border-border-subtle space-y-3">
                    <h4 className="text-text-primary font-bold text-sm">Reservation Details</h4>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Pitch</span>
                      <span className="text-text-primary font-bold">{turf.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Date & Time</span>
                      <span className="text-text-primary font-bold">{formatBookingDate(selectedDate)} at {selectedTimes[0]}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Matchday Balance Due</span>
                      <span className="text-amber-400 font-bold">UGX {basePitchTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs">
                      <span className="text-text-primary font-bold">Due Right Now</span>
                      <span className="text-primary-lime font-black text-base">UGX 0</span>
                    </div>
                  </div>

                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
                    <motion.button
                      type="button"
                      whileHover={!isSubmitting ? { scale: 1.01, boxShadow: "0 0 25px rgba(245,158,11,0.3)" } : undefined}
                      whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      disabled={isSubmitting}
                      onClick={handleBookingSubmit}
                      className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] tracking-wide active:scale-[0.98] cursor-pointer"
                    >
                      {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Reserving Tentatively...</> : 'Confirm Tentative Reservation'}
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* GUARANTEED INSTANT (FULL OR DEPOSIT) PAYMENT VIEW */
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-text-primary font-bold">Select Payment Method</h3>
                    <span className="text-[11px] font-bold text-primary-lime">
                      {selectedTier === 'DEPOSIT' ? `Deposit (${depositPercentage}%)` : 'Full Payment'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => setPaymentMethod(PaymentMethod.MTN)}
                      className={`flex flex-col items-center justify-center p-3 rounded-[16px] gap-2 transition-all border cursor-pointer ${paymentMethod === PaymentMethod.MTN ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FFCC00] flex items-center justify-center text-black font-black text-[10px]">MTN</div>
                      <span className="text-xs font-bold uppercase tracking-wider">MoMo</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => setPaymentMethod(PaymentMethod.AIRTEL)}
                      className={`flex flex-col items-center justify-center p-3 rounded-[16px] gap-2 transition-all border cursor-pointer ${paymentMethod === PaymentMethod.AIRTEL ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white font-black text-[10px]">AIR</div>
                      <span className="text-xs font-bold uppercase tracking-wider">Money</span>
                    </motion.button>
                  </div>

                  {(paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && (
                    <div className="bg-surface-card rounded-[20px] p-5 border border-border-subtle space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-text-primary font-bold text-sm">
                          {selectedTier === 'DEPOSIT' ? 'Deposit Payment Instructions' : 'Full Payment Instructions'}
                        </h4>
                        <p className="text-text-secondary text-xs leading-relaxed">
                          1. Dial <strong className="text-text-primary">{paymentMethod === PaymentMethod.MTN ? '*165#' : '*185#'}</strong><br/>
                          2. Send UGX <strong className="text-primary-lime font-black">
                            {(selectedTier === 'DEPOSIT' ? depositAmount + 5000 : basePitchTotal + 5000).toLocaleString()}
                          </strong> to <strong className="text-text-primary">{(turf as any).paymentPhone || turf.contactPhone || "0772 123 456"}</strong> ({turf.name})<br/>
                          3. Enter transaction reference or screenshot the confirmation SMS
                        </p>
                      </div>

                      {/* Transaction Reference Input */}
                      <div className="pt-2 border-t border-border-subtle">
                        <label className="text-xs font-bold text-text-primary block mb-1.5">
                          Mobile Money Transaction Reference (Optional if screenshot uploaded)
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="e.g. 248910284 or MTN-TXN-..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary placeholder:text-text-disabled text-xs font-mono focus:outline-hidden focus:border-primary-lime transition-all"
                        />
                      </div>

                      {/* Virtual Receipt Upload */}
                      <div className="pt-2 border-t border-border-subtle">
                        <h4 className="text-text-primary font-bold text-sm mb-1.5">Upload Virtual Receipt / Payment Screenshot</h4>
                        <p className="text-[11px] text-text-secondary mb-3">
                          Upload screenshot of the confirmation SMS or payment receipt to guarantee instant slot verification.
                        </p>
                        <label className="block">
                          <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} disabled={uploadingProof} />
                          <div className="w-full h-28 rounded-xl border-2 border-dashed border-border-prominent hover:border-primary-lime hover:bg-primary-lime/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden group">
                            {uploadingProof ? (
                              <div className="flex flex-col items-center gap-2 text-primary-lime">
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-wider">Uploading receipt...</span>
                              </div>
                            ) : proofUrl ? (
                              <div className="flex flex-col items-center gap-1.5 text-primary-lime bg-primary-lime/10 w-full h-full justify-center p-2">
                                <CheckCircle2 size={26} />
                                <span className="text-xs font-bold truncate max-w-[85%] px-4">{proofFileName || "Receipt Uploaded"}</span>
                                <span className="text-[10px] text-text-secondary underline">Click to change screenshot</span>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary group-hover:text-primary-lime group-hover:bg-primary-lime/20 transition-all">
                                  <UploadCloud size={20} />
                                </div>
                                <span className="text-text-secondary text-[11px] font-bold group-hover:text-text-primary transition-colors">
                                  Select receipt screenshot (JPG, PNG)
                                </span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
                    <motion.button
                      type="button"
                      whileHover={!isSubmitting && (proofUrl || transactionRef) ? { scale: 1.01, boxShadow: "0 0 25px rgba(168,255,0,0.3)" } : undefined}
                      whileTap={!isSubmitting && (proofUrl || transactionRef) ? { scale: 0.98 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      disabled={isSubmitting || (!proofUrl && !transactionRef)}
                      onClick={handleBookingSubmit}
                      className="w-full h-14 bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-primary-lime text-accent-text rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none font-bold tracking-wide active:scale-[0.98] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={18} className="animate-spin mr-2" /> Securing Pitch...</>
                      ) : selectedTier === 'DEPOSIT' ? (
                        'Confirm Deposit & Secure Slot'
                      ) : (
                        'Confirm Full Payment & Secure Slot'
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </Layout>
  );
};
