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
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { chatService } from "../services/chatService";
import { MessageSquare, Upload, AlertTriangle, Smartphone, Banknote, ShieldCheck, Copy, Hourglass } from "lucide-react";
import { pitchService } from "../services/pitchService";
import { Pitch, SlotAvailability, Booking } from "../types/firebase";
import { Turf, ReportTargetType, BookingStatus } from "../types";
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

  const turf: Turf | undefined = realPitch
    ? {
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
      }
    : turfs.find((t) => t.id === id);

  const DEMO_GALLERY_FALLBACKS = [
    { url: "https://images.unsplash.com/photo-1529900245534-47fbf59f4820?auto=format&fit=crop&w=1200&q=80", label: "Full Pitch Arena" },
    { url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80", label: "Floodlit Night View" },
    { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80", label: "Turf Surface Quality" },
    { url: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80", label: "Goalpost & Net" },
    { url: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80", label: "Spectator Pavilion" },
  ];

  const galleryImages = React.useMemo(() => {
    const customImgs = [
      ...(realPitch?.images || []),
      ...(turf?.image ? [turf.image] : []),
      ...(turf?.additionalImages || [])
    ].filter((img, idx, self) => img && self.indexOf(img) === idx);

    const fallbacks = DEMO_GALLERY_FALLBACKS.map(f => f.url);
    const combined = [...customImgs];
    fallbacks.forEach(url => {
      if (!combined.includes(url) && combined.length < 5) {
        combined.push(url);
      }
    });

    return combined.length > 0 ? combined : fallbacks;
  }, [realPitch, turf]);

  useEffect(() => {
    const fetchPitch = async () => {
      if (!id) return;
      setLoadingPitch(true);
      try {
        const p = await pitchService.getById(id);
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

  const handleMessageOwner = async () => {
    if (!user) {
      alert("Please login to message the owner.");
      return;
    }
    if (!turf || !turf.ownerId) {
      alert("Owner information not available.");
      return;
    }
    if (turf.ownerId === user.uid) {
      alert("This is your pitch!");
      return;
    }
    try {
      const convId = await chatService.getOrCreateDirectConversation(
        user.uid,
        turf.ownerId,
      );
      navigate(`/chat/${convId}`);
    } catch (error) {
      console.error("Failed to start chat with owner", error);
      alert("Failed to start chat.");
    }
  };

  if (contextLoading || loadingPitch) {
    return <TurfDetailSkeleton />;
  }

  if (!turf || ((turf.status as string) !== "ACTIVE" && (turf.status as string) !== "approved"))
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-[#F3F3F3] dark:bg-app-base p-4 text-center px-4">
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
      <div className="bg-app-base text-text-primary font-sans pb-32 min-h-[100dvh] transition-colors relative">
        {/* HERO BANNER & ABSOLUTE HEADER */}
        <div className="relative w-full h-[400px] sm:h-[480px] overflow-hidden" id="turf-hero-banner">
          <TurfImageGallery 
            images={galleryImages} 
            name={turf.name} 
            showMaximize={true}
            showPageCounter={true}
            showThumbnails={false}
            selectedIndex={currentImgIndex}
            className="h-full w-full rounded-none border-none bg-surface-card"
            onIndexChange={setCurrentImgIndex}
          />

          {/* Absolute Top Navigation Over Image */}
          <button
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate("/home");
              }
            }}
            className="absolute top-4 left-4 sm:left-6 w-11 h-11 rounded-full bg-app-base/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-text-primary hover:bg-app-base/80 transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime cursor-pointer shadow-sm"
            aria-label="Go back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-3 z-20">
            <button 
              onClick={() => alert("Added to favorites!")}
              className="w-11 h-11 rounded-full bg-app-base/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-text-primary hover:bg-app-base/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime cursor-pointer shadow-sm"
              title="Favorite facility"
            >
              <Heart size={20} className="text-text-primary hover:text-primary-lime" />
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
            <section aria-label="Details Grid" className="bg-surface-card p-4 rounded-xl space-y-2.5 shadow-sm border border-border-subtle">
              <h2 className="text-[13px] font-bold text-text-primary px-1">Details</h2>
              
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
            <section className="space-y-1 pt-0.5 px-1">
              <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Facilities &amp; Amenities</h2>
              <p className="text-[11.5px] text-text-secondary leading-relaxed font-normal">
                {turf.description || "Premium certified AstroTurf pitch with high-fidelity floodlights, spectator benches, secure parking, and clean locker amenities."}
              </p>
            </section>

            {/* PITCH PHOTO GALLERY & ANGLES */}
            <section className="space-y-2 pt-1 px-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pitch Gallery</span>
                  <span className="text-[10px] bg-surface-card border border-border-subtle text-primary-lime px-2 py-0.5 rounded-full font-bold">
                    {galleryImages.length} Photos
                  </span>
                </h2>
                <span className="text-[11px] text-text-tertiary font-medium">Tap photo to inspect</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => {
                  const fallbackLabel = DEMO_GALLERY_FALLBACKS[idx]?.label || `View ${idx + 1}`;
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
            
            {/* HOST / AGENT SECTION */}
            <section className="flex items-center justify-between pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border-subtle shadow-sm">
                  <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80" alt="Agent" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold text-text-primary">Pitch Manager</span>
                    <div className="w-3 h-3 rounded-full bg-primary-lime text-accent-text flex items-center justify-center">
                      <Check size={8} strokeWidth={4} />
                    </div>
                  </div>
                  <span className="text-[11px] text-text-secondary font-medium">Property Agent</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-surface-card shadow-sm border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer">
                  <MessageSquare size={14} className="text-text-primary" />
                </button>
                <button className="w-9 h-9 rounded-full bg-primary-lime text-accent-text shadow-sm flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* REVIEWS SECTION */}
            <section className="pt-2">
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
