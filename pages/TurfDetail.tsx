import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  CheckCircle2, ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Lock,
  AlertCircle,
  Zap,
  Home,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { chatService } from "../services/chatService";
import { MessageSquare, Upload, AlertTriangle, Smartphone, Banknote, ShieldCheck, Copy, Hourglass, Phone, Send } from "lucide-react";
import { pitchService } from "../services/pitchService";
import { Pitch, SlotAvailability, Booking } from "../types/firebase";
import { Turf, ReportTargetType, BookingStatus } from "../types";
import { TURFS } from "../constants";
import { ReportModal } from "../components/ReportModal";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { TurfImageGallery } from "../components/TurfImageGallery";
import { TurfDetailSkeleton, Skeleton } from "../components/ui/Skeleton";
import { TurfReviews } from "../components/TurfReviews";
import { reviewService } from "../services/reviewService";
import { CreateMatchProposalModal } from "../components/invitations/CreateMatchProposalModal";
import { Logo } from "../components/Logo";
import { Layout } from "../components/Layout";

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
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Message Pitch Owner/Manager state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

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

  const normalizedId = id?.replace(/^pitch-/, "") || "";
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
    : turfs.find((t) => t.id === id || t.id === normalizedId || `pitch-${t.id}` === id) ||
      TURFS.find((t) => t.id === id || t.id === normalizedId || `pitch-${t.id}` === id);

  const DEMO_GALLERY_FALLBACKS = [
    { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80", label: "Full Pitch Arena" },
    { url: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80", label: "Floodlit Night View" },
    { url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80", label: "Goalpost & Net" },
    { url: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80", label: "Match Action" },
    { url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80", label: "Spectator Pavilion & Dugout" },
  ];

  const galleryImages = React.useMemo(() => {
    // If realPitch exists and has images, use them directly so updated pitch photos show at the top immediately
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
  }, [realPitch, turf]);

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
  }, [id]);

  const handleReviewsLoaded = (avg: number, total: number) => {
    setDynamicRating(avg);
    setDynamicTotalReviews(total);
  };

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
    }
  };

  const pitchKey = turf?.id || normalizedId || id || "";
  const matchedManager = PITCH_MANAGERS[pitchKey] || 
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

  const handleMessageOwner = async () => {
    if (!user) {
      showToast("Please login to message the owner.", "info");
      return;
    }
    const targetOwnerId = currentManager.ownerId || turf?.ownerId || "owner_facility_default";
    if (targetOwnerId === user.uid) {
      showToast("This is your pitch!", "info");
      return;
    }
    try {
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
      navigate(`/chat/${convId}`);
    } catch (error) {
      console.error("Failed to start chat with owner", error);
      showToast("Failed to start chat.", "error");
    }
  };

  if (contextLoading || loadingPitch) {
    return <TurfDetailSkeleton />;
  }

  if (!turf || ((turf.status as string) !== "ACTIVE" && (turf.status as string) !== "approved"))
    return (
      <div className="flex flex-col min-h-full items-center justify-center bg-[#F3F3F3] dark:bg-app-base p-4 text-center px-4">
        <h2 className="text-h2 font-display font-semibold text-accent-text dark:text-white mb-2">
          Pitch Not Available
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
          This pitch is either not available or is currently pending review by administrators.
        </p>
        <Button
          onClick={() => navigate("/home")}
          variant="secondary"
        >
          Return Home
        </Button>
      </div>
    );

  return (
    <Layout>
      <div className="bg-app-base text-text-primary font-sans pb-32 min-h-full transition-colors relative">
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

        {/* HERO BANNER & ABSOLUTE HEADER */}
        <div className="relative w-full h-[400px] sm:h-[480px] overflow-hidden bg-surface-card" id="turf-hero-banner">
          <TurfImageGallery 
            images={galleryImages} 
            name={turf.name} 
            showMaximize={true}
            showPageCounter={true}
            showThumbnails={false}
            selectedIndex={currentImgIndex}
            wrapperClassName="h-full w-full"
            className="h-full w-full rounded-none border-none bg-surface-card"
            onIndexChange={setCurrentImgIndex}
          />

          {/* Absolute Top Navigation Over Image */}
          <button
            onClick={() => {
              if (location.state && (location.state as any).from === 'explore') {
                navigate('/explore-map');
              } else if (location.state && (location.state as any).from === 'bookings') {
                navigate('/bookings');
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate("/home");
              }
            }}
            className="absolute top-4 left-4 sm:left-6 w-11 h-11 rounded-full bg-app-base/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-text-primary hover:bg-app-base/80 transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime cursor-pointer shadow-sm"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>

          <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2 z-20">
            <button
              onClick={() => navigate("/home")}
              className="w-11 h-11 rounded-full bg-app-base/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-text-primary hover:bg-app-base/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime cursor-pointer shadow-sm"
              title="Return to Home"
              aria-label="Return to Home"
            >
              <Home size={18} />
            </button>
            <button 
              onClick={toggleFavorite}
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime cursor-pointer shadow-sm active:scale-95 ${
                isFavorite
                  ? "bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30"
                  : "bg-app-base/60 border-white/20 text-text-primary hover:bg-app-base/80"
              }`}
              title={isFavorite ? "Remove from favorites" : "Favorite facility"}
              aria-label={isFavorite ? "Remove from favorites" : "Favorite facility"}
            >
              <Heart 
                size={20} 
                className={isFavorite ? "fill-red-500 text-red-500" : "text-text-primary hover:text-primary-lime"} 
              />
            </button>
          </div>

          {/* Floating Stats Pill */}
          <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 bg-surface-card/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3.5 shadow-lg border border-border-subtle">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-text-primary">
              <Heart size={13} className="fill-text-primary" /> 2.5k
            </div>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-text-primary">
              <span className="material-symbols-outlined text-[15px] text-text-primary">visibility</span> 50k
            </div>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-text-primary">
              <Sparkles size={13} className="fill-text-primary" /> 750
            </div>
          </div>
        </div>

        {/* OVERLAPPING MAIN CONTENT */}
        <main className="relative -mt-6 bg-app-base rounded-t-[24px] p-4 max-w-4xl mx-auto space-y-4 z-30">
          
          {/* Title & Location Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary leading-tight tracking-tight">
                {turf.name}
              </h1>
              <div className="w-4 h-4 rounded-full bg-primary-lime text-accent-text flex items-center justify-center shrink-0" title="Verified Facility">
                <Check size={10} strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-text-secondary">
              <div className="flex items-center gap-1 text-text-secondary min-w-0">
                <MapPin size={14} className="text-primary-lime shrink-0" />
                <span className="truncate">{turf.location}</span>
              </div>
              <button 
                onClick={() => setActiveTab("reviews")}
                className="flex items-center gap-1 hover:text-text-primary transition-colors cursor-pointer shrink-0"
                title="View reviews"
              >
                <Star size={14} className="fill-[#FACC15] text-[#FACC15]" />
                <span className="font-bold text-text-primary">
                  {dynamicRating !== null && dynamicRating > 0 ? dynamicRating.toFixed(1) : (turf.rating || "4.9")}
                </span>
                {dynamicTotalReviews !== null && dynamicTotalReviews > 0 && (
                  <span className="text-[11px] text-text-secondary">({dynamicTotalReviews})</span>
                )}
              </button>
            </div>
          </div>

          
        {/* TAB NAVIGATION WITH PROMINENT RATE DISPLAY */}
        <div className="flex items-center justify-between border-b border-border-subtle pt-1 pb-1 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-5 sm:gap-6">
            <button 
              onClick={() => setActiveTab("about")}
              className={`pb-2 text-[13px] sm:text-[14px] font-bold transition-colors border-b-2 cursor-pointer ${
                activeTab === 'about' 
                  ? 'text-text-primary border-primary-lime' 
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              About Pitch
            </button>
            <button 
              onClick={() => setActiveTab("reviews")}
              className={`pb-2 text-[13px] sm:text-[14px] font-bold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews' 
                  ? 'text-text-primary border-primary-lime' 
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              <span>Reviews</span>
              {dynamicTotalReviews !== null && dynamicTotalReviews > 0 && (
                <span className="text-[11px] bg-surface-raised border border-border-subtle text-text-primary px-1.5 py-0.2 rounded-full font-bold">
                  {dynamicTotalReviews}
                </span>
              )}
            </button>
          </div>

          {/* Prominent Large Hourly Rate Display */}
          <div className="flex items-baseline gap-1 bg-surface-card px-3 py-1 rounded-xl border border-border-subtle shrink-0 mb-1">
            <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">UGX</span>
            <span className="text-xl sm:text-2xl font-black text-primary-lime tracking-tight">
              {(turf.pricePerHour || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-text-secondary">/hr</span>
          </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "about" ? (
          <div className="space-y-5 pb-20">
            {/* Details Gray Box Grid */}
            <section id="pitch-details-grid-section" aria-label="Details Grid" className="bg-surface-card p-4 rounded-xl space-y-2.5 shadow-sm border border-border-subtle scroll-mt-24">
              <h2 id="heading-pitch-details" className="text-[13px] font-bold text-text-primary px-1 scroll-mt-24">Details</h2>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Size */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-primary-lime" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">Size</span>
                    <span className="block text-[13px] font-semibold text-text-primary">{turf.type || "5-a-side"}</span>
                  </div>
                </div>
                
                {/* Capacity */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-primary-lime">groups</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">Capacity</span>
                    <span className="block text-[13px] font-semibold text-text-primary">
                      {turf.type?.includes("5") ? "10 Players" : turf.type?.includes("11") ? "22 Players" : "14 Players"}
                    </span>
                  </div>
                </div>
                
                {/* Surface Type */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-primary-lime" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">Surface</span>
                    <span className="block text-[13px] font-semibold text-text-primary">AstroTurf</span>
                  </div>
                </div>
                
                {/* Floodlights */}
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                    <Lightbulb size={14} className="text-primary-lime" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">Lights</span>
                    <span className="block text-[13px] font-semibold text-text-primary">Floodlit</span>
                  </div>
                </div>
              </div>
            </section>
            
            {/* COMPACT FACILITIES / DESCRIPTION SECTION */}
            <section id="pitch-facilities-section" className="space-y-1 pt-0.5 px-1 scroll-mt-24">
              <h2 id="heading-facilities-amenities" className="text-xs font-bold text-text-tertiary uppercase tracking-wider scroll-mt-24">Facilities &amp; Amenities</h2>
              <p className="text-[11.5px] text-text-secondary leading-relaxed font-normal">
                {turf.description || "Premium certified AstroTurf pitch with high-fidelity floodlights, spectator benches, secure parking, and clean locker amenities."}
              </p>
            </section>

            {/* PITCH PHOTO GALLERY & ANGLES */}
            <section id="pitch-gallery-section" className="space-y-2 pt-1 px-1 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h2 id="heading-pitch-gallery" className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 scroll-mt-24">
                  <span>Pitch Gallery</span>
                  <span className="text-[10px] bg-surface-card border border-border-subtle text-primary-lime px-2 py-0.5 rounded-full font-bold">
                    {galleryImages.length} Photos
                  </span>
                </h2>
                <span className="text-[11px] text-text-tertiary font-medium">Tap photo to inspect</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => {
                  const fallbackLabel = DEMO_GALLERY_FALLBACKS[idx]?.label 
                    || (idx === 0 ? "Main Pitch" : idx === 1 ? "Goalmouth & Box" : idx === 2 ? "Floodlights" : idx === 3 ? "Touchline Angle" : idx === 4 ? "Pavilion View" : `Angle ${idx + 1}`);
                  const isSelected = currentImgIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentImgIndex(idx);
                        // Smoothly scroll to top hero banner for full view
                        document.getElementById("turf-hero-banner")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer group text-left ${
                        isSelected 
                          ? "border-primary-lime ring-2 ring-primary-lime/40 scale-[1.02] shadow-md shadow-primary-lime/20" 
                          : "border-border-subtle hover:border-text-secondary opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`${turf.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = DEMO_GALLERY_FALLBACKS[0].url;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[9.5px] font-bold text-white leading-tight truncate">
                          {fallbackLabel}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary-lime text-accent-text rounded-full flex items-center justify-center shadow-sm">
                          <Check size={9} strokeWidth={3.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
            
            {/* HOST / PITCH MANAGER SECTION */}
            <section id="pitch-manager-section" className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs space-y-3 scroll-mt-24">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                  Pitch Manager & On-Ground Operations
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/25 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>On Duty</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-border-subtle shadow-sm bg-surface-raised">
                    <img 
                      src={currentManager.image} 
                      alt={currentManager.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300";
                      }} 
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-surface-card" />
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-text-primary truncate">
                        {currentManager.name}
                      </span>
                      <div className="w-3.5 h-3.5 rounded-full bg-primary-lime text-accent-text flex items-center justify-center shrink-0" title="Verified Facility Manager">
                        <Check size={9} strokeWidth={4} />
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary font-medium truncate mt-0.5">
                      {currentManager.role}
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">
                      {currentManager.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      setMessageSentSuccess(false);
                      setMessageText("");
                      setShowMessageModal(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="Send message to pitch owner/manager"
                  >
                    <MessageSquare size={14} />
                    <span>Message</span>
                  </button>

                  <a 
                    href={`tel:${currentManager.phone}`}
                    className="w-9 h-9 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    title={`Call ${currentManager.name}`}
                  >
                    <Phone size={14} className="text-primary-lime" />
                  </a>
                </div>
              </div>

              {currentManager.bio && (
                <p className="text-xs text-text-secondary bg-surface-raised/70 rounded-xl p-2.5 border border-border-subtle leading-relaxed">
                  {currentManager.bio}
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* REVIEWS SECTION */}
            <section id="pitch-reviews-section" className="pt-2 scroll-mt-24">
              <TurfReviews 
                pitchId={turf.id} 
                onReviewAdded={async (avg, total) => {
                  setDynamicRating(avg);
                  setDynamicTotalReviews(total);
                  
                  // Update the pitch document to store aggregated rating
                  try {
                    await pitchService.update(turf.id, { rating: avg } as any);
                  } catch (err) {
                    console.error("Failed to update pitch rating", err);
                  }
                }} 
              />
            </section>
          </div>
        )}
</main>
      {/* Main Page Persistent "Book Now" & "Propose Match" Action Bar */}
      <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-40 flex items-center gap-2.5">
        <button
          onClick={() => {
            if (!user) {
              navigate('/auth');
              return;
            }
            setIsProposalModalOpen(true);
          }}
          className="flex-1 py-3.5 sm:py-4 bg-surface-card hover:bg-surface-raised text-text-primary border border-border-subtle font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-md active:scale-[0.98] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          title="Propose a match and invite players for free before reserving"
        >
          <span className="material-symbols-outlined text-[18px] text-primary-lime">groups</span>
          <span>Propose Match</span>
        </button>

        <button
          onClick={() => navigate(`/turf/${turf.id}/book`)}
          className="flex-1 py-3.5 sm:py-4 bg-primary-lime hover:bg-[#B2FF1A] text-accent-text font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(168,255,0,0.25)] active:scale-[0.98] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
        >
          <span>Book Now</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <CreateMatchProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        currentUser={
          user
            ? {
                id: user.uid,
                email: user.email || '',
                name: userProfile?.name || user.displayName || 'Player',
                phone: userProfile?.phone || '',
                role: ((userProfile?.role as any)?.toUpperCase() || 'PLAYER') as 'PLAYER' | 'OWNER' | 'ADMIN' | 'CARETAKER',
                status: 'ACTIVE',
                photoURL: user.photoURL || undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : null
        }
        preselectedPitchId={turf.id}
        preselectedPitchName={turf.name}
        onProposalCreated={() => {
          navigate('/invitations');
        }}
      />

      {/* Interactive Message Pitch Manager / Owner Modal */}
      {showMessageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowMessageModal(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-surface-card rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-border-subtle bg-surface-raised shadow-xs">
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
                    Message Delivered to Inbox!
                  </h4>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto mt-1">
                    Your message has been sent directly to {currentManager.name}'s manager inbox. They will respond shortly.
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
                {/* Fast Inquiries / Presets */}
                <div>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">
                    Quick Matchday Inquiries
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {[
                      "Is the pitch available for evening booking?",
                      "Can we get 2 match balls and training bibs?",
                      "Are floodlights and changing rooms operational?",
                      "Inquiry on corporate tournament slot rates."
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

                {/* Text Area */}
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
                    <span>Delivered directly to owner's dashboard inbox</span>
                    <span>{messageText.length}/500</span>
                  </div>
                </div>

                {/* Send Button */}
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
                    <span>Send to Owner</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType={ReportTargetType.PITCH}
        targetId={turf.id}
        reporterRole="player"
      />
    </div>
    </Layout>
  );
};

export default TurfDetail;
