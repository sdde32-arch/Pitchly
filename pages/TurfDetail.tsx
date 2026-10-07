import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Share2,
  Star,
  MapPin,
  Lightbulb,
  Briefcase,
  Car,
  Coffee,
  Wifi,
  Loader2,
  Heart,
  Calendar as CalendarIcon,
  Clock,
  Check,
  CheckCircle2,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Lock,
  AlertCircle,
  Zap,
  Home,
  Users,
  Plus,
  Trash2,
  Camera,
  Shield,
  Bath,
  Shirt,
  HeartPulse,
  Trophy,
  Upload,
  MessageSquare,
  Phone,
  Send,
  ExternalLink,
  ShieldCheck,
  Layers,
  Flame,
  Sun,
  Moon,
  Compass,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { chatService } from "../services/chatService";
import { pitchService } from "../services/pitchService";
import { bookingService } from "../services/bookingService";
import { optimizeAndUploadPitchPhoto } from "../utils/imageOptimizer";
import { Pitch, SlotAvailability, Booking } from "../types/firebase";
import { Turf, ReportTargetType, BookingStatus } from "../types";
import { TURFS } from "../constants";
import { ReportModal } from "../components/ReportModal";
import { Button } from "../components/ui/Button";
import { TurfImageGallery } from "../components/TurfImageGallery";
import { TurfDetailSkeleton } from "../components/ui/Skeleton";
import { TurfReviews } from "../components/TurfReviews";
import { reviewService } from "../services/reviewService";
import { CreateMatchProposalModal } from "../components/invitations/CreateMatchProposalModal";
import { Layout } from "../components/Layout";

interface AmenityMeta {
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;
  iconColor: string;
  bgColor: string;
  glowColor: string;
}

const getAmenityMeta = (rawName: string): AmenityMeta => {
  const lower = rawName.toLowerCase();

  // VIP Club / Premium / Exclusive Lounge
  if (lower.includes("vip") || (lower.includes("club") && !lower.includes("clubhouse")) || lower.includes("lounge")) {
    return {
      name: rawName,
      subtitle: "Exclusive amenities",
      icon: Sparkles,
      iconColor: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-500/15 dark:bg-purple-400/20",
      glowColor: "shadow-purple-500/20",
    };
  }

  // Resort Dining / Cafe / Refreshments / Food / Bar / Drinks / BBQ
  if (
    lower.includes("dining") ||
    lower.includes("cafe") ||
    lower.includes("refreshment") ||
    lower.includes("canteen") ||
    lower.includes("coffee") ||
    lower.includes("food") ||
    lower.includes("bar") ||
    lower.includes("bbq") ||
    lower.includes("drink") ||
    lower.includes("smoothie") ||
    lower.includes("restaurant") ||
    lower.includes("clubhouse")
  ) {
    return {
      name: rawName,
      subtitle: "Food & refreshments",
      icon: Coffee,
      iconColor: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/15 dark:bg-orange-400/20",
      glowColor: "shadow-orange-500/20",
    };
  }

  // Changing rooms / Lockers / Restrooms / Showers / Bath
  if (
    lower.includes("changing") ||
    lower.includes("locker") ||
    lower.includes("restroom") ||
    lower.includes("shower") ||
    lower.includes("bath")
  ) {
    return {
      name: rawName,
      subtitle: "Clean facilities",
      icon: Bath,
      iconColor: "text-cyan-500 dark:text-cyan-400",
      bgColor: "bg-cyan-500/15 dark:bg-cyan-400/20",
      glowColor: "shadow-cyan-500/20",
    };
  }

  // Parking
  if (lower.includes("park") || lower.includes("car")) {
    return {
      name: rawName,
      subtitle: "Secure on-site",
      icon: Car,
      iconColor: "text-indigo-500 dark:text-indigo-400",
      bgColor: "bg-indigo-500/15 dark:bg-indigo-400/20",
      glowColor: "shadow-indigo-500/20",
    };
  }

  // Floodlights / Lighting
  if (lower.includes("floodlight") || lower.includes("light")) {
    return {
      name: rawName,
      subtitle: "Night match ready",
      icon: Lightbulb,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/15 dark:bg-amber-400/20",
      glowColor: "shadow-amber-500/20",
    };
  }

  // WiFi / Internet
  if (lower.includes("wifi") || lower.includes("internet")) {
    return {
      name: rawName,
      subtitle: "High-speed network",
      icon: Wifi,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/15 dark:bg-blue-400/20",
      glowColor: "shadow-blue-500/20",
    };
  }

  // Certified turf / Pitch quality / Grass
  if (
    lower.includes("turf") ||
    lower.includes("7-a-side") ||
    lower.includes("5-a-side") ||
    lower.includes("11-a-side") ||
    lower.includes("pitch") ||
    lower.includes("fifa") ||
    lower.includes("grass")
  ) {
    return {
      name: rawName,
      subtitle: "Pro artificial grass",
      icon: Trophy,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/15 dark:bg-emerald-400/20",
      glowColor: "shadow-emerald-500/20",
    };
  }

  // Spectator Pavilion / Seating / Bleachers / Stands
  if (
    lower.includes("spectator") ||
    lower.includes("pavilion") ||
    lower.includes("bleacher") ||
    lower.includes("seating") ||
    lower.includes("stand")
  ) {
    return {
      name: rawName,
      subtitle: "Covered seating",
      icon: Users,
      iconColor: "text-violet-500 dark:text-violet-400",
      bgColor: "bg-violet-500/15 dark:bg-violet-400/20",
      glowColor: "shadow-violet-500/20",
    };
  }

  // Dugouts / Team benches
  if (lower.includes("dugout") || lower.includes("bench")) {
    return {
      name: rawName,
      subtitle: "Technical area",
      icon: Shirt,
      iconColor: "text-teal-500 dark:text-teal-400",
      bgColor: "bg-teal-500/15 dark:bg-teal-400/20",
      glowColor: "shadow-teal-500/20",
    };
  }

  // Netting / Rebound boards / Cage
  if (lower.includes("net") || lower.includes("rebound") || lower.includes("cage") || lower.includes("board")) {
    return {
      name: rawName,
      subtitle: "Perimeter safety",
      icon: Shield,
      iconColor: "text-lime-500 dark:text-lime-400",
      bgColor: "bg-lime-500/15 dark:bg-lime-400/20",
      glowColor: "shadow-lime-500/20",
    };
  }

  // Security
  if (lower.includes("security") || lower.includes("guard")) {
    return {
      name: rawName,
      subtitle: "24/7 Monitored",
      icon: ShieldCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/15 dark:bg-emerald-400/20",
      glowColor: "shadow-emerald-500/20",
    };
  }

  // First Aid
  if (lower.includes("aid") || lower.includes("medical") || lower.includes("kit")) {
    return {
      name: rawName,
      subtitle: "Medical standby",
      icon: HeartPulse,
      iconColor: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/15 dark:bg-rose-400/20",
      glowColor: "shadow-rose-500/20",
    };
  }

  // Equipment / Bibs / Balls / Rental / Shop
  if (lower.includes("equipment") || lower.includes("ball") || lower.includes("bib") || lower.includes("rental") || lower.includes("shop")) {
    return {
      name: rawName,
      subtitle: "Available on-site",
      icon: Briefcase,
      iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
      bgColor: "bg-fuchsia-500/15 dark:bg-fuchsia-400/20",
      glowColor: "shadow-fuchsia-500/20",
    };
  }

  // Scoreboard / Clock / Timer
  if (lower.includes("clock") || lower.includes("timer") || lower.includes("scoreboard")) {
    return {
      name: rawName,
      subtitle: "Digital match tracking",
      icon: Clock,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/15 dark:bg-yellow-400/20",
      glowColor: "shadow-yellow-500/20",
    };
  }

  // Live Stream / Camera
  if (lower.includes("camera") || lower.includes("stream") || lower.includes("video")) {
    return {
      name: rawName,
      subtitle: "Live match capture",
      icon: Camera,
      iconColor: "text-pink-500 dark:text-pink-400",
      bgColor: "bg-pink-500/15 dark:bg-pink-400/20",
      glowColor: "shadow-pink-500/20",
    };
  }

  // Panoramic View / Breeze
  if (lower.includes("view") || lower.includes("breeze") || lower.includes("panoramic")) {
    return {
      name: rawName,
      subtitle: "Scenic venue",
      icon: Compass,
      iconColor: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-500/15 dark:bg-sky-400/20",
      glowColor: "shadow-sky-500/20",
    };
  }

  return {
    name: rawName,
    subtitle: "Included with booking",
    icon: CheckCircle2,
    iconColor: "text-primary-lime",
    bgColor: "bg-primary-lime/15 dark:bg-primary-lime/20",
    glowColor: "shadow-primary-lime/20",
  };
};

export const TurfDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useUser();
  const { turfs, loading: contextLoading } = useBooking();
  const [realPitch, setRealPitch] = useState<Pitch | null>(null);
  const [loadingPitch, setLoadingPitch] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [dynamicRating, setDynamicRating] = useState<number | null>(null);
  const [dynamicTotalReviews, setDynamicTotalReviews] = useState<number | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Booking Availability Preview States
  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotAvailabilityList, setSlotAvailabilityList] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Message Pitch Owner/Manager state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Gallery Photo Upload & Customization State
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(() => {
    try {
      const targetId = id?.replace(/^pitch-/, "") || id || "";
      const raw = localStorage.getItem(`pitchly_custom_photos_${id}`) ||
                  localStorage.getItem(`pitchly_custom_photos_${targetId}`) ||
                  (id && id.toLowerCase().includes("tal") ? localStorage.getItem("pitchly_custom_photos_tal-olympic-arena") : null);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("pitchly_favorites") || "[]");
      const currentId = id?.replace(/^pitch-/, "") || id || "";
      return Array.isArray(favs) && (favs.includes(currentId) || favs.includes(id || ""));
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    try {
      const currentId = id?.replace(/^pitch-/, "") || id || "";
      const favs: string[] = JSON.parse(localStorage.getItem("pitchly_favorites") || "[]");
      let nextFavs: string[];
      if (favs.includes(currentId) || favs.includes(id || "")) {
        nextFavs = favs.filter((f: string) => f !== currentId && f !== (id || ""));
        setIsFavorite(false);
        showToast("Removed from favorites", "info");
      } else {
        nextFavs = [...favs, currentId];
        setIsFavorite(true);
        showToast("Saved to your favorites!", "success");
      }
      localStorage.setItem("pitchly_favorites", JSON.stringify(nextFavs));
    } catch {
      setIsFavorite(prev => !prev);
      showToast("Favorites updated!", "success");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = turf?.name ? `${turf.name} on Pitchly` : "Football Turf on Pitchly";
    const shareText = `Check out ${turf?.name || "this pitch"} on Pitchly - live booking and match challenges!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Share failed", err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Pitch link copied to clipboard!", "success");
    } catch {
      showToast("Share URL: " + shareUrl, "info");
    }
  };

  const normalizedId = id?.replace(/^pitch-/, "") || "";
  const lowerId = (id || "").toLowerCase();
  const turf: Turf | undefined = realPitch
    ? {
        id: realPitch.id,
        ownerId: realPitch.ownerId,
        name: realPitch.name,
        location: realPitch.location,
        pricePerHour: realPitch.pricePerHour,
        type: realPitch.pitchFormats?.[0] || "11-a-side",
        image: realPitch.images?.[0] || "",
        images: realPitch.images || [],
        additionalImages: (realPitch as any).additionalImages || [],
        rating: 4.8,
        distance: "2.4km away",
        status: realPitch.status as any,
        amenities: realPitch.amenities || [],
        openingHour: realPitch.openingHour || "06:00",
        closingHour: realPitch.closingHour || "23:00",
        blockedDates: [],
      }
    : turfs.find((t) => t.id === id || t.id === normalizedId || `pitch-${t.id}` === id || (lowerId.includes("tal") && t.id.toLowerCase().includes("tal"))) ||
      TURFS.find((t) => t.id === id || t.id === normalizedId || `pitch-${t.id}` === id || (lowerId.includes("tal") && t.id.toLowerCase().includes("tal")));

  const DEMO_GALLERY_FALLBACKS = [
    { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80", label: "Full Pitch Arena" },
    { url: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80", label: "Floodlit Night View" },
    { url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80", label: "Goalpost & Net" },
    { url: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80", label: "Match Action" },
    { url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80", label: "Spectator Pavilion & Dugout" },
  ];

  const galleryImages = useMemo(() => {
    if (uploadedPhotos && uploadedPhotos.length > 0) {
      return uploadedPhotos;
    }

    try {
      const targetId = turf?.id || normalizedId || id || "";
      const raw = localStorage.getItem(`pitchly_custom_photos_${targetId}`) ||
                  (targetId.includes("tal") ? localStorage.getItem("pitchly_custom_photos_tal-olympic-arena") : null);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    if (realPitch?.images && realPitch.images.length > 0) {
      const valid = realPitch.images.filter(img => typeof img === "string" && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }

    const customImgs = [
      ...(turf?.images || []),
      ...(turf?.image ? [turf.image] : []),
      ...(turf?.additionalImages || [])
    ].filter((img, idx, self) => img && typeof img === "string" && img.trim().length > 0 && self.indexOf(img) === idx);

    if (customImgs.length > 0) {
      return customImgs;
    }

    return DEMO_GALLERY_FALLBACKS.map(f => f.url);
  }, [uploadedPhotos, realPitch, turf, id, normalizedId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const newUrls: string[] = [];
      const fileList = Array.from(files);

      for (const file of fileList) {
        const res = await optimizeAndUploadPitchPhoto(file, user?.uid, {
          maxDimension: 1280,
          quality: 0.82,
          mimeType: "image/jpeg"
        });
        if (res) newUrls.push(res);
      }

      if (newUrls.length > 0) {
        const nextList = [...newUrls, ...galleryImages].filter((v, i, a) => a.indexOf(v) === i);
        setUploadedPhotos(nextList);

        const targetKey = turf?.id || normalizedId || id || "tal-olympic-arena";
        localStorage.setItem(`pitchly_custom_photos_${targetKey}`, JSON.stringify(nextList));
        localStorage.setItem(`pitchly_custom_pitch_${targetKey}`, JSON.stringify({ images: nextList }));
        if (targetKey.includes("tal") || (id && id.toLowerCase().includes("tal"))) {
          localStorage.setItem("pitchly_custom_photos_tal-olympic-arena", JSON.stringify(nextList));
          localStorage.setItem("pitchly_custom_pitch_tal-olympic-arena", JSON.stringify({ images: nextList }));
        }

        try {
          await pitchService.update(targetKey, { images: nextList });
        } catch {
          // offline fallback
        }

        setCurrentImgIndex(0);
        showToast(`Added ${newUrls.length} HD photo${newUrls.length > 1 ? "s" : ""} to ${turf?.name || "pitch"} gallery!`, "success");
      }
    } catch (err: any) {
      console.error("Photo upload error", err);
      showToast("Could not process some photos. Please try again.", "error");
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setUploadedPhotos(updated);
    const targetKey = turf?.id || normalizedId || id || "tal-olympic-arena";
    if (updated.length > 0) {
      localStorage.setItem(`pitchly_custom_photos_${targetKey}`, JSON.stringify(updated));
      localStorage.setItem(`pitchly_custom_pitch_${targetKey}`, JSON.stringify({ images: updated }));
    } else {
      localStorage.removeItem(`pitchly_custom_photos_${targetKey}`);
      localStorage.removeItem(`pitchly_custom_pitch_${targetKey}`);
      if (targetKey.includes("tal")) {
        localStorage.removeItem("pitchly_custom_photos_tal-olympic-arena");
        localStorage.removeItem("pitchly_custom_pitch_tal-olympic-arena");
      }
    }
    if (currentImgIndex >= updated.length) {
      setCurrentImgIndex(Math.max(0, updated.length - 1));
    }
    showToast("Photo removed from gallery", "info");
  };

  // Next 14 days calendar list for live availability preview
  const calendarDays = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}-${monthNum}-${String(dayNum).padStart(2, '0')}`;
      list.push({ dayName, dayNum, monthStr, dateStr, isToday: i === 0 });
    }
    return list;
  }, []);

  // Generate hourly timeslots from opening to closing
  const timesList = useMemo(() => {
    let open = turf?.openingHour || "06:30";
    let close = turf?.closingHour || "23:00";
    const openHour = parseInt(open.split(':')[0]) || 7;
    const closeHour = parseInt(close.split(':')[0]) || 23;
    const list: string[] = [];
    for (let h = openHour; h < closeHour; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, [turf]);

  // Subscribe to live slot availability for currently selected date
  useEffect(() => {
    const activePitchId = turf?.id || id;
    if (!activePitchId || !selectedDate) return;

    setLoadingSlots(true);
    const unsubscribe = bookingService.subscribeSlotAvailabilityByPitchAndDate(
      activePitchId,
      selectedDate,
      (slots) => {
        setSlotAvailabilityList(slots || []);
        setLoadingSlots(false);
      },
      (err) => {
        console.warn("Could not load slot availability:", err);
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [turf?.id, id, selectedDate]);

  const getSlotStatus = (time: string): "available" | "booked" | "past" => {
    const now = new Date();
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (selectedDate === todayYMD) {
      const slotHour = parseInt(time.split(":")[0]);
      if (slotHour <= now.getHours()) {
        return "past";
      }
    }

    const slot = slotAvailabilityList.find(s => s.time === time);
    if (!slot) return "available";
    if (slot.status === "booked" || slot.status === "blocked") return "booked";
    if (slot.status === "held") {
      const expiresAt = slot.expiresAt ? new Date(slot.expiresAt).getTime() : 0;
      if (expiresAt > Date.now()) return "booked";
    }
    return "available";
  };

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

        try {
          const revs = await reviewService.listByPitch(id);
          if (revs && revs.length > 0) {
            const avg = Number((revs.reduce((acc, r) => acc + r.rating, 0) / revs.length).toFixed(1));
            setDynamicRating(avg);
            setDynamicTotalReviews(revs.length);
          } else {
            setDynamicRating(0);
            setDynamicTotalReviews(0);
          }
        } catch (revErr) {
          console.error("Failed to load reviews for summary", revErr);
        }
      } catch (e) {
        console.error("Failed to load pitch", e);
      } finally {
        setLoadingPitch(false);
      }
    };
    fetchPitch();
  }, [id, normalizedId]);

  const PITCH_MANAGERS: Record<string, { name: string; role: string; phone: string; image: string; bio: string; ownerId: string }> = {
    "panamera-kololo": {
      name: "Denis Mukasa",
      role: "Senior Facility & Matchday Manager",
      phone: "+256 701 556 778",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
      bio: "Head caretaker & matchday operations manager at Panamera Sports Lounge, Kololo.",
      ownerId: "owner_panamera_kololo"
    },
    "kinetic-bugolobi": {
      name: "Sarah Namubiru",
      role: "Operations & League Coordinator",
      phone: "+256 782 449 112",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
      bio: "Facility manager overseeing floodlights and match operations at Kinetic Bugolobi.",
      ownerId: "owner_kinetic_bugolobi"
    },
    "lugogo-astroturf": {
      name: "Coach Brian Kigozi",
      role: "Chief Pitch Superintendent",
      phone: "+256 752 991 304",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
      bio: "Manages pitch grounds, tournament logistics, and gear rentals at Lugogo.",
      ownerId: "owner_lugogo_grounds"
    },
    "kensington-kololo": {
      name: "Arthur Kasozi",
      role: "Ground Operations Lead",
      phone: "+256 772 113 450",
      image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300",
      bio: "On-ground match marshal and maintenance lead at Kensington Arena.",
      ownerId: "owner_kensington"
    },
    "tal-olympic-arena": {
      name: "Musa Kayondo",
      role: "Operations & Tournament Grounds Manager",
      phone: "+256 700 882 119",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
      bio: "Facility supervisor & match coordinator overseeing pitch turf maintenance, team dugouts, and tournament match sessions at Tal Olympic Park, Munyonyo.",
      ownerId: "owner_tal_olympic"
    }
  };

  const pitchKey = turf?.id || normalizedId || id || "";
  const matchedManager = PITCH_MANAGERS[pitchKey] || 
    (pitchKey.includes("tal-olympic") ? PITCH_MANAGERS["tal-olympic-arena"] : null) ||
    (pitchKey.includes("panamera") ? PITCH_MANAGERS["panamera-kololo"] : null) ||
    (pitchKey.includes("kinetic") ? PITCH_MANAGERS["kinetic-bugolobi"] : null) ||
    (pitchKey.includes("lugogo") ? PITCH_MANAGERS["lugogo-astroturf"] : null) ||
    (pitchKey.includes("kensington") ? PITCH_MANAGERS["kensington-kololo"] : null);

  const currentManager = {
    name: (realPitch as any)?.managerName || (turf as any)?.managerName || matchedManager?.name || "Denis Mukasa",
    role: (realPitch as any)?.managerRole || (turf as any)?.managerRole || matchedManager?.role || "Facility & Pitch Manager",
    phone: (realPitch as any)?.managerPhone || (realPitch as any)?.contactPhone || turf?.contactPhone || matchedManager?.phone || "+256 701 556 778",
    image: (realPitch as any)?.managerImage || (turf as any)?.managerImage || matchedManager?.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    bio: (realPitch as any)?.managerBio || matchedManager?.bio || "On-ground pitch caretaker and facility coordinator.",
    ownerId: turf?.ownerId || (realPitch as any)?.ownerId || matchedManager?.ownerId || "owner_facility_default"
  };

  const handleSendMessageToOwner = async () => {
    if (!user) {
      showToast("Please log in to message the pitch manager.", "info");
      return;
    }
    if (!messageText.trim()) {
      showToast("Please enter a message.", "error");
      return;
    }
    setIsSendingMessage(true);
    try {
      const targetOwnerId = currentManager.ownerId || turf?.ownerId || "owner_facility_default";
      const senderName = userProfile?.name || user.displayName || user.email?.split("@")[0] || "Player";
      const senderAvatar = user.photoURL || (userProfile as any)?.avatar || "";

      const convId = await chatService.getOrCreateDirectConversation(
        user.uid,
        targetOwnerId,
        {
          turfName: turf?.name || "Football Arena",
          pitchId: turf?.id,
          participantDetails: {
            [user.uid]: {
              name: senderName,
              avatar: senderAvatar,
              role: "Player"
            },
            [targetOwnerId]: {
              name: currentManager.name,
              avatar: currentManager.image,
              role: "Pitch Manager"
            }
          }
        }
      );

      await chatService.sendMessage(
        convId,
        user.uid,
        messageText.trim(),
        senderName,
        senderAvatar
      );

      setActiveConversationId(convId);
      setMessageSentSuccess(true);
      showToast("Message delivered to pitch owner's inbox!", "success");
    } catch (err: any) {
      console.error("Failed to send message to owner:", err);
      showToast("Failed to deliver message. Please try again.", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleProceedToBooking = () => {
    if (!turf) return;
    const searchParams = new URLSearchParams();
    if (selectedDate) searchParams.set("date", selectedDate);
    if (selectedTime) searchParams.set("time", selectedTime);
    const queryString = searchParams.toString();
    navigate(`/turf/${turf.id}/book${queryString ? `?${queryString}` : ""}`);
  };

  const handleGoBack = () => {
    // 1. Check explicit state passed via router navigation
    const navState = location.state as any;
    if (navState?.returnTo && typeof navState.returnTo === "string") {
      navigate(navState.returnTo);
      return;
    }
    if (navState?.from === "explore") {
      navigate("/explore-map");
      return;
    }
    if (navState?.from === "bookings") {
      navigate("/bookings");
      return;
    }
    if (navState?.from === "teams") {
      navigate("/teams");
      return;
    }
    if (navState?.from === "home") {
      navigate("/home");
      return;
    }

    // 2. Check last browsed route stored in sessionStorage
    try {
      const lastPage = sessionStorage.getItem("pitchly_last_browse_page");
      if (lastPage && lastPage.startsWith("/") && !lastPage.startsWith("/turf/") && lastPage !== location.pathname) {
        navigate(lastPage);
        return;
      }
    } catch (e) {
      // sessionStorage unavailable
    }

    // 3. Guaranteed reliable fallback to /home
    navigate("/home");
  };

  if (contextLoading || loadingPitch) {
    return <TurfDetailSkeleton />;
  }

  if (!turf || ((turf.status as string) !== "ACTIVE" && (turf.status as string) !== "approved")) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-app-base p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center mb-4 text-text-tertiary">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Pitch Not Available
        </h2>
        <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto leading-relaxed">
          This pitch is currently inactive or under maintenance. Check our other verified arenas in Kampala.
        </p>
        <Button onClick={() => navigate("/home")} variant="primary">
          Explore Active Turfs
        </Button>
      </div>
    );
  }

  const primaryPhoto = galleryImages[0] || DEMO_GALLERY_FALLBACKS[0].url;
  const secondaryPhotos = galleryImages.slice(1, 5);

  return (
    <Layout>
      <div className="bg-app-base text-text-primary font-sans min-h-screen pb-28 lg:pb-16 selection:bg-primary-lime selection:text-accent-text">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface-card/95 backdrop-blur-xl border border-border-prominent shadow-2xl text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200">
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === "success"
                  ? "bg-primary-lime shadow-[0_0_8px_rgba(168,255,0,0.8)]"
                  : toast.type === "error"
                  ? "bg-red-400"
                  : "bg-blue-400"
              }`}
            />
            <span className="text-text-primary">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-1 text-text-tertiary hover:text-text-primary cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          {/* TOP BAR / BREADCRUMB & ACTIONS */}
          <div className="sticky top-0 z-30 -mx-4 px-4 py-2 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-app-base/95 backdrop-blur-md sm:bg-transparent flex items-center justify-between gap-4 mb-4 border-b border-border-subtle/40 sm:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                id="turf-detail-back-button"
                onClick={handleGoBack}
                className="w-9 h-9 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-primary-lime/40 flex items-center justify-center text-text-primary hover:text-primary-lime transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                title="Go back"
                aria-label="Go back to previous page"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>

              <nav className="flex items-center gap-1.5 text-xs text-text-tertiary truncate">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="hover:text-primary-lime transition-colors cursor-pointer font-medium"
                >
                  Kampala
                </button>
                <span>/</span>
                <span className="text-text-secondary truncate">{turf.name}</span>
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="h-9 px-3 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Share venue"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={toggleFavorite}
                className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isFavorite
                    ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                    : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
                title={isFavorite ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart size={14} className={isFavorite ? "fill-red-500" : ""} />
                <span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-9 h-9 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Report issue"
              >
                <AlertCircle size={15} />
              </button>
            </div>
          </div>

          {/* VENUE TITLE HEADER */}
          <div className="mb-5 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-primary tracking-tight font-display">
                {turf.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-lime bg-primary-lime/10 border border-primary-lime/20 px-2.5 py-0.5 rounded-full">
                <Check size={12} strokeWidth={3} />
                <span>Verified Arena</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-text-secondary">
              <a
                href="#reviews-section"
                className="flex items-center gap-1 font-semibold text-text-primary hover:text-primary-lime transition-colors cursor-pointer"
              >
                <Star size={14} className="fill-[#FACC15] text-[#FACC15]" />
                <span>{dynamicRating !== null && dynamicRating > 0 ? dynamicRating.toFixed(1) : (turf.rating || "4.9")}</span>
                <span className="text-text-tertiary">
                  ({dynamicTotalReviews !== null && dynamicTotalReviews > 0 ? dynamicTotalReviews : "24"} reviews)
                </span>
              </a>

              <span className="text-border-subtle">·</span>

              <div className="flex items-center gap-1 text-text-secondary min-w-0">
                <MapPin size={14} className="text-primary-lime shrink-0" />
                <span className="truncate">{turf.location}</span>
                <span className="text-text-tertiary shrink-0">({turf.distance || "2.4 km away"})</span>
              </div>

              <span className="text-border-subtle">·</span>

              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Today ({turf.openingHour || "06:30"} - {turf.closingHour || "23:00"})
              </span>
            </div>
          </div>

          {/* DESKTOP PHOTO MOSAIC & MOBILE CAROUSEL */}
          {/* 1. Desktop 5-Photo Mosaic Grid */}
          <div className="hidden md:grid grid-cols-4 gap-3 h-[380px] lg:h-[420px] rounded-2xl overflow-hidden mb-8 relative group">
            {/* Primary Large Featured Image (Left 50%) */}
            <div
              onClick={() => {
                setCurrentImgIndex(0);
                setIsLightboxOpen(true);
              }}
              className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden bg-surface-card"
            >
              <img
                src={primaryPhoto}
                alt={`${turf.name} main pitch`}
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = DEMO_GALLERY_FALLBACKS[0].url;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3.5 left-4 text-white">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                  Main Pitch
                </span>
              </div>
            </div>

            {/* 4 Angle Thumbnails (Right 50%) */}
            {secondaryPhotos.slice(0, 4).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentImgIndex(idx + 1);
                  setIsLightboxOpen(true);
                }}
                className="relative cursor-pointer overflow-hidden bg-surface-card group/thumb"
              >
                <img
                  src={photoUrl}
                  alt={`${turf.name} angle ${idx + 2}`}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = DEMO_GALLERY_FALLBACKS[idx + 1]?.url || DEMO_GALLERY_FALLBACKS[0].url;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent transition-colors" />
              </div>
            ))}

            {/* Bottom Right Photo Actions */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <label
                className={`px-3 py-2 rounded-xl bg-surface-card/95 hover:bg-surface-raised backdrop-blur-md border border-border-subtle text-xs font-bold text-text-primary shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                  isUploadingPhotos ? "opacity-75 pointer-events-none" : ""
                }`}
                title="Add photos to pitch gallery"
              >
                {isUploadingPhotos ? (
                  <Loader2 size={13} className="animate-spin text-primary-lime" />
                ) : (
                  <Upload size={13} className="text-primary-lime" />
                )}
                <span>Add Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingPhotos}
                  onChange={handlePhotoUpload}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-surface-card/95 hover:bg-surface-raised backdrop-blur-md border border-border-subtle text-xs font-bold text-text-primary shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <Camera size={14} className="text-primary-lime" />
                <span>Show all ({galleryImages.length})</span>
              </button>
            </div>
          </div>

          {/* 2. Mobile Edge-to-Edge Carousel */}
          <div className="md:hidden mb-6 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden relative bg-surface-card">
            <div className="relative aspect-[16/10] w-full">
              <img
                src={galleryImages[currentImgIndex] || primaryPhoto}
                alt={`${turf.name} photo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEMO_GALLERY_FALLBACKS[0].url;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

              {/* Prev / Next Controls */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center cursor-pointer"
                    title="Previous photo"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentImgIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center cursor-pointer"
                    title="Next photo"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Photo Counter Pill */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                {currentImgIndex + 1} / {galleryImages.length}
              </div>
            </div>
          </div>

          {/* TWO-COLUMN BOOKING ENGINE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT MAIN CONTENT COLUMN (7 cols on lg, 8 cols on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
              {/* 1. KEY SPECIFICATIONS SUMMARY STRIP */}
              <section className="bg-surface-card rounded-2xl p-3 sm:p-4 border border-border-subtle shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Trophy size={16} className="text-primary-lime shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-text-tertiary block">Surface</span>
                      <span className="font-bold text-text-primary truncate block">Certified AstroTurf</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Zap size={16} className="text-primary-lime shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-text-tertiary block">Format</span>
                      <span className="font-bold text-text-primary truncate block">{turf.type || "7-a-side"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lightbulb size={16} className="text-primary-lime shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-text-tertiary block">Lights</span>
                      <span className="font-bold text-text-primary truncate block">Night Floodlit</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users size={16} className="text-primary-lime shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-text-tertiary block">Capacity</span>
                      <span className="font-bold text-text-primary truncate block">
                        {turf.type?.includes("5") ? "10-12 Players" : turf.type?.includes("11") ? "22 Players" : "14-18 Players"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. LIVE AVAILABILITY & SLOT SELECTOR (BOOKING APP CORE) */}
              <section id="availability-section" className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/70 gap-2 flex-wrap">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
                      <CalendarIcon size={16} className="text-primary-lime" />
                      <span>Live Slot Availability &amp; Booking</span>
                    </h2>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Select date and pitch time to reserve immediately
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-text-tertiary">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-lime" />
                      Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-border-subtle" />
                      Booked
                    </span>
                  </div>
                </div>

                {/* 14-Day Date Scroller */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                    Select Matchday
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {calendarDays.map((day) => {
                      const isSelected = selectedDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.dateStr);
                            setSelectedTime(null);
                          }}
                          className={`snap-start shrink-0 w-16 sm:w-18 py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary-lime text-accent-text border-primary-lime font-black shadow-md shadow-primary-lime/20 scale-[1.02]"
                              : "bg-surface-raised hover:bg-border-subtle/50 border-border-subtle text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-accent-text/80" : "text-text-tertiary"}`}>
                            {day.isToday ? "Today" : day.dayName}
                          </span>
                          <span className="block text-base sm:text-lg font-black my-0.5">
                            {day.dayNum}
                          </span>
                          <span className={`block text-[10px] font-semibold ${isSelected ? "text-accent-text/80" : "text-text-tertiary"}`}>
                            {day.monthStr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hourly Slots Grid */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                      Available Hourly Match Slots
                    </span>
                    {loadingSlots && (
                      <span className="text-[10px] text-primary-lime flex items-center gap-1 font-semibold">
                        <Loader2 size={12} className="animate-spin" /> Updating slots...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {timesList.map((timeStr) => {
                      const status = getSlotStatus(timeStr);
                      const isSelected = selectedTime === timeStr;
                      const isBooked = status === "booked";
                      const isPast = status === "past";

                      if (isPast) {
                        return (
                          <div
                            key={timeStr}
                            className="p-2 rounded-lg bg-surface-raised/40 border border-border-subtle/40 text-center opacity-40 cursor-not-allowed"
                            title="Slot has passed"
                          >
                            <span className="block text-xs font-semibold text-text-tertiary line-through">{timeStr}</span>
                            <span className="block text-[9px] text-text-tertiary">Passed</span>
                          </div>
                        );
                      }

                      if (isBooked) {
                        return (
                          <div
                            key={timeStr}
                            className="p-2 rounded-lg bg-surface-raised/50 border border-border-subtle/50 text-center cursor-not-allowed"
                            title="Slot already reserved"
                          >
                            <span className="block text-xs font-semibold text-text-tertiary">{timeStr}</span>
                            <span className="block text-[9px] text-red-400 font-medium">Booked</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => setSelectedTime(isSelected ? null : timeStr)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-primary-lime text-accent-text border-primary-lime font-black shadow-xs ring-2 ring-primary-lime/30"
                              : "bg-surface-raised hover:bg-surface-card border-border-subtle text-text-primary hover:border-primary-lime/50"
                          }`}
                        >
                          <span className="block text-xs font-bold">{timeStr}</span>
                          <span className={`block text-[9px] font-semibold ${isSelected ? "text-accent-text" : "text-emerald-500"}`}>
                            {isSelected ? "Selected" : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Action Banner on Slot Selection */}
                <AnimatePresence>
                  {selectedTime ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="p-3 rounded-xl bg-primary-lime/10 border border-primary-lime/30 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-lime text-accent-text flex items-center justify-center font-bold shadow-xs">
                          <Check size={16} strokeWidth={3} />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-text-primary">
                            {selectedDate} at {selectedTime} Selected
                          </span>
                          <span className="block text-[11px] text-text-secondary">
                            Rate: UGX {(turf.pricePerHour || 0).toLocaleString()} (Standard 1 hr match)
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={handleProceedToBooking}
                        className="px-4 py-2 bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all group"
                      >
                        <span>Continue Booking</span>
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="text-[11px] text-text-tertiary flex items-center gap-1.5 pt-1">
                      <Info size={13} className="text-primary-lime" />
                      <span>Click any green available slot above to lock in your match kickoff time.</span>
                    </div>
                  )}
                </AnimatePresence>
              </section>

              {/* 3. FACILITIES & AMENITIES SECTION (MODERN COMPACT ICONS & NAMES) */}
              <section id="amenities-section" className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/70 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-text-primary">
                      Facilities &amp; Amenities
                    </h2>
                    <span className="text-[10px] bg-primary-lime/10 border border-primary-lime/20 text-primary-lime font-bold px-2 py-0.5 rounded-full">
                      {(turf.amenities && turf.amenities.length > 0 ? turf.amenities : [
                        "7-a-side Certified Turf",
                        "Floodlights (Night Games)",
                        "Covered Spectator Pavilion",
                        "Shaded Player Dugouts",
                        "Clubhouse & Refreshments",
                        "Changing Rooms & Restrooms",
                        "Perimeter Safety Netting",
                        "Secure On-Site Parking",
                      ]).length} Included
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-lime">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    <span>Included in Booking</span>
                  </div>
                </div>

                {/* Vibrant Lively Icons - No Rectangular Boxes, Clean Centered Typography Below */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 sm:gap-x-4 gap-y-5 pt-3 justify-items-center">
                  {(turf.amenities && turf.amenities.length > 0 ? turf.amenities : [
                    "7-a-side Certified Turf",
                    "Floodlights (Night Games)",
                    "Covered Spectator Pavilion",
                    "Shaded Player Dugouts",
                    "Clubhouse & Refreshments",
                    "Changing Rooms & Restrooms",
                    "Perimeter Safety Netting",
                    "Secure On-Site Parking",
                  ]).map((amenityName, idx) => {
                    const meta = getAmenityMeta(amenityName);
                    const IconComp = meta.icon;
                    return (
                      <div
                        key={idx}
                        className="group flex flex-col items-center text-center p-1 cursor-default select-none transition-transform duration-200 hover:-translate-y-1 w-full max-w-[96px]"
                      >
                        {/* Lively Colored Icon Bubble */}
                        <div
                          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center mb-1.5 ${meta.bgColor} ${meta.iconColor} transition-all duration-200 group-hover:scale-110 shadow-xs ${meta.glowColor}`}
                        >
                          <IconComp size={22} strokeWidth={2.2} />
                        </div>
                        {/* Small, Understandable Typography Below */}
                        <span className="text-[11px] sm:text-xs font-semibold text-text-primary leading-tight text-center line-clamp-2 transition-colors group-hover:text-primary-lime">
                          {meta.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. ABOUT THE VENUE & MATCHDAY RULES */}
              <section className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4">
                <h2 className="text-sm sm:text-base font-extrabold text-text-primary pb-1.5 border-b border-border-subtle/70">
                  About {turf.name}
                </h2>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                  {turf.description ||
                    "Premium artificial football turf facility in Kampala engineered for high-tempo 5-a-side and 7-a-side matches. Equipped with professional floodlights for late evening play, shaded player dugouts, boundary netting, and dedicated parking."}
                </p>

                {/* Matchday Guidelines: Clean Summary with Modal Trigger */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-raised border border-border-subtle">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-text-primary">
                        Artificial turf footwear required · Free cancellation up to 24h prior
                      </span>
                      <span className="block text-[11px] text-text-tertiary">
                        Arrival 15 mins prior for check-in. Changing rooms, showers & lockers available.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPoliciesModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary shrink-0 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      View Venue Rules
                    </button>
                  </div>
                </div>
              </section>

              {/* 5. LOCATION & LANDMARK DIRECTIONS */}
              <section id="location-section" className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/70">
                  <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
                    <MapPin size={16} className="text-primary-lime" />
                    <span>Location &amp; Access</span>
                  </h2>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${turf.name} ${turf.location} Kampala Uganda`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-lime hover:underline"
                  >
                    <span>Google Maps</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-text-primary">{turf.name}</span>
                    <span className="block text-xs text-text-secondary">{turf.location}</span>
                    <span className="block text-[11px] text-text-tertiary">Accessible via main road with dedicated gated parking.</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${turf.name} ${turf.location} Kampala`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-primary-lime text-accent-text font-black text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs hover:bg-primary-lime-hover transition-colors"
                  >
                    <Compass size={14} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </section>

              {/* 6. PITCH MANAGER & ON-GROUND OPERATIONS */}
              <section className="bg-surface-card rounded-2xl p-3.5 sm:p-4 border border-border-subtle shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentManager.image}
                      alt={currentManager.name}
                      className="w-10 h-10 rounded-xl object-cover border border-border-subtle bg-surface-raised shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-text-primary truncate">{currentManager.name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          On Duty
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">{currentManager.role} · On-site Host</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setMessageSentSuccess(false);
                        setMessageText("");
                        setShowMessageModal(true);
                      }}
                      className="h-8 px-3 rounded-lg bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <MessageSquare size={13} />
                      <span>Message Host</span>
                    </button>
                    <a
                      href={`tel:${currentManager.phone}`}
                      className="h-8 w-8 rounded-lg bg-surface-raised hover:bg-surface-card border border-border-subtle text-text-primary flex items-center justify-center transition-colors cursor-pointer"
                      title={`Call ${currentManager.name}`}
                    >
                      <Phone size={13} className="text-primary-lime" />
                    </a>
                  </div>
                </div>
              </section>

              {/* 7. VERIFIED CUSTOMER REVIEWS */}
              <section id="reviews-section" className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle/70">
                  <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
                    <Star size={16} className="fill-[#FACC15] text-[#FACC15]" />
                    <span>Player Reviews &amp; Ratings</span>
                  </h2>
                  <span className="text-xs font-bold text-text-primary">
                    ★ {dynamicRating !== null && dynamicRating > 0 ? dynamicRating.toFixed(1) : (turf.rating || "4.9")} / 5.0
                  </span>
                </div>

                <TurfReviews
                  pitchId={turf.id}
                  onReviewAdded={async (avg, total) => {
                    setDynamicRating(avg);
                    setDynamicTotalReviews(total);
                    try {
                      await pitchService.update(turf.id, { rating: avg } as any);
                    } catch (err) {
                      console.error("Failed to update pitch rating", err);
                    }
                  }}
                />
              </section>
            </div>

            {/* RIGHT COLUMN: STICKY BOOKING CARD (DESKTOP) */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
              <div className="bg-surface-card rounded-3xl p-6 border border-border-subtle shadow-xl space-y-5">
                {/* Rate Header */}
                <div className="flex items-baseline justify-between gap-2 border-b border-border-subtle/70 pb-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">UGX</span>
                      <span className="text-2xl xl:text-3xl font-black text-primary-lime tracking-tight font-display">
                        {(turf.pricePerHour || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-text-secondary">/ hour</span>
                    </div>
                    <span className="text-[11px] text-text-tertiary">Standard pitch reservation</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-text-primary">
                    <Star size={13} className="fill-[#FACC15] text-[#FACC15]" />
                    <span>{dynamicRating !== null && dynamicRating > 0 ? dynamicRating.toFixed(1) : (turf.rating || "4.9")}</span>
                  </div>
                </div>

                {/* Booking Selection Box */}
                <div className="rounded-2xl border border-border-subtle bg-surface-raised/70 overflow-hidden divide-y divide-border-subtle">
                  <div
                    onClick={() => {
                      document.getElementById("availability-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="p-3.5 hover:bg-surface-raised cursor-pointer transition-colors"
                  >
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                      Match Date
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-text-primary">
                        {selectedDate === todayStr ? `Today (${selectedDate})` : selectedDate}
                      </span>
                      <CalendarIcon size={14} className="text-primary-lime" />
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      document.getElementById("availability-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="p-3.5 hover:bg-surface-raised cursor-pointer transition-colors"
                  >
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                      Match Time Slot
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs sm:text-sm font-bold ${selectedTime ? "text-primary-lime" : "text-text-secondary"}`}>
                        {selectedTime ? `${selectedTime} (1 Hour Match)` : "Select a time slot"}
                      </span>
                      <Clock size={14} className="text-primary-lime" />
                    </div>
                  </div>
                </div>

                {/* Match Cost Summary */}
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Pitch Rental (1 hr)</span>
                    <span className="font-mono text-text-primary font-bold">UGX {(turf.pricePerHour || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border-subtle pt-2.5 flex items-center justify-between text-sm font-black text-text-primary">
                    <span>Total Matchday Cost</span>
                    <span className="text-base text-primary-lime font-display">
                      UGX {(turf.pricePerHour || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-tertiary">
                    Includes pitch access, night floodlights &amp; changing rooms.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2.5 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.015, boxShadow: "0 10px 25px -5px rgba(168, 255, 0, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={handleProceedToBooking}
                    className="w-full py-3.5 bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary-lime/20 flex items-center justify-center gap-2 cursor-pointer transition-all group"
                  >
                    <span>{selectedTime ? "Reserve Selected Slot" : "Proceed to Booking"}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      setIsProposalModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary border border-border-subtle font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    title="Propose a friendly match challenge"
                  >
                    <Users size={14} className="text-primary-lime" />
                    <span>Propose Match Challenge</span>
                  </button>
                </div>

                {/* Booking Guarantees */}
                <div className="pt-2 border-t border-border-subtle/70 flex items-center justify-between text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-primary-lime" />
                    24h Reschedule
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Zap size={13} className="text-primary-lime" />
                    Instant Pass
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-primary-lime" />
                    FIFA Certified
                  </span>
                </div>

                {/* Manager Contact Link */}
                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setMessageSentSuccess(false);
                      setMessageText("");
                      setShowMessageModal(true);
                    }}
                    className="text-xs text-text-secondary hover:text-primary-lime font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>Need corporate or tournament pricing? Message manager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM ACTION BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-xl border-t border-border-subtle p-3 px-4 shadow-2xl safe-area-bottom">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">UGX</span>
                <span className="text-base sm:text-lg font-black text-primary-lime tracking-tight">
                  {(turf.pricePerHour || 0).toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary">/hr</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-text-tertiary truncate">
                <Star size={11} className="fill-[#FACC15] text-[#FACC15]" />
                <span className="font-bold text-text-primary">{dynamicRating?.toFixed(1) || "4.9"}</span>
                <span>· {selectedTime ? selectedTime : "Select slot"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (!user) {
                    navigate("/auth");
                    return;
                  }
                  setIsProposalModalOpen(true);
                }}
                className="px-3 py-2.5 bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle font-bold text-xs rounded-xl transition-all"
              >
                Match
              </button>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(168, 255, 0, 0.3)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={handleProceedToBooking}
                className="px-4 sm:px-5 py-2.5 bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-primary-lime/20 flex items-center gap-1.5 transition-all group"
              >
                <span>{selectedTime ? "Book Slot" : "Book Now"}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* LIGHTBOX MODAL */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer z-10 transition-colors"
                title="Close gallery"
              >
                <X size={20} />
              </button>

              <div className="relative w-full aspect-[16/10] max-h-[75vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={galleryImages[currentImgIndex] || primaryPhoto}
                  alt={`${turf.name} photo ${currentImgIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Previous"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                      title="Next"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              <div className="w-full flex items-center justify-between text-white text-xs mt-3 px-2">
                <span className="font-bold">{turf.name}</span>
                <span>Photo {currentImgIndex + 1} of {galleryImages.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* PROPOSE MATCH CHALLENGE MODAL */}
        <CreateMatchProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          currentUser={
            user
              ? {
                  id: user.uid,
                  email: user.email || "",
                  name: userProfile?.name || user.displayName || "Player",
                  phone: userProfile?.phone || "",
                  role: ((userProfile?.role as any)?.toUpperCase() || "PLAYER") as "PLAYER" | "OWNER" | "ADMIN" | "CARETAKER",
                  status: "ACTIVE",
                  photoURL: user.photoURL || undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : null
          }
          preselectedPitchId={turf.id}
          preselectedPitchName={turf.name}
          onProposalCreated={() => {
            navigate("/invitations");
          }}
        />

        {/* MESSAGE PITCH OWNER / MANAGER MODAL */}
        {showMessageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            onClick={() => setShowMessageModal(false)}
          >
            <div
              className="relative max-w-lg w-full bg-surface-card rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-border-subtle bg-surface-raised shadow-xs">
                    <img
                      src={currentManager.image}
                      alt={currentManager.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300";
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-surface-card" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-extrabold text-text-primary">
                        {currentManager.name}
                      </h3>
                      <div className="w-3.5 h-3.5 rounded-full bg-primary-lime text-accent-text flex items-center justify-center shrink-0">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {currentManager.role} · <strong className="text-text-primary font-semibold">{turf.name}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMessageModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary bg-surface-raised hover:bg-border-subtle cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {messageSentSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-text-primary">
                      Message Delivered to Manager!
                    </h4>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mt-1">
                      Your message has been sent directly to {currentManager.name}'s manager inbox.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    {activeConversationId && (
                      <button
                        onClick={() => {
                          setShowMessageModal(false);
                          navigate(`/chat/${activeConversationId}`);
                        }}
                        className="px-4 py-2 bg-primary-lime text-accent-text font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <MessageSquare size={13} />
                        <span>Open Live Chat</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 bg-surface-raised text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
                      Quick Matchday Inquiries
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {[
                        "Is the pitch available for corporate tournament booking?",
                        "Can we get extra training bibs and 2 match balls?",
                        "Are floodlights and locker facilities in full operation?",
                        "Inquiry on recurring weekly league reservation rates."
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          onClick={() => setMessageText(promptText)}
                          className={`text-left p-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                            messageText === promptText
                              ? "bg-primary-lime/10 border-primary-lime text-primary-lime"
                              : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-prominent"
                          }`}
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Write a direct inquiry to ${currentManager.name}...`}
                      rows={4}
                      className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-2xl p-3 text-xs text-text-primary placeholder:text-text-tertiary outline-none resize-none leading-relaxed transition-all"
                    />
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-1 px-1">
                      <span>Delivered directly to manager dashboard inbox</span>
                      <span>{messageText.length}/500</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2.5 bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isSendingMessage || !messageText.trim()}
                      onClick={handleSendMessageToOwner}
                      className="px-5 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary-lime/20 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {isSendingMessage ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      <span>Send to Manager</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT MODAL */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType={ReportTargetType.PITCH}
          targetId={turf.id}
          reporterRole="player"
        />

        {/* VENUE POLICIES & MATCHDAY RULES MODAL */}
        {showPoliciesModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            onClick={() => setShowPoliciesModal(false)}
          >
            <div
              className="relative max-w-md w-full bg-surface-card rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/25">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-text-primary">
                      Venue Rules &amp; Guidelines
                    </h3>
                    <p className="text-xs text-text-secondary truncate">{turf.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPoliciesModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-text-secondary leading-relaxed">
                <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
                  <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary-lime shrink-0" />
                    Footwear &amp; Pitch Gear
                  </span>
                  <p>
                    AstroTurf shoes (multi-stud rubber soles) or moulded FG studs permitted. Metal screw-in studs or flat street shoes are strictly banned.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
                  <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary-lime shrink-0" />
                    Free Cancellation &amp; Reschedule
                  </span>
                  <p>
                    Cancel or reschedule without fee up to 24 hours prior to match kickoff. Full refund credited to your original payment method.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
                  <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary-lime shrink-0" />
                    Arrival &amp; Gate Check-In
                  </span>
                  <p>
                    Please arrive 15 minutes before your time slot. Present your digital ticket QR code or 6-digit match pass to ground staff for gate access.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle space-y-1">
                  <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary-lime shrink-0" />
                    Facilities &amp; Changing Rooms
                  </span>
                  <p>
                    Complimentary access to secure changing rooms, showers, and shaded player dugouts. Floodlights are maintained until 23:00 daily.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPoliciesModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs cursor-pointer transition-colors shadow-2xs"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TurfDetail;
