import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle2, Clock, UploadCloud, FileImage, CreditCard, ShieldCheck, Check, Wallet 
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { pitchService } from "../services/pitchService";
import { SlotAvailability, Booking } from "../types/firebase";
import { Turf, BookingStatus, PaymentMethod } from "../types";
import { TURFS } from "../constants";
import { bookingService } from "../services/bookingService";
import { storageService } from "../services/storageService";
import { matchInvitationService } from "../services/matchInvitationService";
import { Layout } from "../components/Layout";
import { Loader2 } from "lucide-react";
import { MatchWeatherWidget } from "../components/weather/MatchWeatherWidget";
import { formatBookingDate } from "../lib/dateUtils";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MTN);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const normalizedId = id?.replace(/^pitch-/, "") || "";

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
  } : (
    TURFS.find((t) => t.id === id || t.id === normalizedId || `pitch-${t.id}` === id) || null
  );

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

  useEffect(() => {
    if (!id || !selectedDate) return;
    setLoadingBookings(true);
    setHasError(false);

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

  const getSlotStatus = (time: string) => {
    if (hasError) return 'unavailable';
    const now = Date.now();
    const slot = slotAvailabilityList.find(s => s.time === time);
    if (!slot) return 'available';
    if (slot.status === 'blocked') return 'blocked';
    if (slot.status === 'booked') return 'booked';
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
    if (hasError) {
      alert("Couldn't load current availability — please refresh before booking.");
      return;
    }
    if (isSlotPassed(time, selectedDate)) {
      alert("This time slot has already passed. Please select a future time slot.");
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
          alert("Your selection must be consecutive. Deselecting this would leave a gap.");
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
          alert("Please select consecutive time slots.");
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
    if ((paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && !proofUrl) {
      setErrorMsg("Please upload proof of payment before continuing.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const sortedTimes = [...selectedTimes].sort((a, b) => timesList.indexOf(a) - timesList.indexOf(b));
      const startTime = sortedTimes[0];
      const totalPrice = turf.pricePerHour * sortedTimes.length;
      const bookingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const bookingData: Booking = {
        id: bookingId,
        pitchId: turf.id,
        turfId: turf.id,
        turfName: turf.name || realPitch?.name || "Sports Ground",
        pitchName: turf.name || realPitch?.name || "Sports Ground",
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
        status: paymentMethod === PaymentMethod.CASH ? BookingStatus.PENDING : BookingStatus.PAYMENT_SUBMITTED,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === PaymentMethod.CASH ? "UNPAID" : "SUBMITTED",
        paymentProofUrl: proofUrl || "",
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

      navigate(`/booking-confirmation/${bookingId}`);
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
          <h2 className="text-xl font-bold text-text-primary mb-2">Pitch Not Available</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-sm">
            This pitch schedule could not be loaded or is currently inactive.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-2.5 rounded-xl bg-primary-lime text-accent-text font-bold text-sm"
          >
            Return to Explore
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto p-4 mb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => {
              if (bookingStep > 1 && bookingStep < 4) setBookingStep(bookingStep - 1 as any);
              else navigate(`/turf/${id}`);
            }}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <div className="text-center">
            <h1 className="text-text-primary font-bold tracking-tight">Book Pitch</h1>
            <p className="text-text-secondary text-[11px] uppercase tracking-wider">{turf.name}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Step Indicator */}
        {bookingStep < 4 && (
          <div className="flex items-center justify-between relative max-w-[300px] mx-auto mb-8">
            <div className="flex flex-col items-center gap-2 relative z-10 w-12">
              <div className="w-8 h-8 rounded-full bg-primary-lime flex items-center justify-center text-accent-text">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-[10px] text-text-primary uppercase tracking-wider font-bold">Slot</span>
            </div>
            <div className={`flex-1 h-0.5 mx-[-10px] ${bookingStep >= 2 ? 'bg-primary-lime' : 'bg-border-subtle'}`} />
            <div className="flex flex-col items-center gap-2 relative z-10 w-12">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bookingStep >= 2 ? 'bg-primary-lime text-accent-text' : 'bg-surface-raised text-text-secondary'}`}>
                {bookingStep > 2 ? <CheckCircle2 size={16} /> : "2"}
              </div>
              <span className={`text-[10px] ${bookingStep >= 2 ? 'text-text-primary' : 'text-text-secondary'} uppercase tracking-wider font-bold`}>Details</span>
            </div>
            <div className={`flex-1 h-0.5 mx-[-10px] ${bookingStep >= 3 ? 'bg-primary-lime' : 'bg-border-subtle'}`} />
            <div className="flex flex-col items-center gap-2 relative z-10 w-12">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bookingStep >= 3 ? 'bg-primary-lime text-accent-text' : 'bg-surface-raised text-text-secondary'}`}>
                {bookingStep > 3 ? <CheckCircle2 size={16} /> : "3"}
              </div>
              <span className={`text-[10px] ${bookingStep >= 3 ? 'text-text-primary' : 'text-text-secondary'} uppercase tracking-wider font-bold`}>Payment</span>
            </div>
          </div>
        )}

        {/* Error message display */}
        {errorMsg && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* CONTENT */}
        {bookingStep === 1 && (
          <div id="walkthrough-slot-picker" className="space-y-6 scroll-mt-24">
            <div>
              <h2 className="text-[14px] font-bold text-text-primary px-1 font-sans mb-3">Select Date</h2>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                {calendarDays.map((d) => {
                  const isSelected = selectedDate === d.fullDateStr;
                  return (
                    <button
                      key={d.fullDateStr}
                      type="button"
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
                    </button>
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
              <h2 className="text-[14px] font-bold text-text-primary px-1 font-sans mb-3">Select Times</h2>
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
                    const isDisabled = hasError || isBooked || isHeld || isPassed;
                    const endHourNum = parseInt(time.split(':')[0]) + 1;
                    const endHour = `${String(endHourNum).padStart(2, '0')}:00`;
                    
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSlotClick(time)}
                        className={`w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all text-center gap-1 border cursor-pointer ${
                          isSelected
                            ? "bg-primary-lime border-primary-lime text-accent-text shadow-[0_0_15px_rgba(168,255,0,0.2)]"
                            : isDisabled
                              ? "bg-surface-raised/50 border-transparent text-text-disabled cursor-not-allowed"
                              : "bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised"
                        }`}
                      >
                        <span className="text-[15px] font-extrabold tracking-tight">
                          {time} - {endHour}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          isSelected ? "text-accent-text/70" : "text-text-secondary"
                        }`}>
                          {isBooked ? "Reserved" : isPassed ? "Passed" : isHeld ? "In Cart" : `UGX ${(turf.pricePerHour / 1000).toFixed(0)}k`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
              <button
                type="button"
                disabled={selectedTimes.length === 0}
                onClick={() => setBookingStep(2)}
                className="w-full h-14 bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-primary-lime text-accent-text rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none font-bold tracking-wide active:scale-[0.98] cursor-pointer"
              >
                Continue ({selectedTimes.length} slots)
              </button>
            </div>
          </div>
        )}

        {bookingStep === 2 && (
          <div className="space-y-4">
            <div className="bg-surface-card rounded-[20px] p-5 border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-text-primary font-bold">Booking Summary</h3>
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
                    {selectedTimes[0]} - {parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1}:00
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

            <div className="bg-surface-card rounded-[20px] p-5 border border-border-subtle">
              <h3 className="text-text-primary font-bold mb-4">Payment Summary</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Pitch Hire ({selectedTimes.length} hr)</span>
                  <span className="text-text-primary font-medium">UGX {(turf.pricePerHour * selectedTimes.length).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Booking Fee</span>
                  <span className="text-text-primary font-medium">UGX 5,000</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                <span className="text-text-primary font-bold">Total Payable</span>
                <span className="text-primary-lime font-black text-lg">
                  UGX {(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setBookingStep(3)}
                className="w-full h-14 bg-primary-lime hover:bg-[#96E600] text-accent-text rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] font-bold tracking-wide active:scale-[0.98] cursor-pointer"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {bookingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-text-primary font-bold px-1">Select Payment Method</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setPaymentMethod(PaymentMethod.MTN)} className={`flex flex-col items-center justify-center p-3 rounded-[16px] gap-2 transition-all border cursor-pointer ${paymentMethod === PaymentMethod.MTN ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised'}`}>
                <div className="w-8 h-8 rounded-full bg-[#FFCC00] flex items-center justify-center text-black font-black text-[10px]">MTN</div>
                <span className="text-xs font-bold uppercase tracking-wider">MoMo</span>
              </button>
              <button onClick={() => setPaymentMethod(PaymentMethod.AIRTEL)} className={`flex flex-col items-center justify-center p-3 rounded-[16px] gap-2 transition-all border cursor-pointer ${paymentMethod === PaymentMethod.AIRTEL ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised'}`}>
                <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white font-black text-[10px]">AIR</div>
                <span className="text-xs font-bold uppercase tracking-wider">Money</span>
              </button>
              <button onClick={() => setPaymentMethod(PaymentMethod.CASH)} className={`flex flex-col items-center justify-center p-3 rounded-[16px] gap-2 transition-all border cursor-pointer ${paymentMethod === PaymentMethod.CASH ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-card border-border-subtle text-text-primary hover:bg-surface-raised'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentMethod === PaymentMethod.CASH ? 'bg-primary-lime text-accent-text' : 'bg-surface-raised text-text-primary'}`}><Wallet size={16} /></div>
                <span className="text-xs font-bold uppercase tracking-wider">Cash</span>
              </button>
            </div>

            {(paymentMethod === PaymentMethod.MTN || paymentMethod === PaymentMethod.AIRTEL) && (
              <div className="bg-surface-card rounded-[20px] p-5 border border-border-subtle space-y-4">
                <div className="space-y-1">
                  <h4 className="text-text-primary font-bold text-sm">Payment Instructions</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    1. Dial <strong className="text-text-primary">{paymentMethod === PaymentMethod.MTN ? '*165#' : '*185#'}</strong><br/>
                    2. Send UGX <strong className="text-text-primary">{(turf.pricePerHour * selectedTimes.length + 5000).toLocaleString()}</strong> to <strong className="text-primary-lime">0772 123 456</strong><br/>
                    3. Screenshot the final confirmation SMS
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle">
                  <h4 className="text-text-primary font-bold text-sm mb-3">Upload Transaction Screenshot</h4>
                  <label className="block">
                    <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} disabled={uploadingProof} />
                    <div className="w-full h-24 rounded-xl border-2 border-dashed border-border-prominent hover:border-primary-lime hover:bg-primary-lime/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden group">
                      {uploadingProof ? (
                        <div className="flex flex-col items-center gap-2 text-primary-lime">
                          <Loader2 size={24} className="animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
                        </div>
                      ) : proofUrl ? (
                        <div className="flex flex-col items-center gap-1 text-primary-lime bg-primary-lime/10 w-full h-full justify-center">
                          <CheckCircle2 size={24} />
                          <span className="text-xs font-bold truncate max-w-[80%] px-4">{proofFileName}</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary group-hover:text-primary-lime group-hover:bg-primary-lime/20 transition-all">
                            <UploadCloud size={20} />
                          </div>
                          <span className="text-text-secondary text-[10px] uppercase font-bold tracking-wider group-hover:text-text-primary transition-colors">Select image</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-base border-t border-border-subtle z-40 max-w-2xl mx-auto">
              <button
                type="button"
                disabled={isSubmitting || (paymentMethod !== PaymentMethod.CASH && !proofUrl)}
                onClick={handleBookingSubmit}
                className="w-full h-14 bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 disabled:hover:bg-primary-lime text-accent-text rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)] disabled:shadow-none font-bold tracking-wide active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Processing...</> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};
