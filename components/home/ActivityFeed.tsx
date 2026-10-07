import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Shield,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Share2,
  Heart,
  ChevronRight,
  Filter,
  Plus,
  X,
  Check,
  Send,
  Radio,
  ExternalLink,
  Medal,
  Award,
  RefreshCw,
  Calendar,
  Zap,
  Flame,
  Search,
  UserPlus,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  communityActivityService,
  INITIAL_COMMUNITY_ACTIVITIES,
} from "../../services/communityActivityService";
import { CommunityActivity, CommunityActivityType, Pitch } from "../../types/firebase";
import { useUser } from "../../context/UserContext";

export type ActivityFilterTab = "all" | "match_results" | "upcoming_bookings" | "team_updates";

interface ActivityFeedProps {
  onSelectSlot?: (pitch: Partial<Pitch>, slot: string) => void;
  className?: string;
  limitItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  onSelectSlot,
  className = "",
  limitItems,
}) => {
  const navigate = useNavigate();
  const { userProfile, user } = useUser();

  const [activities, setActivities] = useState<CommunityActivity[]>(INITIAL_COMMUNITY_ACTIVITIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActivityFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedActivityId, setCopiedActivityId] = useState<string | null>(null);

  // Modal for posting new activity
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [postCategory, setPostCategory] = useState<"match_result" | "turf_booking" | "team_update">("match_result");
  const [postHomeTeam, setPostHomeTeam] = useState("");
  const [postAwayTeam, setPostAwayTeam] = useState("");
  const [postHomeScore, setPostHomeScore] = useState(3);
  const [postAwayScore, setPostAwayScore] = useState(2);
  const [postVenue, setPostVenue] = useState("Lugogo Arena Turf");
  const [postMvp, setPostMvp] = useState("");
  const [postScorers, setPostScorers] = useState("");
  const [postBookingDate, setPostBookingDate] = useState("Today");
  const [postBookingTime, setPostBookingTime] = useState("19:00 - 20:00");
  const [postOpenSpots, setPostOpenSpots] = useState(2);
  const [postTeamName, setPostTeamName] = useState("");
  const [postCaptain, setPostCaptain] = useState("");
  const [postMembersCount, setPostMembersCount] = useState(9);
  const [postMotto, setPostMotto] = useState("");
  const [postPositions, setPostPositions] = useState("Goalkeeper, Midfielder");
  const [postDescription, setPostDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = communityActivityService.subscribeToCommunityActivities(
      (data) => {
        setActivities(data);
        setLoading(false);
        setIsRefreshing(false);
      },
      () => {
        setLoading(false);
        setIsRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const data = await communityActivityService.getCommunityActivities();
    setActivities(data);
    setIsRefreshing(false);
  };

  // Reactions (Cheer / Like)
  const handleReact = async (activityId: string, reaction: "like" | "celebrate") => {
    const currentUserId = user?.uid || "anon_community_member";

    // Optimistic update
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== activityId) return act;
        const likedBy = act.likedBy || [];
        const celebratedBy = act.celebratedBy || [];

        if (reaction === "like") {
          const isLiked = likedBy.includes(currentUserId);
          return {
            ...act,
            likesCount: Math.max(0, act.likesCount + (isLiked ? -1 : 1)),
            likedBy: isLiked
              ? likedBy.filter((u) => u !== currentUserId)
              : [...likedBy, currentUserId],
          };
        } else {
          const isCelebrated = celebratedBy.includes(currentUserId);
          return {
            ...act,
            celebrationsCount: Math.max(0, act.celebrationsCount + (isCelebrated ? -1 : 1)),
            celebratedBy: isCelebrated
              ? celebratedBy.filter((u) => u !== currentUserId)
              : [...celebratedBy, currentUserId],
          };
        }
      })
    );

    await communityActivityService.toggleReaction(activityId, reaction, currentUserId);
  };

  // Share activity
  const handleShare = (activity: CommunityActivity) => {
    const shareText = `${activity.title} • ${activity.subtitle} on Pitchly`;
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      setCopiedActivityId(activity.id);
      setTimeout(() => setCopiedActivityId(null), 2000);
    }
  };

  // Submit new community activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const authorName = userProfile?.name || user?.displayName || "Kampala Player";
    const authorAvatar =
      (userProfile as any)?.photoURL ||
      (userProfile as any)?.avatar ||
      user?.photoURL ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

    try {
      if (postCategory === "match_result") {
        const home = postHomeTeam || "Home Stars";
        const away = postAwayTeam || "Away United";
        const scorersList = postScorers
          ? postScorers.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        await communityActivityService.publishActivity({
          type: "match_played",
          title: `${home} ${postHomeScore} - ${postAwayScore} ${away}`,
          subtitle: `Final score recorded at ${postVenue}`,
          description: postDescription || `Intense community matchday match between ${home} and ${away}.`,
          timestamp: new Date().toISOString(),
          userName: authorName,
          userAvatar: authorAvatar,
          userBadge: "Match Reporter",
          venue: postVenue,
          matchData: {
            homeTeam: home,
            awayTeam: away,
            homeScore: postHomeScore,
            awayScore: postAwayScore,
            scorers: scorersList,
            mvp: postMvp || undefined,
            pitchName: postVenue,
            format: "7-a-side",
            status: "FT",
          },
        });
      } else if (postCategory === "turf_booking") {
        await communityActivityService.publishActivity({
          type: "turf_booking",
          title: `${postVenue} Booked • ${postBookingTime} ⚽`,
          subtitle: `${postBookingDate} Slot reserved by ${authorName}`,
          description: postDescription || `${postOpenSpots} open spots available for players to join in a friendly challenge.`,
          timestamp: new Date().toISOString(),
          userName: authorName,
          userAvatar: authorAvatar,
          userBadge: "Turf Booker",
          venue: postVenue,
          bookingData: {
            pitchName: postVenue,
            date: postBookingDate,
            time: postBookingTime,
            format: "7-a-side Floodlit",
            bookedBy: authorName,
            openSpotsCount: postOpenSpots,
            isCommunityOpen: true,
            bookingStatus: "upcoming",
          },
        });
      } else if (postCategory === "team_update") {
        const initials = (postTeamName || "FC")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        const positionsList = postPositions
          ? postPositions.split(",").map((p) => p.trim()).filter(Boolean)
          : ["Goalkeeper 🧤", "Midfielder ⚡"];

        await communityActivityService.publishActivity({
          type: "team_formed",
          title: `${postTeamName || "Kampala Strikers FC"} Squad Activated! 🛡️`,
          subtitle: `Led by Captain ${postCaptain || authorName} • ${postMembersCount} Confirmed Players`,
          description: postDescription || `Official squad formed and ready to play friendly matches and tournament brackets.`,
          timestamp: new Date().toISOString(),
          userName: postCaptain || authorName,
          userAvatar: authorAvatar,
          userBadge: "Club Captain",
          venue: postVenue,
          teamData: {
            teamName: postTeamName || "Kampala Strikers FC",
            captain: postCaptain || authorName,
            membersCount: postMembersCount,
            homePitch: postVenue,
            badgeColor: "#A8FF00",
            badgeInitials: initials || "FC",
            motto: postMotto || "Passion, Strength & Teamwork",
            updateType: "recruitment",
            openPositions: positionsList,
          },
        });
      }

      setShowPostModal(false);
      // Reset fields
      setPostHomeTeam("");
      setPostAwayTeam("");
      setPostTeamName("");
      setPostDescription("");
      setPostMvp("");
      setPostScorers("");
    } catch (err) {
      console.error("Error creating activity post:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter activities based on tab and query
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Tab filter
      if (activeTab === "match_results") {
        if (act.type !== "match_played" && act.type !== "match_result") return false;
      } else if (activeTab === "upcoming_bookings") {
        if (act.type !== "turf_booking") return false;
      } else if (activeTab === "team_updates") {
        if (act.type !== "team_formed" && act.type !== "team_update") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesSubtitle = act.subtitle.toLowerCase().includes(q);
        const matchesVenue = (act.venue || "").toLowerCase().includes(q);
        const matchesTeam =
          act.matchData?.homeTeam?.toLowerCase().includes(q) ||
          act.matchData?.awayTeam?.toLowerCase().includes(q) ||
          act.teamData?.teamName?.toLowerCase().includes(q);
        return matchesTitle || matchesSubtitle || matchesVenue || matchesTeam;
      }

      return true;
    });
  }, [activities, activeTab, searchQuery]);

  const displayedActivities = limitItems
    ? filteredActivities.slice(0, limitItems)
    : filteredActivities;

  // Format relative time helper
  const formatTimeAgo = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const currentUserId = user?.uid || "";

  return (
    <section
      id="activity-feed-section"
      aria-label="Community Activity Feed"
      className={`space-y-4 sm:space-y-5 scroll-mt-24 ${className}`}
    >
      {/* 1. Header Bar */}
      <div className="bg-surface-card rounded-3xl border border-border-subtle p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-lime/10 border border-primary-lime/30 text-primary-lime text-[11px] font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
                Live Community Pulse
              </div>
              <span className="text-[11px] font-bold text-text-tertiary">
                Kampala Grassroots Football
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-display flex items-center gap-2">
              <span>Activity Feed</span>
              <span className="text-sm font-bold text-text-tertiary px-2 py-0.5 rounded-full bg-surface-raised border border-border-subtle">
                {displayedActivities.length}
              </span>
            </h2>
            <p className="text-xs text-text-secondary max-w-xl">
              Real-time match results, upcoming turf bookings, and team updates across Kampala pitches.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              id="activity-feed-refresh-btn"
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh feed"
              className="p-2.5 rounded-xl bg-surface-raised hover:bg-surface-card border border-border-subtle hover:border-border-prominent text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw
                size={15}
                className={isRefreshing ? "animate-spin text-primary-lime" : ""}
              />
            </button>

            <button
              id="activity-feed-post-btn"
              type="button"
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary-lime hover:bg-[#b8ff1a] text-accent-text font-black text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Post Update</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className="pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="filter-tab-all"
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary-lime text-accent-text font-black shadow-xs"
                  : "bg-surface-raised hover:bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              All Activity
            </button>

            <button
              id="filter-tab-match-results"
              type="button"
              onClick={() => setActiveTab("match_results")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "match_results"
                  ? "bg-primary-lime text-accent-text font-black shadow-xs"
                  : "bg-surface-raised hover:bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              <span>⚽ Match Results</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "match_results"
                    ? "bg-black/20 text-accent-text"
                    : "bg-surface-card text-text-tertiary"
                }`}
              >
                {
                  activities.filter(
                    (a) => a.type === "match_played" || a.type === "match_result"
                  ).length
                }
              </span>
            </button>

            <button
              id="filter-tab-upcoming-bookings"
              type="button"
              onClick={() => setActiveTab("upcoming_bookings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "upcoming_bookings"
                  ? "bg-primary-lime text-accent-text font-black shadow-xs"
                  : "bg-surface-raised hover:bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              <span>📅 Upcoming Turf Bookings</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "upcoming_bookings"
                    ? "bg-black/20 text-accent-text"
                    : "bg-surface-card text-text-tertiary"
                }`}
              >
                {activities.filter((a) => a.type === "turf_booking").length}
              </span>
            </button>

            <button
              id="filter-tab-team-updates"
              type="button"
              onClick={() => setActiveTab("team_updates")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "team_updates"
                  ? "bg-primary-lime text-accent-text font-black shadow-xs"
                  : "bg-surface-raised hover:bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              <span>🛡️ Team Updates</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "team_updates"
                    ? "bg-black/20 text-accent-text"
                    : "bg-surface-card text-text-tertiary"
                }`}
              >
                {
                  activities.filter(
                    (a) => a.type === "team_formed" || a.type === "team_update"
                  ).length
                }
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] max-w-xs w-full">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            />
            <input
              id="activity-feed-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter teams, scores, turfs..."
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-8 pr-7 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Activity Feed List Cards */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface-card rounded-2xl border border-border-subtle p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-raised" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-1/3 h-4 bg-surface-raised rounded-md" />
                    <div className="w-1/4 h-3 bg-surface-raised rounded-md" />
                  </div>
                </div>
                <div className="w-full h-16 bg-surface-raised rounded-xl" />
              </div>
            ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((act) => {
            const isMatch = act.type === "match_played" || act.type === "match_result";
            const isBooking = act.type === "turf_booking";
            const isTeam = act.type === "team_formed" || act.type === "team_update";
            const isTournament = act.type === "tournament_completed";

            const hasLiked = (act.likedBy || []).includes(currentUserId);
            const hasCelebrated = (act.celebratedBy || []).includes(currentUserId);

            return (
              <motion.article
                key={act.id}
                id={`activity-card-${act.id}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="bg-surface-card hover:bg-surface-raised rounded-2xl sm:rounded-3xl border border-border-subtle hover:border-border-prominent transition-all duration-200 p-4 sm:p-5 shadow-xs overflow-hidden space-y-3.5"
              >
                {/* Author & Activity Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        act.userAvatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={act.userName || "Player"}
                      className="w-10 h-10 rounded-full object-cover border border-border-subtle shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-text-primary truncate">
                          {act.userName || "Community Member"}
                        </span>
                        {act.userBadge && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-lime/10 text-primary-lime text-[10px] font-black border border-primary-lime/20 tracking-tight">
                            {act.userBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatTimeAgo(act.timestamp)}
                        </span>
                        {act.venue && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate text-text-secondary">
                              <MapPin size={11} className="text-primary-lime shrink-0" />
                              {act.venue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activity Type Badge */}
                  <div className="shrink-0">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-black uppercase tracking-wider">
                        {act.matchData?.status === "LIVE" ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE {act.matchData.liveMinute || "72'"}
                          </>
                        ) : (
                          <>
                            <span>⚽</span>
                            <span>Match Result</span>
                          </>
                        )}
                      </span>
                    ) : isBooking ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[10px] font-black uppercase tracking-wider">
                        <Calendar size={11} />
                        <span>Upcoming Booking</span>
                      </span>
                    ) : isTeam ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[10px] font-black uppercase tracking-wider">
                        <Shield size={11} />
                        <span>Team Update</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25 text-[10px] font-black uppercase tracking-wider">
                        <Trophy size={11} />
                        <span>Tournament</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* --- SPECIFIC CARD CONTENTS --- */}

                {/* A. MATCH RESULT VIEW */}
                {isMatch && act.matchData && (
                  <div className="bg-surface-raised rounded-2xl border border-border-subtle p-3.5 sm:p-4 space-y-3">
                    <div className="grid grid-cols-11 items-center gap-2">
                      {/* Home Team */}
                      <div className="col-span-4 text-right space-y-0.5">
                        <h4 className="text-sm sm:text-base font-black text-text-primary tracking-tight truncate">
                          {act.matchData.homeTeam}
                        </h4>
                        <span className="text-[10px] font-bold text-text-tertiary uppercase">
                          Home
                        </span>
                      </div>

                      {/* Scoreline */}
                      <div className="col-span-3 flex flex-col items-center justify-center">
                        <div className="px-3.5 py-1.5 rounded-xl bg-app-base border border-border-prominent shadow-inner flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-lg sm:text-xl font-black text-primary-lime">
                            {act.matchData.homeScore}
                          </span>
                          <span className="text-xs font-bold text-text-tertiary">-</span>
                          <span className="text-lg sm:text-xl font-black text-text-primary">
                            {act.matchData.awayScore}
                          </span>
                        </div>
                        <span className="text-[9px] font-black tracking-widest uppercase text-text-tertiary mt-1">
                          {act.matchData.status === "LIVE" ? "IN PROGRESS" : "FULL TIME"}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="col-span-4 text-left space-y-0.5">
                        <h4 className="text-sm sm:text-base font-black text-text-primary tracking-tight truncate">
                          {act.matchData.awayTeam}
                        </h4>
                        <span className="text-[10px] font-bold text-text-tertiary uppercase">
                          Away
                        </span>
                      </div>
                    </div>

                    {/* Scorers or Summary */}
                    {act.matchData.scorers && act.matchData.scorers.length > 0 && (
                      <div className="pt-2 border-t border-border-subtle text-[11px] text-text-secondary flex items-start gap-1.5 flex-wrap">
                        <span className="font-bold text-text-tertiary">Goalscorers:</span>
                        <span>{act.matchData.scorers.join(" • ")}</span>
                      </div>
                    )}

                    {/* MVP Badge */}
                    {act.matchData.mvp && (
                      <div className="flex items-center gap-1.5 text-xs text-text-primary bg-primary-lime/10 border border-primary-lime/20 rounded-xl px-3 py-1.5 font-bold">
                        <Medal size={14} className="text-primary-lime shrink-0" />
                        <span className="text-text-secondary">Man of the Match:</span>
                        <span className="text-primary-lime font-black">{act.matchData.mvp}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* B. UPCOMING TURF BOOKING VIEW */}
                {isBooking && act.bookingData && (
                  <div className="bg-surface-raised rounded-2xl border border-border-subtle p-3.5 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-black text-[10px] tracking-wide uppercase border border-sky-500/25">
                            {act.bookingData.date}
                          </span>
                          <span className="text-xs font-black text-text-primary flex items-center gap-1">
                            <Clock size={12} className="text-sky-400" />
                            {act.bookingData.time}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-text-primary tracking-tight">
                          {act.bookingData.pitchName}
                        </h4>
                        {act.bookingData.location && (
                          <p className="text-[11px] text-text-secondary flex items-center gap-1">
                            <MapPin size={11} className="text-text-tertiary shrink-0" />
                            {act.bookingData.location}
                          </p>
                        )}
                      </div>

                      {/* Open Spots Callout */}
                      {act.bookingData.openSpotsCount ? (
                        <div className="self-start sm:self-center bg-primary-lime/15 border border-primary-lime/30 rounded-xl px-3 py-2 text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 text-primary-lime font-black text-xs">
                            <Users size={13} />
                            <span>{act.bookingData.openSpotsCount} Spots Open</span>
                          </div>
                          <span className="text-[10px] font-bold text-text-secondary">
                            Join this session
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {act.description}
                    </p>

                    {/* Quick Booking CTA */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                      <span className="text-[11px] text-text-tertiary font-bold">
                        Format: {act.bookingData.format || "7-a-side"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectSlot) {
                            onSelectSlot(
                              {
                                id: act.bookingData?.pitchId || "lugogo-arena",
                                name: act.bookingData?.pitchName,
                              },
                              act.bookingData?.time?.split("-")[0]?.trim() || "19:00"
                            );
                          } else {
                            navigate("/bookings");
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-lime hover:bg-[#b8ff1a] text-accent-text font-black text-xs transition-transform active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Join / Book Similar</span>
                        <ChevronRight size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                )}

                {/* C. TEAM UPDATE & RECRUITMENT VIEW */}
                {isTeam && act.teamData && (
                  <div className="bg-surface-raised rounded-2xl border border-border-subtle p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Team Crest */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-base text-black shadow-md shrink-0"
                          style={{
                            backgroundColor: act.teamData.badgeColor || "#A8FF00",
                          }}
                        >
                          {act.teamData.badgeInitials || "FC"}
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-sm sm:text-base font-black text-text-primary tracking-tight">
                            {act.teamData.teamName}
                          </h4>
                          <p className="text-[11px] text-text-tertiary">
                            Captain: <span className="text-text-secondary font-bold">{act.teamData.captain}</span> • {act.teamData.membersCount} Squad Members
                          </p>
                        </div>
                      </div>

                      {act.teamData.updateType === "recruitment" && (
                        <span className="px-2.5 py-1 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[10px] font-black uppercase tracking-tight shrink-0">
                          Scouting Players
                        </span>
                      )}
                    </div>

                    {act.teamData.motto && (
                      <p className="text-xs text-text-secondary italic">
                        "{act.teamData.motto}"
                      </p>
                    )}

                    {/* Open positions badges */}
                    {act.teamData.openPositions && act.teamData.openPositions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-text-tertiary">Looking for:</span>
                        {act.teamData.openPositions.map((pos, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2.5 py-0.5 rounded-lg bg-surface-card border border-border-subtle text-text-primary text-[11px] font-bold"
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                      <span className="text-[11px] text-text-tertiary">
                        Home Pitch: <span className="text-text-secondary font-bold">{act.teamData.homePitch || "Kampala Hub"}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => navigate("/teams")}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent text-text-primary font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={13} className="text-primary-lime" />
                        <span>Squad Hub</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* D. TOURNAMENT COMPLETED VIEW */}
                {isTournament && act.tournamentData && (
                  <div className="bg-surface-raised rounded-2xl border border-border-subtle p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-text-primary">
                        {act.tournamentData.tournamentName}
                      </h4>
                      <span className="text-xs font-black text-amber-400">
                        {act.tournamentData.prizePool}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
                        <span className="text-[10px] text-text-tertiary block font-bold">Champion</span>
                        <span className="font-black text-primary-lime">{act.tournamentData.champion}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
                        <span className="text-[10px] text-text-tertiary block font-bold">Runner Up</span>
                        <span className="font-bold text-text-secondary">{act.tournamentData.runnerUp}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Reactions & Share */}
                <div className="pt-1 flex items-center justify-between gap-3 text-xs border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    {/* Cheer / Celebrate Button */}
                    <button
                      id={`celebrate-btn-${act.id}`}
                      type="button"
                      onClick={() => handleReact(act.id, "celebrate")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        hasCelebrated
                          ? "bg-amber-500/15 border-amber-500 text-amber-400"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-prominent"
                      }`}
                    >
                      <span>🎉</span>
                      <span>{act.celebrationsCount || 0}</span>
                      <span className="hidden sm:inline">Cheer</span>
                    </button>

                    {/* Like Button */}
                    <button
                      id={`like-btn-${act.id}`}
                      type="button"
                      onClick={() => handleReact(act.id, "like")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        hasLiked
                          ? "bg-rose-500/15 border-rose-500 text-rose-400"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-prominent"
                      }`}
                    >
                      <Heart
                        size={13}
                        className={hasLiked ? "fill-rose-500 text-rose-500" : ""}
                      />
                      <span>{act.likesCount || 0}</span>
                    </button>
                  </div>

                  {/* Share button */}
                  <button
                    id={`share-btn-${act.id}`}
                    type="button"
                    onClick={() => handleShare(act)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-card border border-border-subtle hover:border-border-prominent text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer text-xs font-bold"
                  >
                    <Share2 size={13} />
                    <span>{copiedActivityId === act.id ? "Copied!" : "Share"}</span>
                  </button>
                </div>
              </motion.article>
            );
          })
        ) : (
          <div className="py-12 text-center text-text-tertiary text-xs bg-surface-card rounded-3xl border border-border-subtle space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
              <Compass size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">No activities found in this filter</h3>
            <p className="max-w-xs mx-auto text-text-secondary">
              Be the first to post a match result, team recruitment call, or upcoming turf booking!
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL: POST NEW COMMUNITY ACTIVITY */}
      <AnimatePresence>
        {showPostModal && (
          <div
            id="activity-post-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          >
            <motion.div
              id="activity-post-modal-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-card border border-border-subtle rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-text-primary relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                      Post Community Update
                    </h3>
                    <p className="text-[11px] text-text-tertiary">
                      Broadcast to the Kampala football community
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Category Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPostCategory("match_result")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    postCategory === "match_result"
                      ? "bg-primary-lime text-accent-text font-black border-primary-lime shadow-xs"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  ⚽ Match Result
                </button>
                <button
                  type="button"
                  onClick={() => setPostCategory("turf_booking")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    postCategory === "turf_booking"
                      ? "bg-primary-lime text-accent-text font-black border-primary-lime shadow-xs"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  📅 Turf Booking
                </button>
                <button
                  type="button"
                  onClick={() => setPostCategory("team_update")}
                  className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    postCategory === "team_update"
                      ? "bg-primary-lime text-accent-text font-black border-primary-lime shadow-xs"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  🛡️ Team Update
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-3.5">
                {/* MATCH RESULT FORM */}
                {postCategory === "match_result" && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Home Team Name
                        </label>
                        <input
                          type="text"
                          required
                          value={postHomeTeam}
                          onChange={(e) => setPostHomeTeam(e.target.value)}
                          placeholder="e.g. Kampala Stars"
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Away Team Name
                        </label>
                        <input
                          type="text"
                          required
                          value={postAwayTeam}
                          onChange={(e) => setPostAwayTeam(e.target.value)}
                          placeholder="e.g. Bugolobi Ballers"
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Home Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={postHomeScore}
                          onChange={(e) => setPostHomeScore(Number(e.target.value))}
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Away Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={postAwayScore}
                          onChange={(e) => setPostAwayScore(Number(e.target.value))}
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-text-secondary block mb-1">
                        Man of the Match / MVP
                      </label>
                      <input
                        type="text"
                        value={postMvp}
                        onChange={(e) => setPostMvp(e.target.value)}
                        placeholder="e.g. Dennis Ochieng"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                      />
                    </div>
                  </>
                )}

                {/* TURF BOOKING FORM */}
                {postCategory === "turf_booking" && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Booking Date
                        </label>
                        <select
                          value={postBookingDate}
                          onChange={(e) => setPostBookingDate(e.target.value)}
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        >
                          <option value="Today">Today</option>
                          <option value="Tomorrow">Tomorrow</option>
                          <option value="Saturday">This Saturday</option>
                          <option value="Sunday">This Sunday</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Time Slot
                        </label>
                        <input
                          type="text"
                          value={postBookingTime}
                          onChange={(e) => setPostBookingTime(e.target.value)}
                          placeholder="e.g. 19:00 - 20:00"
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-text-secondary block mb-1">
                        Open Spots for Community Players
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="14"
                        value={postOpenSpots}
                        onChange={(e) => setPostOpenSpots(Number(e.target.value))}
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                      />
                    </div>
                  </>
                )}

                {/* TEAM UPDATE FORM */}
                {postCategory === "team_update" && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary block mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        required
                        value={postTeamName}
                        onChange={(e) => setPostTeamName(e.target.value)}
                        placeholder="e.g. Kololo Royals FC"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Captain Name
                        </label>
                        <input
                          type="text"
                          value={postCaptain}
                          onChange={(e) => setPostCaptain(e.target.value)}
                          placeholder="e.g. Brian Kyobe"
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-text-secondary block mb-1">
                          Squad Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="22"
                          value={postMembersCount}
                          onChange={(e) => setPostMembersCount(Number(e.target.value))}
                          className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-text-secondary block mb-1">
                        Recruiting Positions (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={postPositions}
                        onChange={(e) => setPostPositions(e.target.value)}
                        placeholder="e.g. Goalkeeper, Midfielder"
                        className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                      />
                    </div>
                  </>
                )}

                {/* Common Venue & Description */}
                <div>
                  <label className="text-[11px] font-bold text-text-secondary block mb-1">
                    Turf Venue
                  </label>
                  <select
                    value={postVenue}
                    onChange={(e) => setPostVenue(e.target.value)}
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  >
                    <option value="Lugogo Arena Turf">Lugogo Arena Turf</option>
                    <option value="Fusion Sports Bugolobi">Fusion Sports Bugolobi</option>
                    <option value="Kyanja Arena">Kyanja Arena</option>
                    <option value="Tal Olympic Stadium">Tal Olympic Stadium</option>
                    <option value="Kololo Tennis Club Turf">Kololo Tennis Club Turf</option>
                    <option value="Lugogo Hockey Ground Turf">Lugogo Hockey Ground Turf</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary block mb-1">
                    Details / Highlights
                  </label>
                  <textarea
                    rows={2}
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Share any highlights, scorers, or invitations..."
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-lime resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : "Publish to Feed"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
