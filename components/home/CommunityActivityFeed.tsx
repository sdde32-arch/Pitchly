import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Shield,
  Flame,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  communityActivityService,
  INITIAL_COMMUNITY_ACTIVITIES,
} from "../../services/communityActivityService";
import { CommunityActivity, CommunityActivityType } from "../../types/firebase";
import { useUser } from "../../context/UserContext";

type FilterTab = "all" | "match_played" | "team_formed" | "tournament_completed";

export const CommunityActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user } = useUser();

  const [activities, setActivities] = useState<CommunityActivity[]>(INITIAL_COMMUNITY_ACTIVITIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedActivityId, setCopiedActivityId] = useState<string | null>(null);

  // New Activity Modal
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [postType, setPostType] = useState<CommunityActivityType>("match_played");
  const [postTitle, setPostTitle] = useState("");
  const [postSubtitle, setPostSubtitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postVenue, setPostVenue] = useState("Lugogo Arena Turf");
  const [postHomeTeam, setPostHomeTeam] = useState("");
  const [postAwayTeam, setPostAwayTeam] = useState("");
  const [postHomeScore, setPostHomeScore] = useState(2);
  const [postAwayScore, setPostAwayScore] = useState(1);
  const [postMvp, setPostMvp] = useState("");
  const [postTeamName, setPostTeamName] = useState("");
  const [postCaptain, setPostCaptain] = useState("");
  const [postMembersCount, setPostMembersCount] = useState(8);
  const [postMotto, setPostMotto] = useState("");
  const [postChampion, setPostChampion] = useState("");
  const [postRunnerUp, setPostRunnerUp] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Subscribe to real-time activities from Firestore
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

  // Reactions
  const handleReact = async (activityId: string, reaction: "like" | "celebrate") => {
    const currentUserId = user?.uid || "anon_fan";

    // Optimistic UI update
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

  // Share link
  const handleShare = (activity: CommunityActivity) => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: `${activity.title} • ${activity.subtitle} on Pitchly`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${activity.title}: ${activity.subtitle} - Check it on Pitchly! ${url}`);
      setCopiedActivityId(activity.id);
      setTimeout(() => setCopiedActivityId(null), 2000);
    }
  };

  // Form submission for new activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostSubmitting(true);

    try {
      const authorName = userProfile?.name || user?.displayName || "Community Striker";
      const authorAvatar =
        (userProfile as any)?.photoURL ||
        (userProfile as any)?.avatar ||
        user?.photoURL ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

      if (postType === "match_played") {
        await communityActivityService.publishActivity({
          type: "match_played",
          title: `${postHomeTeam || "Home Stars"} ${postHomeScore} - ${postAwayScore} ${postAwayTeam || "Away Warriors"}`,
          subtitle: postSubtitle || `Intense match hosted at ${postVenue}`,
          description: postDescription || `Exciting grassroots showdown with high tempo football.`,
          timestamp: new Date().toISOString(),
          userName: authorName,
          userAvatar: authorAvatar,
          userBadge: "Match Reporter",
          venue: postVenue,
          matchData: {
            homeTeam: postHomeTeam || "Home Stars",
            awayTeam: postAwayTeam || "Away Warriors",
            homeScore: postHomeScore,
            awayScore: postAwayScore,
            pitchName: postVenue,
            format: "7-a-side",
            mvp: postMvp || undefined,
          },
        });
      } else if (postType === "team_formed") {
        const initials = (postTeamName || "New FC")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

        await communityActivityService.publishActivity({
          type: "team_formed",
          title: `${postTeamName || "Kampala Titans"} Formed`,
          subtitle: `Founded by ${postCaptain || authorName} with ${postMembersCount} registered players`,
          description: postDescription || `Official squad formed and ready to take on challengers in Kampala.`,
          timestamp: new Date().toISOString(),
          userName: postCaptain || authorName,
          userAvatar: authorAvatar,
          userBadge: "Club Founder",
          venue: postVenue,
          teamData: {
            teamName: postTeamName || "Kampala Titans",
            captain: postCaptain || authorName,
            membersCount: postMembersCount,
            homePitch: postVenue,
            badgeColor: "#A8FF00",
            badgeInitials: initials || "FC",
            motto: postMotto || "Passion, Strength & Respect",
          },
        });
      } else if (postType === "tournament_completed") {
        await communityActivityService.publishActivity({
          type: "tournament_completed",
          title: `${postTitle || "Community Cup"} Concluded! 🏆`,
          subtitle: `${postChampion || "Champions FC"} crowned Winners!`,
          description: postDescription || `A hard-fought competition showcasing the finest local talent.`,
          timestamp: new Date().toISOString(),
          userName: authorName,
          userAvatar: authorAvatar,
          userBadge: "Tournament Official",
          venue: postVenue,
          tournamentData: {
            tournamentName: postTitle || "Community Cup",
            champion: `${postChampion || "Champions FC"} 🏆`,
            runnerUp: `${postRunnerUp || "Finalists SC"} 🥈`,
            participantsCount: 8,
            season: "2026 Spring Cup",
            tournamentId: "wehat-s2-w2",
          },
        });
      }

      // Reset form
      setShowPostModal(false);
      setPostTitle("");
      setPostSubtitle("");
      setPostDescription("");
      setPostHomeTeam("");
      setPostAwayTeam("");
      setPostTeamName("");
      setPostChampion("");
      setPostRunnerUp("");
    } catch (err) {
      console.error("Error creating activity:", err);
    } finally {
      setPostSubmitting(false);
    }
  };

  // Helper for human-readable time ago
  const formatTimeAgo = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activeTab === "all") return activities;
    return activities.filter((act) => act.type === activeTab);
  }, [activities, activeTab]);

  const counts = useMemo(() => {
    return {
      all: activities.length,
      match_played: activities.filter((a) => a.type === "match_played").length,
      team_formed: activities.filter((a) => a.type === "team_formed").length,
      tournament_completed: activities.filter((a) => a.type === "tournament_completed").length,
    };
  }, [activities]);

  return (
    <section
      id="community-activity-feed-section"
      aria-label="Community Activity Feed"
      className="space-y-4 pt-4"
    >
      {/* 1. SECTION HEADER WITH LIVE PULSE & POST TRIGGER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Live Network
            </span>
            <span className="text-border-subtle">•</span>
            <span className="text-[10px] font-bold text-text-tertiary">Real-time Firestore</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight flex items-center gap-2 mt-0.5">
            Community Activity
            <Sparkles size={18} className="text-primary-lime inline-block" />
          </h2>
          <p className="text-xs text-text-secondary">
            Recent matches played, newly registered squads, and championship victories across Uganda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Feed"
            className="h-9 w-9 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-primary-lime" : ""} />
          </button>

          {/* Post Activity Button */}
          <button
            id="btn-post-community-activity"
            type="button"
            onClick={() => setShowPostModal(true)}
            className="h-9 px-3.5 rounded-xl bg-primary-lime text-accent-text text-xs font-black flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Share Activity</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER PILLS */}
      <div
        id="community-activity-filters"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none"
      >
        {/* All Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "all"
              ? "bg-primary-lime text-accent-text font-black shadow-xs"
              : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
          }`}
        >
          <span>All Feed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "all" ? "bg-black/20 text-black font-black" : "bg-surface-raised text-text-tertiary"
            }`}
          >
            {counts.all}
          </span>
        </button>

        {/* Matches Played Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("match_played")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "match_played"
              ? "bg-primary-lime text-accent-text font-black shadow-xs"
              : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
          }`}
        >
          <span className="text-sm">⚽</span>
          <span>Matches Played</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "match_played"
                ? "bg-black/20 text-black font-black"
                : "bg-surface-raised text-text-tertiary"
            }`}
          >
            {counts.match_played}
          </span>
        </button>

        {/* New Teams Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("team_formed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "team_formed"
              ? "bg-primary-lime text-accent-text font-black shadow-xs"
              : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
          }`}
        >
          <Shield size={13} className={activeTab === "team_formed" ? "text-accent-text" : "text-emerald-400"} />
          <span>New Teams Formed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "team_formed"
                ? "bg-black/20 text-black font-black"
                : "bg-surface-raised text-text-tertiary"
            }`}
          >
            {counts.team_formed}
          </span>
        </button>

        {/* Tournaments Completed Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("tournament_completed")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "tournament_completed"
              ? "bg-primary-lime text-accent-text font-black shadow-xs"
              : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
          }`}
        >
          <Trophy size={13} className={activeTab === "tournament_completed" ? "text-accent-text" : "text-amber-400"} />
          <span>Tournaments Completed</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "tournament_completed"
                ? "bg-black/20 text-black font-black"
                : "bg-surface-raised text-text-tertiary"
            }`}
          >
            {counts.tournament_completed}
          </span>
        </button>
      </div>

      {/* 3. ACTIVITY FEED CARDS CONTAINER */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-surface-card border border-border-subtle animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-raised" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-1/3 h-4 bg-surface-raised rounded" />
                    <div className="w-1/4 h-3 bg-surface-raised rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-3 bg-surface-raised rounded" />
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 px-4 rounded-3xl bg-surface-card border border-border-subtle text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto text-text-tertiary">
              <Radio size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">No activity yet in this category</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Be the first to record a match result, form a new team squad, or report a tournament champion!
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-xs"
            >
              View All Activities
            </button>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="group p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border-subtle hover:border-primary-lime/40 transition-all duration-200 shadow-sm relative overflow-hidden"
            >
              {/* Type Accent Glow Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  activity.type === "match_played"
                    ? "bg-gradient-to-r from-emerald-500 via-primary-lime to-emerald-500"
                    : activity.type === "team_formed"
                    ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
                    : "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                }`}
              />

              {/* Card Header: Author, Badge, Time Ago */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        activity.userAvatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={activity.userName || "User"}
                      className="w-10 h-10 rounded-xl object-cover border border-border-subtle"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-md flex items-center justify-center text-[9px] shadow-xs ${
                        activity.type === "match_played"
                          ? "bg-emerald-500 text-white"
                          : activity.type === "team_formed"
                          ? "bg-blue-500 text-white"
                          : "bg-amber-400 text-black font-black"
                      }`}
                    >
                      {activity.type === "match_played" ? (
                        "⚽"
                      ) : activity.type === "team_formed" ? (
                        <Shield size={9} />
                      ) : (
                        <Trophy size={9} />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-text-primary truncate">
                        {activity.userName || "Footballer"}
                      </span>
                      {activity.userBadge && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-surface-raised border border-border-subtle text-text-secondary">
                          {activity.userBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      {activity.venue && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate text-text-secondary">
                            <MapPin size={11} className="text-primary-lime shrink-0" />
                            {activity.venue}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Category Pill */}
                <div className="shrink-0">
                  {activity.type === "match_played" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Match Result
                    </span>
                  )}
                  {activity.type === "team_formed" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      New Squad
                    </span>
                  )}
                  {activity.type === "tournament_completed" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      Grand Final 🏆
                    </span>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* TYPE 1: MATCH PLAYED BODY */}
              {/* ======================================================== */}
              {activity.type === "match_played" && (
                <div className="space-y-3 my-2">
                  {/* Scoreboard Banner */}
                  <div className="p-3.5 rounded-2xl bg-surface-raised/70 border border-border-subtle flex items-center justify-between gap-3">
                    {/* Home Team */}
                    <div className="flex-1 text-right min-w-0">
                      <div className="text-xs sm:text-sm font-black text-text-primary truncate">
                        {activity.matchData?.homeTeam || "Home"}
                      </div>
                      <span className="text-[10px] font-semibold text-text-tertiary">Home</span>
                    </div>

                    {/* Final Score Badge */}
                    <div className="px-3 sm:px-4 py-1.5 rounded-xl bg-app-base border border-primary-lime/40 shadow-xs flex items-center gap-2">
                      <span className="text-base sm:text-xl font-black text-primary-lime font-mono">
                        {activity.matchData?.homeScore ?? 0}
                      </span>
                      <span className="text-xs font-bold text-text-tertiary">-</span>
                      <span className="text-base sm:text-xl font-black text-primary-lime font-mono">
                        {activity.matchData?.awayScore ?? 0}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs sm:text-sm font-black text-text-primary truncate">
                        {activity.matchData?.awayTeam || "Away"}
                      </div>
                      <span className="text-[10px] font-semibold text-text-tertiary">Away</span>
                    </div>
                  </div>

                  {/* Highlights & Scorers */}
                  {activity.description && (
                    <p className="text-xs text-text-secondary leading-relaxed px-0.5">
                      {activity.description}
                    </p>
                  )}

                  {/* Match tags / MVP */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {activity.matchData?.mvp && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-400/15 text-amber-400 border border-amber-400/25">
                        <Award size={12} />
                        MVP: {activity.matchData.mvp}
                      </span>
                    )}
                    {activity.matchData?.format && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-surface-raised text-text-secondary border border-border-subtle">
                        {activity.matchData.format}
                      </span>
                    )}
                    {activity.matchData?.scorers && activity.matchData.scorers.length > 0 && (
                      <div className="text-[11px] text-text-tertiary flex items-center gap-1">
                        <span>🎯 Scorers:</span>
                        <span className="text-text-secondary font-medium truncate max-w-xs sm:max-w-md">
                          {activity.matchData.scorers.slice(0, 3).join(", ")}
                          {activity.matchData.scorers.length > 3 ? "..." : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TYPE 2: NEW TEAM FORMED BODY */}
              {/* ======================================================== */}
              {activity.type === "team_formed" && (
                <div className="space-y-3 my-2">
                  <div className="p-3.5 rounded-2xl bg-surface-raised/70 border border-border-subtle flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Team Crest Badge */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-black shadow-md shrink-0"
                        style={{ backgroundColor: activity.teamData?.badgeColor || "#A8FF00" }}
                      >
                        {activity.teamData?.badgeInitials || "FC"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-text-primary truncate">
                          {activity.teamData?.teamName || activity.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap mt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Users size={12} className="text-sky-400" />
                            {activity.teamData?.membersCount || 7} Registered Players
                          </span>
                          <span>•</span>
                          <span className="text-text-tertiary">
                            Captain: <strong className="text-text-primary">{activity.teamData?.captain}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/teams")}
                      className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Squad</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {activity.teamData?.motto && (
                    <blockquote className="text-xs italic text-text-secondary border-l-2 border-primary-lime pl-2.5 py-0.5">
                      "{activity.teamData.motto}"
                    </blockquote>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TYPE 3: TOURNAMENT COMPLETED BODY */}
              {/* ======================================================== */}
              {activity.type === "tournament_completed" && (
                <div className="space-y-3 my-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                          <Trophy size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-text-primary">
                            {activity.tournamentData?.tournamentName || activity.title}
                          </h4>
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                            Championship Finished
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/tournament/${activity.tournamentData?.tournamentId || "wehat-s2-w2"}`)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-black flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-xs"
                      >
                        <span>Leaderboard</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>

                    {/* Champion & Runner-Up Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-surface-card/80 border border-amber-400/30 space-y-0.5">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                          🥇 Champion
                        </span>
                        <span className="font-black text-text-primary text-xs sm:text-sm truncate block">
                          {activity.tournamentData?.champion || "Champion"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-card/80 border border-border-subtle space-y-0.5">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider block">
                          🥈 Runner-Up
                        </span>
                        <span className="font-bold text-text-secondary text-xs sm:text-sm truncate block">
                          {activity.tournamentData?.runnerUp || "Runner Up"}
                        </span>
                      </div>
                    </div>

                    {/* Golden Boot & Prize */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/20 text-[11px]">
                      {activity.tournamentData?.goldenBootWinner && (
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <span className="text-amber-400">⚡ Golden Boot:</span>
                          <span className="font-bold text-text-primary">
                            {activity.tournamentData.goldenBootWinner}
                          </span>
                        </div>
                      )}
                      {activity.tournamentData?.prizePool && (
                        <span className="font-mono font-black text-primary-lime bg-primary-lime/10 px-2 py-0.5 rounded border border-primary-lime/20">
                          Prize: {activity.tournamentData.prizePool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card Footer: Interactive Actions (Cheer, Celebrate, Share) */}
              <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Cheer (Like) button */}
                  <button
                    type="button"
                    onClick={() => handleReact(activity.id, "like")}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activity.likedBy?.includes(user?.uid || "anon_fan")
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-surface-raised hover:bg-surface-raised/80 text-text-secondary hover:text-text-primary border border-border-subtle"
                    }`}
                  >
                    <span>⚽</span>
                    <span>Cheer</span>
                    {activity.likesCount > 0 && (
                      <span className="font-mono text-[11px] font-black ml-0.5">
                        {activity.likesCount}
                      </span>
                    )}
                  </button>

                  {/* Celebrate Button */}
                  <button
                    type="button"
                    onClick={() => handleReact(activity.id, "celebrate")}
                    className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activity.celebratedBy?.includes(user?.uid || "anon_fan")
                        ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                        : "bg-surface-raised hover:bg-surface-raised/80 text-text-secondary hover:text-text-primary border border-border-subtle"
                    }`}
                  >
                    <span>👏</span>
                    <span>Celebrate</span>
                    {activity.celebrationsCount > 0 && (
                      <span className="font-mono text-[11px] font-black ml-0.5">
                        {activity.celebrationsCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => handleShare(activity)}
                  title="Share Activity"
                  className="px-2.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-raised/80 border border-border-subtle text-text-secondary hover:text-text-primary flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Share2 size={12} />
                  <span className="hidden sm:inline">
                    {copiedActivityId === activity.id ? "Copied!" : "Share"}
                  </span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL: SHARE COMMUNITY ACTIVITY */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showPostModal && (
          <div
            id="post-activity-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-card border border-border-subtle rounded-3xl max-w-lg w-full p-5 space-y-4 text-text-primary shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-text-primary">
                      Share Community Moment
                    </h3>
                    <p className="text-[11px] text-text-tertiary">
                      Broadcast matches, new teams, or tournament cups to Kampala footballers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPostType("match_played")}
                      className={`py-2 px-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        postType === "match_played"
                          ? "bg-primary-lime text-black border-primary-lime font-black shadow-xs"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      ⚽ Match Played
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType("team_formed")}
                      className={`py-2 px-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        postType === "team_formed"
                          ? "bg-primary-lime text-black border-primary-lime font-black shadow-xs"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      🛡️ New Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType("tournament_completed")}
                      className={`py-2 px-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        postType === "tournament_completed"
                          ? "bg-primary-lime text-black border-primary-lime font-black shadow-xs"
                          : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      🏆 Tournament
                    </button>
                  </div>
                </div>

                {/* Match Played Form */}
                {postType === "match_played" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-surface-raised/50 border border-border-subtle">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Home Team</label>
                        <input
                          type="text"
                          required
                          value={postHomeTeam}
                          onChange={(e) => setPostHomeTeam(e.target.value)}
                          placeholder="e.g. Kololo Stars"
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Away Team</label>
                        <input
                          type="text"
                          required
                          value={postAwayTeam}
                          onChange={(e) => setPostAwayTeam(e.target.value)}
                          placeholder="e.g. Bugolobi FC"
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Home Score</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={postHomeScore}
                          onChange={(e) => setPostHomeScore(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-mono font-bold focus:border-primary-lime outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Away Score</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={postAwayScore}
                          onChange={(e) => setPostAwayScore(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-mono font-bold focus:border-primary-lime outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-text-secondary block mb-1">Player of the Match (MVP)</label>
                      <input
                        type="text"
                        value={postMvp}
                        onChange={(e) => setPostMvp(e.target.value)}
                        placeholder="e.g. Dennis Ochieng (Hat-trick hero)"
                        className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-medium placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Team Formed Form */}
                {postType === "team_formed" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-surface-raised/50 border border-border-subtle">
                    <div>
                      <label className="font-bold text-text-secondary block mb-1">Team / Squad Name</label>
                      <input
                        type="text"
                        required
                        value={postTeamName}
                        onChange={(e) => setPostTeamName(e.target.value)}
                        placeholder="e.g. Naguru Vipers SC"
                        className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Captain / Founder</label>
                        <input
                          type="text"
                          value={postCaptain}
                          onChange={(e) => setPostCaptain(e.target.value)}
                          placeholder="e.g. Brian Kyobe"
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">Squad Size (Players)</label>
                        <input
                          type="number"
                          min="5"
                          max="25"
                          value={postMembersCount}
                          onChange={(e) => setPostMembersCount(parseInt(e.target.value) || 7)}
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-mono font-bold focus:border-primary-lime outline-hidden"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-text-secondary block mb-1">Team Motto / Cry</label>
                      <input
                        type="text"
                        value={postMotto}
                        onChange={(e) => setPostMotto(e.target.value)}
                        placeholder="e.g. Speed, Grit and Brotherhood"
                        className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Tournament Completed Form */}
                {postType === "tournament_completed" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-surface-raised/50 border border-border-subtle">
                    <div>
                      <label className="font-bold text-text-secondary block mb-1">Tournament Title</label>
                      <input
                        type="text"
                        required
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="e.g. Kampala Easter Futsal Cup"
                        className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">🥇 Champion Club</label>
                        <input
                          type="text"
                          required
                          value={postChampion}
                          onChange={(e) => setPostChampion(e.target.value)}
                          placeholder="e.g. BUNGA FC"
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-text-secondary block mb-1">🥈 Runner-Up</label>
                        <input
                          type="text"
                          required
                          value={postRunnerUp}
                          onChange={(e) => setPostRunnerUp(e.target.value)}
                          placeholder="e.g. WEHAT FC"
                          className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-bold placeholder:text-text-tertiary focus:border-primary-lime outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Venue and Notes */}
                <div>
                  <label className="font-bold text-text-secondary block mb-1">Turf Venue</label>
                  <select
                    value={postVenue}
                    onChange={(e) => setPostVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary font-medium focus:border-primary-lime outline-hidden cursor-pointer"
                  >
                    <option value="Lugogo Arena Turf">Lugogo Arena Turf</option>
                    <option value="Fusion Sports Bugolobi">Fusion Sports Bugolobi</option>
                    <option value="Kyanja Arena">Kyanja Arena</option>
                    <option value="Tal Olympic Stadium">Tal Olympic Stadium</option>
                    <option value="Muyenga Turf Club">Muyenga Turf Club</option>
                    <option value="Kololo Community Ground">Kololo Community Ground</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-text-secondary block mb-1">Highlights & Description</label>
                  <textarea
                    rows={2}
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Add brief details about the key goals, celebration, or team goals..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:border-primary-lime outline-hidden resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 rounded-xl border border-border-subtle text-text-secondary hover:text-text-primary font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postSubmitting}
                    className="px-5 py-2 rounded-xl bg-primary-lime text-accent-text font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{postSubmitting ? "Publishing..." : "Publish to Feed"}</span>
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
