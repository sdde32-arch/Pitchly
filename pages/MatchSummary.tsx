import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  onSnapshot 
} from "firebase/firestore";
import { 
  ChevronLeft, 
  Trophy, 
  Plus, 
  Users, 
  Check, 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  Award, 
  TrendingUp, 
  Sparkles,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MatchSummaryData {
  homeScore: number;
  awayScore: number;
  candidates: string[];
}

interface VoteData {
  userId: string;
  votedForName: string;
  createdAt: string;
}

const DEFAULT_PLAYERS = ["Kato Paul", "John Doe", "Harvey S.", "David Okello", "James Wilson"];

export const MatchSummary: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { bookings } = useBooking();
  const { user, userProfile } = useUser();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<MatchSummaryData>({
    homeScore: 0,
    awayScore: 0,
    candidates: DEFAULT_PLAYERS,
  });

  const [votes, setVotes] = useState<VoteData[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [voteSubmitting, setVoteSubmitting] = useState(false);

  // Find booking
  useEffect(() => {
    if (!bookingId) return;
    const found = bookings.find((b) => b.id === bookingId);
    if (found) {
      setBooking(found);
    } else {
      // Try to load booking directly from Firestore if not in context
      const fetchBookingDirectly = async () => {
        try {
          const snap = await getDoc(doc(db, "bookings", bookingId));
          if (snap.exists()) {
            setBooking({ id: snap.id, ...snap.data() });
          }
        } catch (e) {
          console.error("Error loading booking directly", e);
        }
      };
      fetchBookingDirectly();
    }
  }, [bookingId, bookings]);

  // Sync summary details and votes from Firestore in real-time
  useEffect(() => {
    if (!bookingId) return;

    // 1. Sync Score & Candidates
    const summaryRef = doc(db, "bookings", bookingId, "summary", "data");
    const unsubscribeSummary = onSnapshot(summaryRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MatchSummaryData;
        setSummaryData({
          homeScore: data.homeScore ?? 0,
          awayScore: data.awayScore ?? 0,
          candidates: data.candidates ?? DEFAULT_PLAYERS,
        });
      } else {
        // Initialize default data if none exists
        setDoc(summaryRef, {
          homeScore: 0,
          awayScore: 0,
          candidates: DEFAULT_PLAYERS,
        }).catch(err => console.error("Error creating default summary", err));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to match summary:", error);
      setLoading(false);
    });

    // 2. Sync Votes
    const votesRef = collection(db, "bookings", bookingId, "motmVotes");
    const unsubscribeVotes = onSnapshot(votesRef, (snap) => {
      const votesList: VoteData[] = [];
      let currentUserVote: string | null = null;

      snap.forEach((doc) => {
        const vote = doc.data() as VoteData;
        votesList.push(vote);
        if (user && vote.userId === user.uid) {
          currentUserVote = vote.votedForName;
        }
      });

      setVotes(votesList);
      setUserVote(currentUserVote);
    }, (error) => {
      console.error("Error listening to votes:", error);
    });

    return () => {
      unsubscribeSummary();
      unsubscribeVotes();
    };
  }, [bookingId, user]);

  // Handle score updates
  const handleSaveScore = async () => {
    if (!bookingId) return;
    setIsSavingScore(true);
    try {
      const summaryRef = doc(db, "bookings", bookingId, "summary", "data");
      await setDoc(summaryRef, {
        ...summaryData,
      }, { merge: true });
      setIsEditingScore(false);
    } catch (err) {
      console.error("Failed to save score:", err);
    } finally {
      setIsSavingScore(false);
    }
  };

  // Add custom player (write-in option)
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !newPlayerName.trim()) return;

    const trimmedName = newPlayerName.trim();
    if (summaryData.candidates.includes(trimmedName)) {
      setNewPlayerName("");
      return;
    }

    const updatedCandidates = [...summaryData.candidates, trimmedName];
    try {
      const summaryRef = doc(db, "bookings", bookingId, "summary", "data");
      await setDoc(summaryRef, {
        candidates: updatedCandidates,
      }, { merge: true });
      setNewPlayerName("");
    } catch (err) {
      console.error("Failed to add player candidate:", err);
    }
  };

  // Vote for a player
  const handleVote = async (playerName: string) => {
    if (!bookingId || !user) return;
    setVoteSubmitting(true);
    try {
      const voteRef = doc(db, "bookings", bookingId, "motmVotes", user.uid);
      await setDoc(voteRef, {
        userId: user.uid,
        votedForName: playerName,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to submit vote:", err);
    } finally {
      setVoteSubmitting(false);
    }
  };

  // Share results
  const handleShare = async () => {
    const leader = getWinner();
    const shareText = `Check out the Match Summary for our game at ${booking?.turfName}! Score: Home ${summaryData.homeScore} - ${summaryData.awayScore} Away. ${leader ? `🏆 Man of the Match: ${leader.name} (${leader.percentage}% of votes!)` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Match Summary & MotM",
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText + " \n" + window.location.href);
        alert("Match summary link copied to clipboard!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate vote metrics
  const getVoteCounts = () => {
    const counts: { [name: string]: number } = {};
    summaryData.candidates.forEach((c) => {
      counts[c] = 0;
    });

    votes.forEach((v) => {
      if (counts[v.votedForName] !== undefined) {
        counts[v.votedForName] += 1;
      } else {
        // Handle custom players that might not have been in static candidates originally
        counts[v.votedForName] = 1;
      }
    });

    return counts;
  };

  const voteCounts = getVoteCounts();
  const totalVotesCast = votes.length;

  const getWinner = () => {
    if (totalVotesCast === 0) return null;
    let maxVotes = -1;
    let winnerName = "";

    Object.entries(voteCounts).forEach(([name, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerName = name;
      }
    });

    return {
      name: winnerName,
      votes: maxVotes,
      percentage: totalVotesCast > 0 ? Math.round((maxVotes / totalVotesCast) * 100) : 0,
    };
  };

  const currentLeader = getWinner();

  if (loading || !booking) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-app-base text-white">
          <Loader2 className="animate-spin text-primary-lime h-10 w-10 mb-4" />
          <p className="text-zinc-400 font-display font-medium text-sm">Synchronizing Match Data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#0e0f12] text-text-primary font-body pb-32">
        {/* Navigation Header */}
        <div className="p-4 flex items-center justify-between max-w-xl mx-auto sticky top-0 bg-[#fafafa]/90 dark:bg-[#0e0f12]/90 backdrop-blur-md z-40">
          <button 
            onClick={() => navigate("/bookings")} 
            className="w-11 h-11 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime"
            id="back-to-bookings-btn"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">Match Arena</h1>
          <button 
            onClick={handleShare}
            className="w-11 h-11 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="p-4 mt-4 max-w-xl mx-auto space-y-4">
          {/* Match Status Card */}
          <div className="bg-surface-card border border-border-subtle rounded-[16px] p-4 shadow-sm overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="bg-amber-50 dark:bg-primary-lime/10 text-amber-600 dark:text-primary-lime text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary-lime/20 inline-block mb-3">
                  Match Concluded
                </span>
                <h2 className="text-xl font-black text-text-primary leading-tight">{booking.turfName}</h2>
                <div className="flex items-center gap-2 text-text-secondary text-xs mt-2 font-medium">
                  <MapPin size={12} className="text-primary-lime" />
                  <span>{booking.location || "Kampala, Uganda"}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-surface-raised text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full block">
                  FT
                </span>
              </div>
            </div>

            {/* Stadium Scoreboard */}
            <div className="bg-surface-raised border border-border-subtle rounded-[20px] p-4 flex items-center justify-between relative shadow-inner">
              <div className="flex-1 text-center">
                <p className="text-text-secondary font-bold text-[11px] uppercase tracking-wider mb-2">Team A</p>
                <span className="text-5xl font-black text-text-primary tracking-tighter">
                  {summaryData.homeScore}
                </span>
              </div>

              <div className="px-4 text-slate-300 dark:text-zinc-600 font-black text-xl italic shrink-0">VS</div>

              <div className="flex-1 text-center">
                <p className="text-text-secondary font-bold text-[11px] uppercase tracking-wider mb-2">Team B</p>
                <span className="text-5xl font-black text-text-primary tracking-tighter">
                  {summaryData.awayScore}
                </span>
              </div>
            </div>

            {/* Score Modifier Actions */}
            <div className="mt-5 flex justify-center">
              {!isEditingScore ? (
                <button
                  onClick={() => setIsEditingScore(true)}
                  className="px-4 py-2.5 bg-surface-raised hover:bg-surface-raised dark:hover:bg-zinc-700 text-text-secondary rounded-full text-xs font-bold transition-colors shadow-sm active:scale-95"
                  id="edit-score-btn"
                >
                  Modify Score
                </button>
              ) : (
                <div className="w-full space-y-4 pt-4 border-t border-border-subtle animate-fadeIn">
                  <p className="text-center text-xs text-text-secondary font-medium">Use controls to record the final score:</p>
                  
                  <div className="flex justify-around items-center">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSummaryData(prev => ({ ...prev, homeScore: Math.max(0, prev.homeScore - 1) }))}
                        className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-primary font-bold hover:bg-surface-raised shadow-sm"
                        id="team-a-minus"
                      >
                        -
                      </button>
                      <span className="text-xl font-black w-8 text-center text-text-primary">{summaryData.homeScore}</span>
                      <button 
                        onClick={() => setSummaryData(prev => ({ ...prev, homeScore: prev.homeScore + 1 }))}
                        className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-primary font-bold hover:bg-surface-raised shadow-sm"
                        id="team-a-plus"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSummaryData(prev => ({ ...prev, awayScore: Math.max(0, prev.awayScore - 1) }))}
                        className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-primary font-bold hover:bg-surface-raised shadow-sm"
                        id="team-b-minus"
                      >
                        -
                      </button>
                      <span className="text-xl font-black w-8 text-center text-text-primary">{summaryData.awayScore}</span>
                      <button 
                        onClick={() => setSummaryData(prev => ({ ...prev, awayScore: prev.awayScore + 1 }))}
                        className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-primary font-bold hover:bg-surface-raised shadow-sm"
                        id="team-b-plus"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsEditingScore(false);
                        // Refresh from state to rollback
                        setSummaryData(prev => ({ ...prev }));
                      }}
                      className="flex-1 py-3 bg-surface-raised hover:bg-surface-raised dark:hover:bg-zinc-700 text-text-secondary rounded-full text-[13px] font-bold shadow-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveScore}
                      disabled={isSavingScore}
                      className="flex-1 py-3 bg-primary-lime hover:bg-[#96E600] text-white rounded-full text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all"
                      id="save-score-btn"
                    >
                      {isSavingScore ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save Scores
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-card p-4 rounded-[20px] border border-border-subtle text-center shadow-sm">
              <Calendar size={18} className="mx-auto mb-2 text-primary-lime" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Date</p>
              <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mt-1 truncate">
                {new Date(booking.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="bg-surface-card p-4 rounded-[20px] border border-border-subtle text-center shadow-sm">
              <Clock size={18} className="mx-auto mb-2 text-primary-lime" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Time</p>
              <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mt-1 truncate">{booking.time}</p>
            </div>
            <div className="bg-surface-card p-4 rounded-[20px] border border-border-subtle text-center shadow-sm">
              <Users size={18} className="mx-auto mb-2 text-primary-lime" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Votes Cast</p>
              <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 mt-1">{totalVotesCast}</p>
            </div>
          </div>

          {/* MotM Winner Spotlight (If there are votes) */}
          <AnimatePresence>
            {currentLeader && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-50 dark:bg-primary-lime/5 border border-primary-lime/20 rounded-[16px] p-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 text-primary-lime/10 pointer-events-none">
                  <Trophy size={120} strokeWidth={1} />
                </div>
                <div className="flex gap-4 items-center relative z-10">
                  <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center border border-amber-200 dark:border-primary-lime/20 text-primary-lime shrink-0 shadow-sm text-2xl">
                    🏆
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-primary-lime mb-1 block">
                      Man of the Match Leader
                    </span>
                    <h3 className="text-[17px] font-black text-text-primary leading-tight">
                      {currentLeader.name}
                    </h3>
                    <p className="text-[12px] text-text-secondary mt-1 font-medium">
                      Leading with <span className="text-amber-600 dark:text-primary-lime font-bold">{currentLeader.votes} {currentLeader.votes === 1 ? "vote" : "votes"}</span> ({currentLeader.percentage}%)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Match Summary Voting section */}
          <div className="bg-surface-card rounded-[16px] p-4  border border-border-subtle shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-[16px] font-black text-text-primary flex items-center gap-2">
                  <Award className="text-primary-lime" size={18} />
                  Vote for Man of the Match
                </h3>
                <p className="text-[12px] text-text-secondary mt-1 font-medium">Select the player who dominated the pitch today.</p>
              </div>
            </div>

            {/* Voting Options */}
            <div className="space-y-3">
              {summaryData.candidates.map((player) => {
                const votesForPlayer = voteCounts[player] || 0;
                const percentage = totalVotesCast > 0 ? Math.round((votesForPlayer / totalVotesCast) * 100) : 0;
                const isUserSelection = userVote === player;
                const isLeader = currentLeader && currentLeader.name === player;

                return (
                  <div key={player} className={`relative overflow-hidden rounded-[16px] border transition-all ${isUserSelection ? "border-primary-lime bg-amber-50/50 dark:bg-amber-900/10" : "border-border-subtle"} p-4`}>
                    {/* Progress Bar Background */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`absolute top-0 left-0 bottom-0 ${isUserSelection ? "bg-amber-100/50 dark:bg-primary-lime/10" : isLeader ? "bg-amber-50/50 dark:bg-primary-lime/5" : "bg-surface-raised/50"} pointer-events-none z-0`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border ${isUserSelection ? "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-primary-lime/30 text-primary-lime" : "bg-surface-raised border-border-subtle text-text-secondary"}`}>
                          {player.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[14px] text-text-primary flex items-center gap-2">
                            {player}
                            {isUserSelection && (
                              <span className="bg-primary-lime text-accent-text text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                                Your Vote
                              </span>
                            )}
                            {isLeader && (
                              <span className="text-primary-lime text-xs">👑</span>
                            )}
                          </span>
                          <span className="text-[11px] text-text-secondary font-medium block mt-0.5">
                            {votesForPlayer} {votesForPlayer === 1 ? "vote" : "votes"} ({percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Vote Action */}
                      <button
                        onClick={() => handleVote(player)}
                        disabled={voteSubmitting || isUserSelection}
                        className={`px-4 py-2 text-[12px] font-bold rounded-full transition-all active:scale-95 shadow-sm ${
                          isUserSelection 
                            ? "bg-primary-lime text-accent-text border-none shadow-primary-lime/20" 
                            : "bg-surface-card text-text-primary border border-border-subtle hover:bg-surface-raised"
                        }`}
                      >
                        {isUserSelection ? <Check size={14} className="mx-auto" /> : "Vote"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Write-In Candidate Form */}
            <form onSubmit={handleAddPlayer} className="mt-5 pt-5 border-t border-border-subtle flex gap-2">
              <input
                type="text"
                placeholder="Enter write-in player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-[14px] px-4 py-3 font-medium text-[13px] outline-none transition-all text-text-primary"
                maxLength={25}
                id="write-in-player-input"
              />
              <button
                type="submit"
                disabled={!newPlayerName.trim()}
                className="w-12 h-12 bg-primary-lime text-accent-text rounded-[14px] hover:bg-[#95e600] transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm active:scale-95"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
