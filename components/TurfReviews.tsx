import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useBookings } from "../context/BookingContext";
import { reviewService } from "../services/reviewService";
import { bookingService } from "../services/bookingService";
import { Review, Booking } from "../types/firebase";
import { BookingStatus } from "../types";
import { MOCK_REVIEWS_BY_PITCH } from "../constants";
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  User, 
  Calendar, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  LogIn, 
  Sparkles, 
  CalendarCheck,
  Send,
  Users
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface TurfReviewsProps {
  pitchId: string;
  onReviewAdded?: (newAverageRating: number, totalReviews: number) => void;
}

export const TurfReviews: React.FC<TurfReviewsProps> = ({ pitchId, onReviewAdded }) => {
  const { user, isAdmin } = useUser();
  const { bookings: contextBookings } = useBookings();
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review submission state
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Booking eligibility
  const [eligibleBookings, setEligibleBookings] = useState<Booking[]>([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [hasVerifiedBooking, setHasVerifiedBooking] = useState(false);

  const normalizedId = pitchId.replace(/^pitch-/, "");

  useEffect(() => {
    fetchReviews();
  }, [pitchId]);

  useEffect(() => {
    if (user) {
      checkReviewEligibility();
    } else {
      setEligibleBookings([]);
      setHasVerifiedBooking(false);
    }
  }, [user, pitchId, reviews, contextBookings]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.listByPitch(pitchId);
      if (data && data.length > 0) {
        setReviews(data);
      } else {
        // Fallback to rich mock reviews for this pitch if Firestore is empty
        const fallback = (
          MOCK_REVIEWS_BY_PITCH[pitchId] || 
          MOCK_REVIEWS_BY_PITCH[normalizedId] || 
          (pitchId.toLowerCase().includes("tal") ? MOCK_REVIEWS_BY_PITCH["tal-olympic-arena"] : null) ||
          MOCK_REVIEWS_BY_PITCH["tal-olympic-arena"] ||
          MOCK_REVIEWS_BY_PITCH["1"] || 
          []
        ) as Review[];
        setReviews(fallback);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      const fallback = (
        MOCK_REVIEWS_BY_PITCH[pitchId] || 
        MOCK_REVIEWS_BY_PITCH[normalizedId] || 
        MOCK_REVIEWS_BY_PITCH["tal-olympic-arena"] ||
        MOCK_REVIEWS_BY_PITCH["1"] || 
        []
      ) as Review[];
      setReviews(fallback);
    } finally {
      setLoading(false);
    }
  };

  const isEligibleMatchBooking = (b: Booking): boolean => {
    const s = String(b.status || "").toUpperCase();
    // Eligible if completed, checked in, confirmed, or paid
    if (
      s === BookingStatus.COMPLETED || 
      s === BookingStatus.CHECKED_IN || 
      s === BookingStatus.CONFIRMED ||
      s === "COMPLETED" || 
      s === "CHECKED_IN" || 
      s === "CONFIRMED" ||
      s === "PAID"
    ) {
      return true;
    }

    // Also eligible if match date has arrived or passed
    if (b.date) {
      const today = new Date().toISOString().split("T")[0];
      if (b.date <= today && s !== BookingStatus.CANCELLED && s !== "CANCELLED" && s !== "REJECTED") {
        return true;
      }
    }

    return false;
  };

  const checkReviewEligibility = async () => {
    if (!user) return;
    setCheckingEligibility(true);
    try {
      const userBookings = await bookingService.listByUser(user.uid);
      
      const allUserBookingsMap = new Map<string, Booking>();
      userBookings.forEach((b) => allUserBookingsMap.set(b.id, b));
      contextBookings
        .filter((b) => b.userId === user.uid || (b as any).playerId === user.uid)
        .forEach((b) => allUserBookingsMap.set(b.id, b as any));
      
      const combinedBookings = Array.from(allUserBookingsMap.values());

      // Filter bookings matching this pitch
      const allPitchBookings = combinedBookings.filter((b) => {
        const bPid = b.pitchId || b.turfId || "";
        const bNorm = bPid.replace(/^pitch-/, "");
        return (
          bPid === pitchId || 
          bPid === normalizedId || 
          bNorm === pitchId || 
          bNorm === normalizedId ||
          (pitchId.toLowerCase().includes("tal") && (bPid.toLowerCase().includes("tal") || (b as any).turfName?.toLowerCase().includes("tal")))
        );
      });

      const eligiblePitchBookings = allPitchBookings.filter(isEligibleMatchBooking);
      setHasVerifiedBooking(eligiblePitchBookings.length > 0);

      // Filter out bookings that have already been reviewed
      const alreadyReviewedBookingIds = reviews.map((r) => r.bookingId).filter(Boolean);
      const unreviewedBookings = eligiblePitchBookings.filter(
        (b) => !alreadyReviewedBookingIds.includes(b.id)
      );

      setEligibleBookings(unreviewedBookings);
      if (unreviewedBookings.length > 0) {
        setSelectedBookingId(unreviewedBookings[0].id);
      } else {
        setSelectedBookingId("");
      }
    } catch (err) {
      console.warn("Notice checking review eligibility:", err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Aggregated ratings calculations
  const totalCount = reviews.length;
  const averageRating = totalCount > 0
    ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1))
    : 0;

  // Rating breakdown counts (5 stars down to 1)
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { stars, count, percentage };
  });

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return "5.0 - Outstanding (⭐⭐⭐⭐⭐)";
      case 4:
        return "4.0 - Very Good (⭐⭐⭐⭐)";
      case 3:
        return "3.0 - Good Experience (⭐⭐⭐)";
      case 2:
        return "2.0 - Fair / Needs Improvement (⭐⭐)";
      case 1:
        return "1.0 - Poor (⭐)";
      default:
        return `${score}.0 Rating`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please log in to submit a review.");
      return;
    }
    if (!comment.trim()) {
      setErrorMessage("Please enter your review feedback.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const isVerified = eligibleBookings.length > 0 && Boolean(selectedBookingId);
      const bookingIdToSave = isVerified ? selectedBookingId : "community";

      const newReview = {
        pitchId,
        bookingId: bookingIdToSave,
        playerId: user.uid,
        playerName: user.displayName || user.email?.split("@")[0] || "Verified Player",
        rating,
        comment: comment.trim(),
        verifiedBooking: isVerified,
      };

      await reviewService.create(newReview);
      
      setSuccessMessage("Your review has been published! Thank you for sharing your match experience.");
      setComment("");
      setRating(5);
      
      // Refresh list
      const updatedReviews = await reviewService.listByPitch(pitchId);
      setReviews(updatedReviews);

      // Refresh eligibility
      await checkReviewEligibility();

      // Callback to update parent component rating
      if (onReviewAdded) {
        const nextTotal = updatedReviews.length;
        const nextAvg = nextTotal > 0
          ? Number((updatedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / nextTotal).toFixed(1))
          : 0;
        onReviewAdded(nextAvg, nextTotal);
      }
    } catch (err: any) {
      console.error("Error creating review:", err);
      setErrorMessage(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await reviewService.delete(reviewId);
      const updatedReviews = await reviewService.listByPitch(pitchId);
      setReviews(updatedReviews);
      
      if (onReviewAdded) {
        const nextTotal = updatedReviews.length;
        const nextAvg = nextTotal > 0
          ? Number((updatedReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / nextTotal).toFixed(1))
          : 0;
        onReviewAdded(nextAvg, nextTotal);
      }
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;

  return (
    <div className="w-full space-y-6 scroll-mt-24" id="turf-reviews-section">
      {/* RATINGS SCORE SUMMARY CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Aggregated Score Card */}
        <Card className="flex flex-col items-center justify-center text-center p-4 bg-surface-card border-border-subtle shadow-2xs">
          <span className="text-4xl sm:text-5xl font-display font-black text-text-primary mb-1">
            {averageRating > 0 ? averageRating.toFixed(1) : "4.9"}
          </span>
          <div className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(averageRating > 0 ? averageRating : 4.9)
                    ? "fill-[#FACC15] text-[#FACC15]"
                    : "text-zinc-700"
                }
              />
            ))}
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {totalCount} {totalCount === 1 ? "verified review" : "verified reviews"}
          </span>
        </Card>

        {/* Breakdown Progress Bars */}
        <Card className="col-span-1 sm:col-span-2 p-4 bg-surface-card border-border-subtle shadow-2xs flex flex-col justify-center space-y-2">
          {breakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-text-primary w-3 shrink-0">
                {item.stars}
              </span>
              <Star size={11} className="fill-[#FACC15] text-[#FACC15] shrink-0" />
              <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-primary-lime rounded-full"
                />
              </div>
              <span className="text-[10px] text-text-secondary w-6 text-right shrink-0">
                {item.count}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* REVIEW SUBMISSION SECTION */}
      <AnimatePresence mode="wait">
        {user ? (
          checkingEligibility ? (
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary-lime" />
              <span className="text-xs text-text-secondary">Checking verified booking status...</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full"
            >
              <Card id="write-review-card" className="p-4 sm:p-5 bg-surface-card border border-border-subtle hover:border-primary-lime/40 shadow-xs rounded-2xl relative overflow-hidden transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border-subtle/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary-lime/15 border border-primary-lime/30 flex items-center justify-center text-primary-lime">
                      {hasVerifiedBooking ? <ShieldCheck size={17} /> : <MessageSquare size={17} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                        <span>Write a Pitch Review</span>
                        {hasVerifiedBooking ? (
                          <span className="text-[10px] bg-primary-lime/15 text-primary-lime border border-primary-lime/30 px-2 py-0.5 rounded-full font-bold">
                            Verified Player
                          </span>
                        ) : (
                          <span className="text-[10px] bg-surface-raised text-text-secondary border border-border-subtle px-2 py-0.5 rounded-full font-medium">
                            Community Player
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {hasVerifiedBooking
                          ? "Rate your match session and help other teams choose the best turf."
                          : "Played here before? Share your experience with the Kampala football community."}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select match booking if multiple verified sessions exist */}
                  {eligibleBookings.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                        <CalendarCheck size={13} className="text-primary-lime" />
                        <span>Link Your Match Session (Verified Badge)</span>
                      </label>
                      <select
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary-lime text-text-primary cursor-pointer"
                      >
                        {eligibleBookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            Match on {b.date} at {b.time} ({b.slots?.join(", ") || b.time})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Star Rating Selection */}
                  <div className="space-y-1.5 bg-surface-raised/70 p-3 rounded-xl border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-primary">
                        Pitch Quality &amp; Facility Rating
                      </label>
                      <span className="text-[11px] font-bold text-primary-lime">
                        {getRatingLabel(displayRating)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= displayRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="p-1 hover:scale-110 active:scale-95 transition-transform duration-150 focus:outline-none cursor-pointer"
                            aria-label={`Rate ${star} star`}
                          >
                            <Star
                              size={26}
                              className={`transition-colors duration-150 ${
                                isFilled
                                  ? "fill-[#FACC15] text-[#FACC15] drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]"
                                  : "text-zinc-700"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-secondary">
                        Your Detailed Feedback
                      </label>
                      <span className="text-[10px] text-text-tertiary">
                        {comment.length} / 500 characters
                      </span>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      placeholder="How was the AstroTurf surface, lighting quality, ball bounce, goalpost nets, parking, and caretaker support? Tell the community..."
                      rows={3}
                      className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-xl p-3 text-xs sm:text-sm focus:outline-none text-text-primary transition-all resize-none placeholder:text-text-tertiary"
                    />
                  </div>

                  {/* Inline Status Messages */}
                  {errorMessage && (
                    <div className="text-xs font-medium text-red-400 bg-red-950/40 px-3.5 py-2.5 rounded-xl border border-red-500/30">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="text-xs font-medium text-primary-lime bg-primary-lime/10 px-3.5 py-2.5 rounded-xl border border-primary-lime/30 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-primary-lime" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting || !comment.trim()}
                      className="px-5 py-2.5 text-xs font-black shadow-md flex items-center gap-2 bg-primary-lime hover:bg-primary-lime-hover text-accent-text rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Review</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )
        ) : (
          /* Guest prompt */
          <div className="p-5 bg-surface-card rounded-2xl border border-border-subtle text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle mx-auto flex items-center justify-center text-text-secondary">
              <Lock size={18} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                Sign In to Review This Pitch
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Log in to rate this facility and share your matchday experience with verified community players.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 mx-auto shadow-xs active:scale-95"
              >
                <LogIn size={14} />
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* REVIEWS FEED LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Player Feedback ({reviews.length})
          </h3>
          <span className="text-[11px] text-text-tertiary">
            Sorted by most recent
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 bg-surface-card rounded-xl border border-border-subtle">
            <Loader2 size={22} className="animate-spin text-primary-lime" />
            <span className="text-xs text-text-secondary">Loading player reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center text-text-secondary bg-surface-card border border-border-subtle rounded-2xl space-y-2">
            <Star size={32} className="text-zinc-700 mx-auto" />
            <p className="font-bold text-xs text-text-primary">No reviews yet</p>
            <p className="text-[11px] text-text-secondary">
              Be the first player to review this venue!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const isVerified = rev.verifiedBooking !== false && rev.bookingId !== "community";
              const canDelete = user && (user.uid === rev.playerId || isAdmin || user.uid === "0uVlAOWTy7dpqAW5tsgxQVs4PW43");

              return (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 bg-surface-card border-border-subtle hover:border-border-prominent relative group transition-colors rounded-2xl">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-primary-lime font-bold text-xs border border-border-subtle">
                          {rev.playerName ? rev.playerName.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-text-primary leading-tight">
                              {rev.playerName}
                            </h4>
                            {isVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary-lime/10 border border-primary-lime/25 text-primary-lime px-1.5 py-0.2 rounded font-bold">
                                <ShieldCheck size={9} />
                                Verified Player
                              </span>
                            ) : (
                              <span className="text-[9px] bg-surface-raised border border-border-subtle text-text-tertiary px-1.5 py-0.2 rounded font-medium">
                                Community Player
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-text-tertiary mt-0.5">
                            <Calendar size={10} />
                            <span>{formatDate(rev.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating Badge */}
                      <div className="flex items-center gap-1 bg-surface-raised border border-border-subtle px-2 py-0.5 rounded-full shrink-0">
                        <Star size={11} className="fill-[#FACC15] text-[#FACC15]" />
                        <span className="text-[11px] font-bold text-text-primary">
                          {rev.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Review Comment Text */}
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap pl-0.5">
                      {rev.comment}
                    </p>

                    {/* Delete Option for Author or Admin */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="absolute bottom-3 right-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
