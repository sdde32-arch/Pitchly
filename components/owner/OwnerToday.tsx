import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Hourglass,
  Image as ImageIcon,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Ticket,
  UserPlus,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUser } from "../../context/UserContext";
import { useInteractiveWalkthrough } from "../../context/InteractiveWalkthroughContext";
import { pitchService } from "../../services/pitchService";
import { bookingService } from "../../services/bookingService";
import { Booking, Pitch, SlotAvailability, SlotNote } from "../../types/firebase";
import { BookingStatus } from "../../types";
import { TipCard } from "../onboarding/TipCard";
import {
  buildOwnerConfirmUpdates,
  isBookingStale as checkBookingExpired,
} from "./BookingManager";

export type ClassifiedBooking =
  | { kind: "BOOKED"; booking: Booking }
  | { kind: "WAITING"; variant: "Payment sent" | "Not paid yet"; booking: Booking }
  | { kind: "PROBLEM"; booking: Booking }
  | { kind: "IGNORE" };

type SlotRowState =
  | {
      time: string;
      hour: number;
      kind: "BOOKED";
      booking: Booking;
    }
  | {
      time: string;
      hour: number;
      kind: "WAITING";
      variant: "Payment sent" | "Not paid yet";
      booking: Booking;
    }
  | {
      time: string;
      hour: number;
      kind: "PROBLEM";
      booking: Booking;
    }
  | {
      time: string;
      hour: number;
      kind: "BLOCKED";
      slot: SlotAvailability;
    }
  | {
      time: string;
      hour: number;
      kind: "HELD";
    }
  | {
      time: string;
      hour: number;
      kind: "BOOKED_UNAVAILABLE";
    }
  | {
      time: string;
      hour: number;
      kind: "FREE";
    };

export interface OwnerTodayProps {
  bookings: Booking[];
  loadingBookings: boolean;
  bookingsError?: boolean;
  onRetryBookings?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOffsetDateISO(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return formatLocalDateISO(d);
}

function formatReadableDate(dateStr: string): string {
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dateStr;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-UG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseSlotHour(raw: string | undefined | null): number | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const match12 = trimmed.match(/^(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const meridiem = match12[2].toLowerCase();
    if (h >= 1 && h <= 12) {
      if (meridiem === "pm" && h !== 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      return h;
    }
  }
  const match24 = trimmed.match(/^(\d{1,2})(?::\d{2})?/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    if (h >= 0 && h < 24) return h;
  }
  return null;
}

function formatHour12(hour24: number): string {
  const wrapped = ((hour24 % 24) + 24) % 24;
  const meridiem = wrapped >= 12 ? "PM" : "AM";
  const h12 = wrapped % 12 === 0 ? 12 : wrapped % 12;
  return `${h12}:00 ${meridiem}`;
}

function formatSlotRange12(hour24: number): string {
  return `${formatHour12(hour24)} – ${formatHour12(hour24 + 1)}`;
}

export function classifyBooking(booking: Booking): ClassifiedBooking {
  const status = String(booking.status || "").toUpperCase();

  if (status === BookingStatus.DISPUTED) {
    return { kind: "PROBLEM", booking };
  }

  if (
    status === BookingStatus.CANCELLED ||
    status === BookingStatus.REJECTED ||
    status === BookingStatus.PREEMPTED ||
    status === BookingStatus.NO_SHOW
  ) {
    return { kind: "IGNORE" };
  }

  if (
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.DEPOSIT_PAID ||
    status === BookingStatus.CHECKED_IN ||
    status === BookingStatus.COMPLETED
  ) {
    return { kind: "BOOKED", booking };
  }

  if (status === BookingStatus.PAYMENT_SUBMITTED) {
    if (checkBookingExpired(booking as any)) {
      return { kind: "IGNORE" };
    }
    return { kind: "WAITING", variant: "Payment sent", booking };
  }

  if (status === BookingStatus.TENTATIVE) {
    if (bookingService.isHoldExpired(booking) || checkBookingExpired(booking as any)) {
      return { kind: "IGNORE" };
    }
    return { kind: "WAITING", variant: "Not paid yet", booking };
  }

  if (status === BookingStatus.PENDING_PAYMENT || status === BookingStatus.PENDING) {
    if (checkBookingExpired(booking as any) || bookingService.isPendingBookingExpired(booking)) {
      return { kind: "IGNORE" };
    }
    const hasPaymentSent = Boolean(
      booking.paymentProofUrl ||
        booking.transactionRef ||
        booking.paymentStatus === "SUBMITTED"
    );
    return {
      kind: "WAITING",
      variant: hasPaymentSent ? "Payment sent" : "Not paid yet",
      booking,
    };
  }

  return { kind: "IGNORE" };
}

export function countWaitingOwnerBookings(bookings: Booking[]): number {
  const ids = new Set<string>();
  for (const b of bookings) {
    if (classifyBooking(b).kind === "WAITING") {
      ids.add(b.id);
    }
  }
  return ids.size;
}

function formatMoneyLine(
  booking: Booking,
  kind: "BOOKED" | "WAITING",
  waitingVariant?: "Payment sent" | "Not paid yet"
): string {
  const total = Number(booking.totalPrice || booking.price || 0);
  const deposit = Number(booking.depositAmount || 0);
  const hasExplicitBalance =
    booking.balanceDue !== undefined &&
    booking.balanceDue !== null &&
    !Number.isNaN(Number(booking.balanceDue));
  const balance = hasExplicitBalance
    ? Math.max(0, Number(booking.balanceDue))
    : Math.max(0, total - deposit);

  const status = String(booking.status || "").toUpperCase();
  const paymentStatus = String(booking.paymentStatus || "").toUpperCase();
  const tier = String(booking.bookingTier || "").toUpperCase();

  if (kind === "BOOKED") {
    if (status === BookingStatus.DEPOSIT_PAID || (paymentStatus === "PARTIAL" && deposit > 0)) {
      const paidText =
        deposit > 0 ? `Deposit paid: UGX ${deposit.toLocaleString()}` : "Deposit paid";
      return balance > 0
        ? `${paidText} · Balance at pitch: UGX ${balance.toLocaleString()}`
        : paidText;
    }
    if (paymentStatus === "UNPAID") {
      return balance > 0
        ? `Not paid yet · Pay at pitch: UGX ${balance.toLocaleString()}`
        : "Not paid yet";
    }
    if (total > 0) {
      return `Paid: UGX ${total.toLocaleString()}`;
    }
    return "Paid";
  }

  if (waitingVariant === "Payment sent") {
    if (tier === "DEPOSIT" && deposit > 0) {
      return `Deposit sent: UGX ${deposit.toLocaleString()}`;
    }
    if (total > 0) {
      return `Payment sent: UGX ${total.toLocaleString()}`;
    }
    return "Payment sent";
  }

  if (total > 0) {
    return `Not paid yet · Total: UGX ${total.toLocaleString()}`;
  }
  return "Not paid yet";
}

function getBookingHours(booking: Booking): number[] {
  const rawSlots =
    Array.isArray(booking.slots) && booking.slots.length > 0
      ? booking.slots
      : booking.time
      ? [booking.time]
      : [];
  const hours: number[] = [];
  for (const s of rawSlots) {
    const h = parseSlotHour(s);
    if (h !== null && !hours.includes(h)) {
      hours.push(h);
    }
  }
  return hours;
}

function formatBlockedReason(slot: SlotAvailability, slotNote?: SlotNote): {
  summary: string;
  phone: string;
} {
  const note = (slotNote?.blockNote || "").trim();
  const phone = (slotNote?.blockPhone || "").trim();
  const reasonTag = String(slotNote?.blockReason || slot.blockReason || "").toUpperCase();
  const legacyReason = String(slot.reason || "").trim();

  if (reasonTag === "WALK_IN" || legacyReason.toLowerCase() === "walk_in") {
    if (note && phone) {
      return {
        summary: `Booked by phone/walk-in: ${note}, ${phone}`,
        phone,
      };
    }
    if (note) {
      return {
        summary: `Booked by phone/walk-in: ${note}`,
        phone,
      };
    }
    return {
      summary: "Booked by phone/walk-in",
      phone,
    };
  }

  if (note) {
    return {
      summary: `Closed: ${note}`,
      phone: "",
    };
  }

  if (legacyReason && legacyReason.toLowerCase() !== "maintenance") {
    return {
      summary: `Closed: ${legacyReason}`,
      phone: "",
    };
  }

  return {
    summary: "Closed (maintenance)",
    phone: "",
  };
}

export const OwnerToday: React.FC<OwnerTodayProps> = ({
  bookings,
  loadingBookings,
  bookingsError = false,
  onRetryBookings,
  soundEnabled = true,
  onToggleSound,
}) => {
  const { user, userProfile, loading: authLoading } = useUser();
  const { openWalkthrough } = useInteractiveWalkthrough();
  const navigate = useNavigate();

  const ownerId = userProfile?.id || user?.uid || "";

  const yesterdayStr = getOffsetDateISO(-1);
  const todayStr = getOffsetDateISO(0);
  const tomorrowStr = getOffsetDateISO(1);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedPitchId, setSelectedPitchId] = useState<string>("");
  const [slotsAvailability, setSlotsAvailability] = useState<SlotAvailability[]>([]);
  const [slotNotesByKey, setSlotNotesByKey] = useState<Record<string, SlotNote>>({});

  const [loadingPitches, setLoadingPitches] = useState<boolean>(true);
  const [localError, setLocalError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofLoadFailed, setProofLoadFailed] = useState<boolean>(false);

  // Free slot -> walk-in / maintenance block sheet state
  const [blockTarget, setBlockTarget] = useState<{ time: string; hour: number } | null>(null);
  const [blockStep, setBlockStep] = useState<"choose" | "walk_in" | "maintenance">("choose");
  const [walkInName, setWalkInName] = useState<string>("");
  const [walkInPhone, setWalkInPhone] = useState<string>("");
  const [maintenanceNote, setMaintenanceNote] = useState<string>("");
  const [blockFormError, setBlockFormError] = useState<string>("");
  const [savingSlotAction, setSavingSlotAction] = useState<boolean>(false);

  // Blocked slot -> reopen confirmation sheet state
  const [unblockTarget, setUnblockTarget] = useState<{ time: string; hour: number } | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // Live listener 1: owner pitches (no one-shot fetches)
  useEffect(() => {
    if (authLoading) return;
    if (!ownerId) {
      setLoadingPitches(false);
      return;
    }

    setLoadingPitches(true);
    setLocalError(false);

    const unsubscribe = pitchService.subscribeByOwner(
      ownerId,
      (ownerPitches) => {
        setPitches(ownerPitches);
        setSelectedPitchId((prev) => {
          if (prev && ownerPitches.some((p) => p.id === prev)) return prev;
          return ownerPitches[0]?.id || "";
        });
        setLoadingPitches(false);
      },
      () => {
        setLocalError(true);
        setLoadingPitches(false);
      }
    );

    return () => unsubscribe();
  }, [ownerId, authLoading, retryKey]);

  const activePitch = useMemo(
    () => pitches.find((p) => p.id === selectedPitchId) || pitches[0] || null,
    [pitches, selectedPitchId]
  );

  // Live listener 2: slotAvailability for active pitch + selected date
  useEffect(() => {
    if (!activePitch?.id || !selectedDate) {
      setSlotsAvailability([]);
      return;
    }

    const unsubscribe = bookingService.subscribeSlotAvailability(
      activePitch.id,
      selectedDate,
      (availList) => {
        setSlotsAvailability(availList);
      },
      () => {
        setLocalError(true);
      }
    );

    return () => unsubscribe();
  }, [activePitch?.id, selectedDate, retryKey]);

  // Live listener 3: owner-private slotNotes for walk-in customer name/phone and maintenance notes
  useEffect(() => {
    if (!ownerId || !activePitch?.id || !selectedDate) {
      setSlotNotesByKey({});
      return;
    }

    const q = query(
      collection(db, "slotNotes"),
      where("ownerId", "==", ownerId),
      where("pitchId", "==", activePitch.id),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const nextMap: Record<string, SlotNote> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data() as SlotNote;
          nextMap[docSnap.id] = { ...data, id: data.id || docSnap.id };
        });
        setSlotNotesByKey(nextMap);
      },
      (err) => {
        console.warn("OwnerToday slotNotes listener error:", err);
        setSlotNotesByKey({});
      }
    );

    return () => unsubscribe();
  }, [ownerId, activePitch?.id, selectedDate, retryKey]);

  // Build rows sorted by hour:
  // bookings decide BOOKED / WAITING / PROBLEM;
  // when no visible booking exists for an hour, slotAvailability decides BLOCKED / HELD / BOOKED_UNAVAILABLE / FREE.
  const { slotRows, dayWaitingCount, firstWaitingHour, activeBookingCount, allSlotsFree } =
    useMemo(() => {
      if (!activePitch) {
        return {
          slotRows: [] as SlotRowState[],
          dayWaitingCount: 0,
          firstWaitingHour: null as number | null,
          activeBookingCount: 0,
          allSlotsFree: true,
        };
      }

      const openH = parseSlotHour(activePitch.openingHour) ?? 7;
      const rawCloseH = parseSlotHour(activePitch.closingHour) ?? 23;
      const closeH = rawCloseH > openH ? rawCloseH : 23;

      const hourSet = new Set<number>();
      for (let h = openH; h < closeH; h++) {
        hourSet.add(h);
      }

      const dayBookings = bookings.filter((b) => {
        const bPitchId = b.pitchId || b.turfId;
        return bPitchId === activePitch.id && b.date === selectedDate;
      });

      const hourToBooking = new Map<
        number,
        | { kind: "BOOKED"; booking: Booking }
        | { kind: "WAITING"; variant: "Payment sent" | "Not paid yet"; booking: Booking }
        | { kind: "PROBLEM"; booking: Booking }
      >();

      const activeBookingIds = new Set<string>();
      const waitingBookingIds = new Set<string>();

      for (const b of dayBookings) {
        const classified = classifyBooking(b);
        if (classified.kind === "IGNORE") continue;

        const hours = getBookingHours(b);
        if (hours.length === 0) continue;

        activeBookingIds.add(b.id);
        if (classified.kind === "WAITING") {
          waitingBookingIds.add(b.id);
        }

        for (const h of hours) {
          hourSet.add(h);
          const existing = hourToBooking.get(h);
          // Prefer WAITING over PROBLEM over BOOKED if multiple bookings share an hour
          if (
            !existing ||
            (existing.kind === "BOOKED" &&
              (classified.kind === "WAITING" || classified.kind === "PROBLEM")) ||
            (existing.kind === "PROBLEM" && classified.kind === "WAITING")
          ) {
            hourToBooking.set(h, classified);
          }
        }
      }

      const hourToAvailability = new Map<number, SlotAvailability>();
      for (const slot of slotsAvailability) {
        const h = parseSlotHour(slot.time);
        if (h !== null) {
          hourToAvailability.set(h, slot);
          if (slot.status && slot.status !== "open") {
            hourSet.add(h);
          }
        }
      }

      const sortedHours = Array.from(hourSet).sort((a, b) => a - b);
      let firstWait: number | null = null;
      let hasNonFreeRow = false;

      const rows: SlotRowState[] = sortedHours.map((hour) => {
        const time = `${String(hour).padStart(2, "0")}:00`;
        const bookingMatch = hourToBooking.get(hour);

        if (bookingMatch) {
          hasNonFreeRow = true;
          if (bookingMatch.kind === "WAITING") {
            if (firstWait === null) firstWait = hour;
            return {
              time,
              hour,
              kind: "WAITING",
              variant: bookingMatch.variant,
              booking: bookingMatch.booking,
            };
          }
          if (bookingMatch.kind === "PROBLEM") {
            return {
              time,
              hour,
              kind: "PROBLEM",
              booking: bookingMatch.booking,
            };
          }
          return {
            time,
            hour,
            kind: "BOOKED",
            booking: bookingMatch.booking,
          };
        }

        const slotDoc = hourToAvailability.get(hour);
        const slotStatus = String(slotDoc?.status || "").toLowerCase();

        if (slotDoc && slotStatus === "blocked") {
          hasNonFreeRow = true;
          return { time, hour, kind: "BLOCKED", slot: slotDoc };
        }

        if (slotDoc && slotStatus === "held") {
          hasNonFreeRow = true;
          return { time, hour, kind: "HELD" };
        }

        if (slotDoc && (slotStatus === "booked" || slotStatus === "tentative")) {
          hasNonFreeRow = true;
          return { time, hour, kind: "BOOKED_UNAVAILABLE" };
        }

        return { time, hour, kind: "FREE" };
      });

      return {
        slotRows: rows,
        dayWaitingCount: waitingBookingIds.size,
        firstWaitingHour: firstWait,
        activeBookingCount: activeBookingIds.size,
        allSlotsFree: !hasNonFreeRow,
      };
    }, [activePitch, bookings, slotsAvailability, selectedDate]);

  const handleConfirmBooking = async (booking: Booking) => {
    setProcessingId(booking.id);
    try {
      const isUnpaidHold = booking.status === BookingStatus.TENTATIVE;

      if (isUnpaidHold) {
        if (bookingService.isHoldExpired(booking) || checkBookingExpired(booking as any)) {
          setToast({
            type: "error",
            message: "This booking time limit has passed and the slot is already open.",
          });
          return;
        }
        await bookingService.confirmUnpaidReservation(booking);
      } else {
        if (bookingService.isPaymentCutoffPassed(booking)) {
          await bookingService.autoCancelUnconfirmedPayment(booking.id).catch(console.warn);
          setToast({
            type: "error",
            message: "The time to confirm this booking has passed.",
          });
          return;
        }
        if (checkBookingExpired(booking as any)) {
          setToast({
            type: "error",
            message: "This booking has expired and can no longer be confirmed.",
          });
          return;
        }
        const updates = buildOwnerConfirmUpdates(booking as any);
        await bookingService.update(booking.id, updates as any);

        const wasPendingOrSubmitted =
          booking.status === BookingStatus.PAYMENT_SUBMITTED ||
          booking.status === BookingStatus.PENDING_PAYMENT;
        if (
          wasPendingOrSubmitted &&
          (updates.status === BookingStatus.CONFIRMED ||
            updates.status === BookingStatus.DEPOSIT_PAID)
        ) {
          await bookingService.notifyPlayerOfOwnerDecision(booking, "APPROVED");
        }
      }

      setToast({
        type: "success",
        message: `Booking confirmed for ${booking.userName || (booking as any).playerName || "the player"}.`,
      });
    } catch (err) {
      console.error("OwnerToday confirm failed:", err);
      setToast({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineTarget) return;
    const booking = declineTarget;
    setProcessingId(booking.id);
    try {
      const reason = "Declined by owner";
      const isUnpaidHold = booking.status === BookingStatus.TENTATIVE;

      if (isUnpaidHold) {
        await bookingService.declineUnpaidReservation(booking, reason);
      } else {
        const nowIso = new Date().toISOString();
        await bookingService.update(booking.id, {
          status: BookingStatus.CANCELLED,
          rejectionReason: reason,
          reviewedAt: nowIso,
          updatedAt: nowIso,
        } as any);
        await bookingService.notifyPlayerOfOwnerDecision(booking, "CANCELLED");
      }

      setDeclineTarget(null);
      setToast({
        type: "success",
        message: "Booking cancelled. The player has been told.",
      });
    } catch (err) {
      console.error("OwnerToday decline failed:", err);
      setDeclineTarget(null);
      setToast({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openBlockSheet = (time: string, hour: number) => {
    setBlockTarget({ time, hour });
    setBlockStep("choose");
    setWalkInName("");
    setWalkInPhone("");
    setMaintenanceNote("");
    setBlockFormError("");
  };

  const closeBlockSheet = () => {
    if (savingSlotAction) return;
    setBlockTarget(null);
    setBlockStep("choose");
    setBlockFormError("");
  };

  const handleSaveWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePitch || !blockTarget) return;
    const trimmedName = walkInName.trim().slice(0, 120);
    const trimmedPhone = walkInPhone.trim().slice(0, 120);
    if (!trimmedName) {
      setBlockFormError("Please enter the customer's name.");
      return;
    }

    setBlockFormError("");
    setSavingSlotAction(true);
    try {
      await bookingService.toggleSlotBlock(
        activePitch.id,
        selectedDate,
        blockTarget.time,
        true,
        "walk_in",
        {
          blockReason: "WALK_IN",
          blockNote: trimmedName,
          blockPhone: trimmedPhone,
        }
      );
      setBlockTarget(null);
      setToast({
        type: "success",
        message: `Slot saved for ${trimmedName}.`,
      });
    } catch (err) {
      console.error("OwnerToday walk-in save failed:", err);
      setToast({
        type: "error",
        message: "Could not save this booking. Please try again.",
      });
    } finally {
      setSavingSlotAction(false);
    }
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePitch || !blockTarget) return;
    const trimmedNote = maintenanceNote.trim().slice(0, 120);

    setSavingSlotAction(true);
    try {
      await bookingService.toggleSlotBlock(
        activePitch.id,
        selectedDate,
        blockTarget.time,
        true,
        "maintenance",
        {
          blockReason: "MAINTENANCE",
          blockNote: trimmedNote,
          blockPhone: "",
        }
      );
      setBlockTarget(null);
      setToast({
        type: "success",
        message: "Slot closed. Players cannot book it now.",
      });
    } catch (err) {
      console.error("OwnerToday maintenance block failed:", err);
      setToast({
        type: "error",
        message: "Could not close this slot. Please try again.",
      });
    } finally {
      setSavingSlotAction(false);
    }
  };

  const handleConfirmReopenSlot = async () => {
    if (!activePitch || !unblockTarget) return;
    setSavingSlotAction(true);
    try {
      await bookingService.toggleSlotBlock(
        activePitch.id,
        selectedDate,
        unblockTarget.time,
        false
      );
      setUnblockTarget(null);
      setToast({
        type: "success",
        message: "Slot is open for players again.",
      });
    } catch (err) {
      console.error("OwnerToday unblock failed:", err);
      setUnblockTarget(null);
      setToast({
        type: "error",
        message: "Could not open this slot. Please try again.",
      });
    } finally {
      setSavingSlotAction(false);
    }
  };

  const handleJumpToFirstWaiting = () => {
    if (firstWaitingHour === null) return;
    const el = document.getElementById(`today-slot-${firstWaitingHour}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleRetry = () => {
    setLocalError(false);
    setLoadingPitches(true);
    setRetryKey((k) => k + 1);
    if (onRetryBookings) {
      onRetryBookings();
    }
  };

  const isYesterday = selectedDate === yesterdayStr;
  const isToday = selectedDate === todayStr;
  const isTomorrow = selectedDate === tomorrowStr;
  const isCustomDate = !isYesterday && !isToday && !isTomorrow;

  const loadError = localError || bookingsError;
  const isLoading = authLoading || loadingPitches || loadingBookings;

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-surface-card border border-border-subtle animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface-card border border-border-subtle p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-40 rounded bg-surface-raised" />
                <div className="h-7 w-24 rounded-lg bg-surface-raised" />
              </div>
              <div className="h-4 w-52 rounded bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State (never falls back to zero-pitch onboarding)
  if (loadError) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-text-primary">
              We could not load your bookings.
            </h2>
            <p className="text-base text-text-secondary">
              Please check your internet connection and tap Try again.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-base font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            <span>Try again</span>
          </button>
        </div>
      </div>
    );
  }

  // Zero Pitches State: Get your pitch live card
  if (pitches.length === 0) {
    const setupChecklist = [
      "Pitch name",
      "A contact phone number",
      "The pitch location pinned on the map",
      "Your hourly rate in UGX and deposit percentage (10% to 100%)",
      "The match formats you offer and your opening and closing hours",
      "A cover photo of your pitch",
      "Your Mobile Money number and the name it is registered under",
    ];

    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-subtle text-text-primary flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
                Get your pitch live
              </h2>
              <p className="text-base text-text-secondary">
                Have these ready, then add your pitch.
              </p>
            </div>
          </div>

          <ul className="space-y-2 rounded-xl bg-surface-raised border border-border-subtle p-4 text-sm text-text-primary">
            {setupChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="text-status-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-surface-raised border border-border-subtle p-4 space-y-1">
            <h3 className="text-sm font-extrabold text-text-primary">
              What happens next
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Pitchly reviews each pitch before players can book it. You will see Pending Review under Facilities, and you will get an in-app notification when it is approved, if changes are requested, or if it is not approved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/owner/add-pitch")}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-base font-extrabold inline-flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none cursor-pointer"
            >
              <Plus size={20} strokeWidth={2.5} />
              <span>Add your pitch</span>
            </button>
            <button
              type="button"
              onClick={() => openWalkthrough()}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:text-text-primary inline-flex items-center justify-center transition-colors motion-reduce:transition-none cursor-pointer"
            >
              How it works
            </button>
          </div>
        </div>
      </div>
    );
  }

  const normalizedPitchStatus = String(activePitch?.status || "").toLowerCase();
  const pitchStatusStripMessage =
    normalizedPitchStatus === "pending_approval" ||
    normalizedPitchStatus === "pending_review" ||
    normalizedPitchStatus === "pending_inspection"
      ? "Your pitch is in review. Players cannot book it until it is approved."
      : normalizedPitchStatus === "changes_requested"
      ? "Pitchly asked for changes to your pitch. Open Facilities to see what to fix."
      : normalizedPitchStatus === "rejected"
      ? "Your pitch was not approved. Open Facilities to see why."
      : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 font-sans">
      {/* Match-day Sound Notice & Toggle */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm sm:text-base font-semibold text-text-secondary flex-1 min-w-[200px]">
          Keep this app open on match days so you hear about new bookings.
        </p>
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-sm font-extrabold inline-flex items-center gap-2 shrink-0 transition-colors cursor-pointer active:scale-[0.98] ${
              soundEnabled
                ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#15803D] dark:text-[#4ADE80]"
                : "bg-surface-raised border-border-subtle text-text-secondary"
            }`}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{soundEnabled ? "Sound: On" : "Sound: Off"}</span>
          </button>
        )}
      </div>

      {/* One-time Owner Tip */}
      <TipCard audience="owner" tipId="owner-today" title="Your Today board">
        <p>
          Each hour shows its status: FREE (tap to add a walk-in or close the slot), BEING BOOKED (someone is booking this now), BOOKED (confirmed booking), BLOCKED (walk-in or closed slot), WAITING FOR YOUR OK (payment sent or unpaid hold—review it and confirm or decline), or PROBLEM (payment problem being checked).
        </p>
        <p className="mt-1.5">
          Keep this app open on match days. You only hear about new bookings while Pitchly is open.
        </p>
      </TipCard>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
            toast.type === "success"
              ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-text-primary"
              : "bg-[#EF4444]/15 border-[#EF4444]/40 text-text-primary"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {toast.type === "success" ? (
              <CheckCircle2 size={22} className="text-[#22C55E] shrink-0" />
            ) : (
              <AlertCircle size={22} className="text-[#EF4444] shrink-0" />
            )}
            <p className="text-base font-bold break-words">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close message"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary shrink-0 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Pitch Selector (only shown when owner has more than one pitch) */}
      {pitches.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-text-secondary">Choose pitch</p>
          <div className="flex flex-wrap gap-2">
            {pitches.map((pitch) => {
              const active = pitch.id === activePitch?.id;
              return (
                <button
                  key={pitch.id}
                  type="button"
                  onClick={() => setSelectedPitchId(pitch.id)}
                  className={`min-h-[48px] px-4 py-2.5 rounded-xl text-base font-bold border transition-colors cursor-pointer active:scale-[0.98] break-words text-left ${
                    active
                      ? "bg-primary-lime text-accent-text border-primary-lime"
                      : "bg-surface-card text-text-primary border-border-subtle hover:border-border-prominent"
                  }`}
                >
                  {pitch.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Pitch Status Strip (shown when active pitch is not live) */}
      {pitchStatusStripMessage && (
        <div
          role="status"
          className="rounded-2xl bg-amber-500/20 border border-amber-500/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertCircle size={20} className="text-text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm font-bold text-text-primary leading-relaxed">
              {pitchStatusStripMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/owner/pitches")}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-sm font-extrabold shrink-0 transition-colors motion-reduce:transition-none cursor-pointer"
          >
            Open Facilities
          </button>
        </div>
      )}

      {/* Date Strip: Yesterday · Today · Tomorrow · Pick a date */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`min-h-[48px] px-3 py-2.5 rounded-xl text-base font-bold border transition-colors cursor-pointer active:scale-[0.98] ${
              isYesterday
                ? "bg-primary-lime text-accent-text border-primary-lime"
                : "bg-surface-card text-text-primary border-border-subtle hover:border-border-prominent"
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`min-h-[48px] px-3 py-2.5 rounded-xl text-base font-bold border transition-colors cursor-pointer active:scale-[0.98] ${
              isToday
                ? "bg-primary-lime text-accent-text border-primary-lime"
                : "bg-surface-card text-text-primary border-border-subtle hover:border-border-prominent"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`min-h-[48px] px-3 py-2.5 rounded-xl text-base font-bold border transition-colors cursor-pointer active:scale-[0.98] ${
              isTomorrow
                ? "bg-primary-lime text-accent-text border-primary-lime"
                : "bg-surface-card text-text-primary border-border-subtle hover:border-border-prominent"
            }`}
          >
            Tomorrow
          </button>

          <label
            className={`relative min-h-[48px] px-3 py-2.5 rounded-xl text-base font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              isCustomDate
                ? "bg-primary-lime text-accent-text border-primary-lime"
                : "bg-surface-card text-text-primary border-border-subtle hover:border-border-prominent"
            }`}
          >
            <Calendar size={18} className="shrink-0" />
            <span className="truncate">Pick a date</span>
            <input
              ref={dateInputRef}
              type="date"
              aria-label="Pick a date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-base font-bold text-text-primary">
            {activePitch?.name}
          </p>
          <p className="text-sm font-semibold text-text-secondary">
            {formatReadableDate(selectedDate)}
          </p>
        </div>
      </div>

      {/* Waiting for OK Banner */}
      {dayWaitingCount > 0 && (
        <button
          type="button"
          onClick={handleJumpToFirstWaiting}
          className="w-full min-h-[52px] px-4 py-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 text-text-primary flex items-center justify-between gap-3 text-left transition-colors cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Clock size={22} className="text-amber-500 shrink-0" />
            <span className="text-base font-extrabold break-words">
              {dayWaitingCount === 1
                ? "1 booking needs your OK"
                : `${dayWaitingCount} bookings need your OK`}
            </span>
          </div>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-300 shrink-0">
            Show me
          </span>
        </button>
      )}

      {/* Empty Day Notice */}
      {activeBookingCount === 0 && (
        <div className="rounded-2xl bg-surface-card border border-border-subtle p-4 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-[#22C55E] shrink-0" />
          <p className="text-base font-semibold text-text-primary">
            {allSlotsFree
              ? isToday
                ? "No bookings yet today. All your slots are open."
                : "No bookings yet for this day. All your slots are open."
              : isToday
              ? "No player bookings yet today."
              : "No player bookings yet for this day."}
          </p>
        </div>
      )}

      {/* Single-Column Time Slot List */}
      <div className="space-y-3">
        {slotRows.map((row) => {
          const timeLabel = formatSlotRange12(row.hour);

          if (row.kind === "FREE") {
            return (
              <button
                key={row.time}
                id={`today-slot-${row.hour}`}
                type="button"
                onClick={() => openBlockSheet(row.time, row.hour)}
                className="w-full text-left rounded-2xl bg-surface-card hover:bg-surface-raised/60 border border-border-subtle hover:border-border-prominent p-4 min-h-[64px] flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <p className="text-sm font-medium text-text-secondary">
                    Tap to add walk-in or close slot
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22C55E]/15 text-[#15803D] dark:text-[#4ADE80] border border-[#22C55E]/35 text-sm font-extrabold shrink-0">
                  <CheckCircle2 size={17} className="shrink-0" />
                  <span>FREE</span>
                </div>
              </button>
            );
          }

          if (row.kind === "HELD") {
            return (
              <div
                key={row.time}
                id={`today-slot-${row.hour}`}
                className="rounded-2xl bg-surface-raised/70 border border-border-subtle p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/35 text-sm font-extrabold">
                    <Hourglass size={17} className="shrink-0" />
                    <span>BEING BOOKED</span>
                  </div>
                </div>
                <p className="text-base font-semibold text-text-secondary">
                  Someone is booking this now
                </p>
              </div>
            );
          }

          if (row.kind === "BOOKED_UNAVAILABLE") {
            return (
              <div
                key={row.time}
                id={`today-slot-${row.hour}`}
                className="rounded-2xl bg-surface-card border border-[#38BDF8]/40 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284C7]/15 text-[#0369A1] dark:text-[#38BDF8] border border-[#38BDF8]/40 text-sm font-extrabold">
                    <Ticket size={17} className="shrink-0" />
                    <span>BOOKED</span>
                  </div>
                </div>
                <p className="text-base font-semibold text-text-secondary">
                  Booked (details not available)
                </p>
              </div>
            );
          }

          if (row.kind === "BLOCKED") {
            const fallbackNoteKey = activePitch
              ? `${activePitch.id}_${selectedDate}_${row.time}`.replace(/[\/\s—:]/g, "-")
              : row.slot.id;
            const slotNote = slotNotesByKey[row.slot.id] || slotNotesByKey[fallbackNoteKey];
            const blockedInfo = formatBlockedReason(row.slot, slotNote);
            return (
              <div
                key={row.time}
                id={`today-slot-${row.hour}`}
                className="rounded-2xl bg-surface-raised/70 border border-border-subtle p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/35 text-sm font-extrabold">
                    <Ban size={17} className="shrink-0" />
                    <span>BLOCKED</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <p className="text-base font-semibold text-text-primary break-words">
                    {blockedInfo.summary}
                  </p>

                  {blockedInfo.phone && (
                    <a
                      href={`tel:${blockedInfo.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-surface-card border border-border-subtle text-base font-bold text-text-primary hover:border-border-prominent active:scale-[0.98] transition-colors"
                    >
                      <Phone size={18} className="text-[#22C55E] shrink-0" />
                      <span className="tabular-nums">{blockedInfo.phone}</span>
                    </a>
                  )}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setUnblockTarget({ time: row.time, hour: row.hour })}
                      className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-prominent text-text-primary text-base font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <span>Open this slot again</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const booking = row.booking;
          const customerName =
            booking.userName || (booking as any).playerName || "Customer";
          const customerPhone =
            booking.playerPhone || (booking as any).userPhone || "";

          if (row.kind === "PROBLEM") {
            return (
              <div
                key={row.time}
                id={`today-slot-${row.hour}`}
                className="rounded-2xl bg-surface-card border-2 border-[#EF4444]/50 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 text-[#DC2626] dark:text-[#F87171] border border-[#EF4444]/40 text-sm font-extrabold">
                    <AlertTriangle size={17} className="shrink-0" />
                    <span>PROBLEM</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <p className="text-base font-semibold text-[#DC2626] dark:text-[#F87171]">
                    Payment problem. The Pitchly team is checking it.
                  </p>

                  <p className="text-base font-bold text-text-primary break-words">
                    {customerName}
                  </p>

                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-base font-bold text-text-primary hover:border-border-prominent active:scale-[0.98] transition-colors"
                    >
                      <Phone size={18} className="text-[#22C55E] shrink-0" />
                      <span className="tabular-nums">{customerPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          }

          const moneyText = formatMoneyLine(
            booking,
            row.kind,
            row.kind === "WAITING" ? row.variant : undefined
          );
          const isBusy = processingId === booking.id;

          if (row.kind === "BOOKED") {
            return (
              <div
                key={row.time}
                id={`today-slot-${row.hour}`}
                className="rounded-2xl bg-surface-card border border-[#38BDF8]/40 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-extrabold text-text-primary tabular-nums">
                    {timeLabel}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284C7]/15 text-[#0369A1] dark:text-[#38BDF8] border border-[#38BDF8]/40 text-sm font-extrabold">
                    <Ticket size={17} className="shrink-0" />
                    <span>BOOKED</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <p className="text-base font-bold text-text-primary break-words">
                    {customerName}
                  </p>

                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-base font-bold text-text-primary hover:border-border-prominent active:scale-[0.98] transition-colors"
                    >
                      <Phone size={18} className="text-[#22C55E] shrink-0" />
                      <span className="tabular-nums">{customerPhone}</span>
                    </a>
                  )}

                  <p className="text-base font-semibold text-text-secondary break-words tabular-nums">
                    {moneyText}
                  </p>

                  {booking.paymentProofUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setProofLoadFailed(false);
                        setProofPreviewUrl(booking.paymentProofUrl!);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-base font-bold text-[#0284C7] dark:text-[#38BDF8] inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <ImageIcon size={18} className="shrink-0" />
                      <span>See proof</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // WAITING FOR YOUR OK row
          return (
            <div
              key={row.time}
              id={`today-slot-${row.hour}`}
              className="rounded-2xl bg-surface-card border-2 border-amber-500/60 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-extrabold text-text-primary tabular-nums">
                  {timeLabel}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/50 text-sm font-extrabold">
                  <Clock size={17} className="shrink-0" />
                  <span>WAITING FOR YOUR OK</span>
                </div>
              </div>

              <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                {row.variant}
              </p>

              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <p className="text-base font-bold text-text-primary break-words">
                  {customerName}
                </p>

                {customerPhone && (
                  <a
                    href={`tel:${customerPhone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-base font-bold text-text-primary hover:border-border-prominent active:scale-[0.98] transition-colors"
                  >
                    <Phone size={18} className="text-[#22C55E] shrink-0" />
                    <span className="tabular-nums">{customerPhone}</span>
                  </a>
                )}

                <p className="text-base font-semibold text-text-secondary break-words tabular-nums">
                  {moneyText}
                </p>

                {booking.transactionRef && (
                  <p className="text-sm font-semibold text-text-secondary break-all">
                    Payment code: {booking.transactionRef}
                  </p>
                )}

                {booking.paymentProofUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProofLoadFailed(false);
                      setProofPreviewUrl(booking.paymentProofUrl!);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-base font-bold text-[#0284C7] dark:text-[#38BDF8] inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <ImageIcon size={18} className="shrink-0" />
                    <span>See proof</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleConfirmBooking(booking)}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-base font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isBusy ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={20} strokeWidth={3} />
                      <span>Confirm</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setDeclineTarget(booking)}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/50 text-[#DC2626] dark:text-[#F87171] text-base font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  <X size={20} strokeWidth={2.5} />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Slot Action Sheet: Walk-in / Phone Booking OR Close for Maintenance */}
      {blockTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={closeBlockSheet}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-slot-sheet-title"
            className="w-full max-w-md rounded-2xl bg-surface-card border border-border-subtle p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3
                  id="block-slot-sheet-title"
                  className="text-xl font-extrabold text-text-primary tabular-nums"
                >
                  {formatSlotRange12(blockTarget.hour)}
                </h3>
                <p className="text-base text-text-secondary">
                  {blockStep === "choose"
                    ? "What would you like to do with this free slot?"
                    : blockStep === "walk_in"
                    ? "Save a phone or walk-in customer for this slot."
                    : "Close this slot so players cannot book it."}
                </p>
              </div>
              <button
                type="button"
                disabled={savingSlotAction}
                onClick={closeBlockSheet}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface-raised shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {blockStep === "choose" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setBlockFormError("");
                    setBlockStep("walk_in");
                  }}
                  className="w-full min-h-[54px] px-4 py-3.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-base font-extrabold flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus size={20} strokeWidth={2.5} />
                  <span>Booked by phone or walk-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBlockFormError("");
                    setBlockStep("maintenance");
                  }}
                  className="w-full min-h-[54px] px-4 py-3.5 rounded-xl bg-surface-raised hover:bg-surface-raised/80 border border-border-prominent text-text-primary text-base font-extrabold flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <Wrench size={20} />
                  <span>Close this slot (maintenance)</span>
                </button>

                <button
                  type="button"
                  onClick={closeBlockSheet}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-secondary text-base font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
                >
                  Go back
                </button>
              </div>
            )}

            {blockStep === "walk_in" && (
              <form onSubmit={handleSaveWalkIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="walkin-customer-name"
                    className="block text-base font-bold text-text-primary"
                  >
                    Customer name
                  </label>
                  <input
                    id="walkin-customer-name"
                    type="text"
                    required
                    maxLength={120}
                    value={walkInName}
                    onChange={(e) => {
                      setWalkInName(e.target.value);
                      if (blockFormError) setBlockFormError("");
                    }}
                    placeholder="e.g. John Mukasa"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-app-base border border-border-prominent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-lime"
                  />
                  {blockFormError && (
                    <p className="text-sm font-bold text-[#EF4444]">{blockFormError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="walkin-customer-phone"
                    className="block text-base font-bold text-text-primary"
                  >
                    Phone number (optional)
                  </label>
                  <input
                    id="walkin-customer-phone"
                    type="tel"
                    maxLength={120}
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="e.g. 0772 123 456"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-app-base border border-border-subtle text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-lime"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={savingSlotAction}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingSlotAction ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <span>Save booking</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={savingSlotAction}
                    onClick={() => setBlockStep("choose")}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-base font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
                  >
                    Go back
                  </button>
                </div>
              </form>
            )}

            {blockStep === "maintenance" && (
              <form onSubmit={handleSaveMaintenance} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="maintenance-note"
                    className="block text-base font-bold text-text-primary"
                  >
                    Short note (optional)
                  </label>
                  <input
                    id="maintenance-note"
                    type="text"
                    maxLength={120}
                    value={maintenanceNote}
                    onChange={(e) => setMaintenanceNote(e.target.value)}
                    placeholder="e.g. Fixing lights or cutting grass"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-app-base border border-border-subtle text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-lime"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={savingSlotAction}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingSlotAction ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <span>Close slot</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={savingSlotAction}
                    onClick={() => setBlockStep("choose")}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-base font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
                  >
                    Go back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reopen Blocked Slot Confirmation Sheet */}
      {unblockTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => {
            if (!savingSlotAction) setUnblockTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unblock-sheet-title"
            className="w-full max-w-md rounded-2xl bg-surface-card border border-border-subtle p-5 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3
                id="unblock-sheet-title"
                className="text-xl font-extrabold text-text-primary"
              >
                Open this slot for players again?
              </h3>
              <p className="text-base text-text-secondary tabular-nums">
                {formatSlotRange12(unblockTarget.hour)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={savingSlotAction}
                onClick={handleConfirmReopenSlot}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {savingSlotAction ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <span>Yes, open slot</span>
                )}
              </button>

              <button
                type="button"
                disabled={savingSlotAction}
                onClick={() => setUnblockTarget(null)}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-base font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Decline Confirmation Sheet */}
      {declineTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => {
            if (!processingId) setDeclineTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="decline-sheet-title"
            className="w-full max-w-md rounded-2xl bg-surface-card border border-border-subtle p-5 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3
                id="decline-sheet-title"
                className="text-xl font-extrabold text-text-primary"
              >
                Cancel this booking? The player will be told.
              </h3>
              <p className="text-base text-text-secondary">
                {declineTarget.userName || (declineTarget as any).playerName || "Customer"} ·{" "}
                {declineTarget.time}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={processingId === declineTarget.id}
                onClick={handleConfirmDecline}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {processingId === declineTarget.id ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <span>Yes, cancel</span>
                )}
              </button>

              <button
                type="button"
                disabled={processingId === declineTarget.id}
                onClick={() => setDeclineTarget(null)}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-base font-bold flex items-center justify-center cursor-pointer active:scale-[0.98]"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Image Modal (same pattern as BookingManager) */}
      {proofPreviewUrl && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setProofPreviewUrl(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Payment proof"
            className="relative max-w-xl w-full bg-surface-card rounded-2xl border border-border-subtle p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <span className="text-base font-extrabold text-text-primary">
                Payment proof
              </span>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                aria-label="Close payment proof"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface-raised cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-xl bg-app-base flex items-center justify-center min-h-[200px] p-2">
              {proofLoadFailed ? (
                <p className="text-base text-text-secondary text-center p-4">
                  Could not open this image. Please ask the player to resend it.
                </p>
              ) : (
                <img
                  src={proofPreviewUrl}
                  alt="Payment proof"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain rounded-lg"
                  onError={() => setProofLoadFailed(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
