import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import {
  Plus,
  Users,
  X,
  Share2,
  Shield,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Copy,
  Search,
  ChevronLeft,
  Loader2,
  Target,
  Calendar,
  Trash2,
  UserPlus,
  Trophy,
  Zap,
  Clock,
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { AuthPromptModal } from "../components/AuthPromptModal";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { EmptyState } from "../components/ui/EmptyState";
import { MatchCardSkeleton, SquadCardSkeleton } from "../components/ui/Skeleton";

const parseTime = (timeStr: string) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = (time || "00:00").split(":").map(Number);
  if (hours === 12) hours = 0;
  if (modifier === "PM") hours += 12;
  return { hours, minutes };
};

const MatchCountdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-1.5">
      {[
        { label: "D", value: timeLeft.days },
        { label: "H", value: timeLeft.hours },
        { label: "M", value: timeLeft.minutes },
        { label: "S", value: timeLeft.seconds },
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-8 h-8 bg-surface-raised rounded-[8px] flex items-center justify-center border border-border-subtle">
            <span className="text-xs font-semibold text-text-primary font-mono">
              {unit.value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-[8px] font-medium text-slate-400 mt-0.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};

interface Member {
  id: string;
  name: string;
  contact: string;
  isCaptain: boolean;
  hasPaid: boolean;
  avatar?: string;
  userId?: string;
  status?: string;
  paymentStatus?: "paid" | "pending" | "waived";
}

interface Team {
  id: string;
  name: string;
  type?: string;
  location?: string;
  description?: string;
  logo?: string;
  members: Member[];
  ownerId?: string;
}

interface Match {
  id: string;
  title: string;
  pitchId: string;
  pitchName: string;
  date: string;
  time: string;
  type: string;
  playersNeeded: number;
  joinedPlayers: Member[];
  captainId: string;
  visibility: "Public" | "Private";
  status: "Open" | "Full" | "Completed";
  notes: string;
  createdAt: string;
  payment?: {
    totalCost: number;
    costPerPlayer: number;
    collectedAmount: number;
    remainingAmount: number;
    currency: string;
  };
}

const INITIAL_TEAMS: Team[] = [
  {
    id: "team-mock-1",
    name: "Ntinda Legends",
    type: "7-a-side",
    location: "Ntinda, Kampala",
    members: [
      {
        id: "m1",
        name: "John Doe",
        contact: "0770000000",
        isCaptain: true,
        hasPaid: true,
        userId: "demo-user-id",
      },
      {
        id: "m2",
        name: "Kato Paul",
        contact: "0782123456",
        isCaptain: false,
        hasPaid: true,
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
      },
      {
        id: "m3",
        name: "Mike Ross",
        contact: "0754123456",
        isCaptain: false,
        hasPaid: false,
      },
      {
        id: "m4",
        name: "Harvey S.",
        contact: "0701123456",
        isCaptain: false,
        hasPaid: true,
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      },
    ],
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: "match-mock-1",
    title: "Friday Night Lights",
    pitchId: "arena-1",
    pitchName: "Downtown Arena Turf",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    type: "7-a-side",
    playersNeeded: 14,
    joinedPlayers: [
      {
        id: "m1",
        name: "John Doe",
        contact: "0770000000",
        isCaptain: true,
        hasPaid: true,
        userId: "demo-user-id",
        paymentStatus: "paid",
      },
      {
        id: "m2",
        name: "Kato Paul",
        contact: "0782123456",
        isCaptain: false,
        hasPaid: true,
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
        paymentStatus: "pending",
      },
    ],
    captainId: "demo-user-id",
    visibility: "Public",
    status: "Open",
    notes: "Bring a dark and white bib. Standard rules. No metal studs.",
    createdAt: new Date().toISOString(),
    payment: {
      totalCost: 140000,
      costPerPlayer: 10000,
      collectedAmount: 10000,
      remainingAmount: 130000,
      currency: "UGX",
    },
  },
];

export const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { bookings } = useBooking();
  const { userProfile, user } = useUser();
  const [activeTab, setActiveTab] = useState<"MATCHES" | "TEAMS">("MATCHES");
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showJoinPayModal, setShowJoinPayModal] = useState<Match | null>(null);
  const [createStep, setCreateStep] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const [newTeam, setNewTeam] = useState({
    name: "",
    type: "5-a-side",
    location: "",
    description: "",
  });

  const [newMatch, setNewMatch] = useState({
    title: "",
    pitchName: "",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    type: "7-a-side",
    playersNeeded: 14,
    visibility: "Public",
    totalCost: 140000,
    notes: "",
  });

  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const loadData = () => {
      if (user) {
        try {
          const localTeams = localStorage.getItem(`pitchly_teams_${user.uid}`);
          if (localTeams) setTeams(JSON.parse(localTeams));
          const localMatches = localStorage.getItem(`pitchly_matches_${user.uid}`);
          if (localMatches) setMatches(JSON.parse(localMatches));
        } catch (e) {
          console.warn("Could not load local data", e);
        }
      }
      setLoading(false);
    };
    
    // Simulate network latency for a smoother premium feel
    const timer = setTimeout(loadData, 800);
    return () => clearTimeout(timer);
  }, [user]);

  const handleStartCreate = () => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    if (activeTab === "TEAMS") {
      setShowCreateModal(true);
    } else {
      setShowCreateMatchModal(true);
    }
  };

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      setCreateError("Team name is required");
      return;
    }
    const created: Team = {
      id: "team-" + Date.now(),
      name: newTeam.name.trim(),
      type: newTeam.type,
      location: newTeam.location.trim() || "Kampala",
      description: newTeam.description.trim(),
      members: [
        {
          id: "m-capt-" + Date.now(),
          name: userProfile?.name || "Captain",
          contact: userProfile?.phone || "",
          isCaptain: true,
          hasPaid: true,
          userId: user?.uid,
        },
      ],
      ownerId: user?.uid,
    };
    const updated = [created, ...teams];
    setTeams(updated);
    if (user) {
      localStorage.setItem(`pitchly_teams_${user.uid}`, JSON.stringify(updated));
    }
    setShowCreateModal(false);
    setNewTeam({ name: "", type: "5-a-side", location: "", description: "" });
  };

  const handleCreateMatch = () => {
    if (!newMatch.title.trim()) return;
    const costPerPlayer = Math.round(
      (newMatch.totalCost || 0) / (newMatch.playersNeeded || 1)
    );
    const created: Match = {
      id: "match-" + Date.now(),
      title: newMatch.title.trim(),
      pitchId: "custom-" + Date.now(),
      pitchName: newMatch.pitchName.trim() || "Kampala Pitch",
      date: newMatch.date,
      time: newMatch.time,
      type: newMatch.type,
      playersNeeded: newMatch.playersNeeded,
      captainId: user?.uid || "user",
      visibility: newMatch.visibility as "Public" | "Private",
      status: "Open",
      notes: newMatch.notes.trim(),
      createdAt: new Date().toISOString(),
      joinedPlayers: [
        {
          id: "capt-" + Date.now(),
          name: userProfile?.name || "Host",
          contact: userProfile?.phone || "",
          isCaptain: true,
          hasPaid: true,
          userId: user?.uid,
          paymentStatus: "paid",
        },
      ],
      payment: {
        totalCost: newMatch.totalCost,
        costPerPlayer,
        collectedAmount: costPerPlayer,
        remainingAmount: Math.max(0, newMatch.totalCost - costPerPlayer),
        currency: "UGX",
      },
    };
    const updated = [created, ...matches];
    setMatches(updated);
    if (user) {
      localStorage.setItem(`pitchly_matches_${user.uid}`, JSON.stringify(updated));
    }
    setShowCreateMatchModal(false);
    setNewMatch({
      title: "",
      pitchName: "",
      date: new Date().toISOString().split("T")[0],
      time: "19:00",
      type: "7-a-side",
      playersNeeded: 14,
      visibility: "Public",
      totalCost: 140000,
      notes: "",
    });
  };

  const handleJoinMatch = (matchId: string, payNow: boolean) => {
    if (!userProfile) {
      setShowAuthGate(true);
      return;
    }
    const matchToUpdate = matches.find((m) => m.id === matchId);
    if (!matchToUpdate) return;

    const newMember: Member = {
      id: "me-" + Date.now(),
      name: userProfile.name,
      contact: userProfile.phone || "",
      isCaptain: false,
      hasPaid: payNow,
      userId: userProfile.id,
      paymentStatus: payNow ? "paid" : "pending",
    };

    const updatedMembers = [...matchToUpdate.joinedPlayers, newMember];
    const newCollected =
      updatedMembers.filter((m) => m.paymentStatus === "paid").length *
      (matchToUpdate.payment?.costPerPlayer || 0);

    const updatedMatches = matches.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        joinedPlayers: updatedMembers,
        payment: m.payment
          ? {
              ...m.payment,
              collectedAmount: newCollected,
              remainingAmount: Math.max(0, m.payment.totalCost - newCollected),
            }
          : undefined,
      };
    });

    setMatches(updatedMatches);
    setShowJoinPayModal(null);
    if (user) {
      localStorage.setItem(`pitchly_matches_${user.uid}`, JSON.stringify(updatedMatches));
    }
  };

  const handleMatchPaymentStatus = (
    matchId: string,
    memberId: string,
    status: "paid" | "pending" | "waived"
  ) => {
    const matchToUpdate = matches.find((m) => m.id === matchId);
    if (!matchToUpdate) return;
    const updatedMembers = matchToUpdate.joinedPlayers.map((m) =>
      m.id === memberId ? { ...m, paymentStatus: status, hasPaid: status === "paid" } : m
    );
    const newCollected =
      updatedMembers.filter((m) => m.paymentStatus === "paid").length *
      (matchToUpdate.payment?.costPerPlayer || 0);

    const updatedMatches = matches.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        joinedPlayers: updatedMembers,
        payment: m.payment
          ? {
              ...m.payment,
              collectedAmount: newCollected,
              remainingAmount: Math.max(0, m.payment.totalCost - newCollected),
            }
          : undefined,
      };
    });
    setMatches(updatedMatches);
    if (user) {
      localStorage.setItem(`pitchly_matches_${user.uid}`, JSON.stringify(updatedMatches));
    }
  };

  const handleTeamChat = async (team: any) => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    try {
      const participantIds = (team.members || []).map((m: any) => m.userId).filter(Boolean);
      if (!participantIds.includes(user.uid)) {
        participantIds.push(user.uid);
      }
      const convId = await chatService.createTeamConversation(team.id, team.name, participantIds);
      navigate(`/chat/${convId}`);
    } catch (error) {
      console.error("Failed to open team chat", error);
    }
  };

  const getTeamEvents = (teamName: string) => {
    const now = new Date();
    return bookings
      .filter(
        (b) =>
          (b.userName || "").toLowerCase().includes(teamName.toLowerCase()) &&
          b.status !== "CANCELLED"
      )
      .map((b) => {
        const { hours, minutes } = parseTime(b.time);
        const bookingDate = new Date(b.date);
        bookingDate.setHours(hours, minutes, 0, 0);
        return { ...b, sortDate: bookingDate };
      })
      .filter((b) => b.sortDate >= now)
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  };

  const shareMatch = (match: Match) => {
    const text = `Join our match "${match.title}" at ${match.pitchName} on ${match.date} at ${match.time}! Format: ${match.type}. Cost: UGX ${match.payment?.costPerPlayer.toLocaleString() || "Free"}.`;
    if (navigator.share) {
      navigator.share({ title: match.title, text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Match details copied to clipboard!");
    }
  };

  return (
    <Layout>
      <AuthPromptModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        feature="Squads & Matches"
      />

      {/* CREATE SQUAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-card border border-border-subtle w-full max-w-md rounded-2xl p-4  shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <h3 className="text-sm font-medium text-text-primary">
                  Create new squad
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Squad name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ntinda Legends"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Format
                  </label>
                  <select
                    value={newTeam.type}
                    onChange={(e) => setNewTeam({ ...newTeam, type: e.target.value })}
                    className="w-full h-10 px-2 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-primary-lime"
                  >
                    <option value="5-a-side">5-a-side</option>
                    <option value="7-a-side">7-a-side</option>
                    <option value="11-a-side">11-a-side</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Home base
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lugogo"
                    value={newTeam.location}
                    onChange={(e) => setNewTeam({ ...newTeam, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="py-2.5 px-4 rounded-full border border-border-subtle text-xs font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 py-2.5 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors cursor-pointer"
              >
                Create squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOST MATCH MODAL */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-card border border-border-subtle w-full max-w-md rounded-2xl p-4  shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                  <Trophy size={16} />
                </div>
                <h3 className="text-sm font-medium text-text-primary">
                  Host an open match
                </h3>
              </div>
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="w-8 h-8 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Match title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Friday Night 7-a-side"
                  value={newMatch.title}
                  onChange={(e) => setNewMatch({ ...newMatch, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Pitch / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Arena"
                  value={newMatch.pitchName}
                  onChange={(e) => setNewMatch({ ...newMatch, pitchName: e.target.value })}
                  className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    className="w-full h-10 px-2 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-primary-lime"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    className="w-full h-10 px-2 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-primary-lime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Total players
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="22"
                    value={newMatch.playersNeeded}
                    onChange={(e) =>
                      setNewMatch({ ...newMatch, playersNeeded: parseInt(e.target.value) || 10 })
                    }
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Total pitch cost (UGX)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={newMatch.totalCost}
                    onChange={(e) =>
                      setNewMatch({ ...newMatch, totalCost: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="py-2.5 px-4 rounded-full border border-border-subtle text-xs font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMatch}
                disabled={!newMatch.title.trim()}
                className="flex-1 py-2.5 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Host match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN MATCH MODAL */}
      {showJoinPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-card border border-border-subtle w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
              <div>
                <h3 className="text-sm font-medium text-text-primary">
                  Join match roster
                </h3>
                <p className="text-xs text-primary-lime">
                  {showJoinPayModal.title}
                </p>
              </div>
              <button
                onClick={() => setShowJoinPayModal(null)}
                className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-surface-raised rounded-[12px] p-4 text-center border border-border-subtle space-y-1">
              <span className="text-[11px] text-text-secondary">
                Your player contribution
              </span>
              <div className="text-lg font-semibold text-text-primary">
                UGX {showJoinPayModal.payment?.costPerPlayer.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleJoinMatch(showJoinPayModal.id, true)}
                className="w-full py-2.5 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors cursor-pointer"
              >
                Join & mark as paid
              </button>
              <button
                onClick={() => handleJoinMatch(showJoinPayModal.id, false)}
                className="w-full py-2.5 rounded-full bg-surface-raised text-text-secondary text-xs font-medium transition-colors cursor-pointer"
              >
                Join (pay at venue)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN SCREEN */}
      <div id="walkthrough-teams-hub" className="min-h-full bg-app-base text-text-primary font-body pb-24 scroll-mt-24">
        <div className="max-w-xl mx-auto p-4 space-y-5">
          {/* Top Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-base font-medium text-text-primary">
                Squads & Matches
              </h1>
            </div>
            <button
              onClick={handleStartCreate}
              className="px-3.5 py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{activeTab === "MATCHES" ? "Host match" : "New squad"}</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 bg-surface-raised rounded-[12px] flex gap-1 border border-border-subtle">
            <button
              onClick={() => setActiveTab("MATCHES")}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-semibold tracking-wide transition-colors cursor-pointer text-center ${
                activeTab === "MATCHES"
                  ? "bg-[#282a36] text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Open Matches
            </button>
            <button
              onClick={() => setActiveTab("TEAMS")}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-semibold tracking-wide transition-colors cursor-pointer text-center ${
                activeTab === "TEAMS"
                  ? "bg-[#282a36] text-text-primary shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              My Squads
            </button>
          </div>

          {/* OPEN MATCHES TAB */}
          {activeTab === "MATCHES" && (
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <MatchCardSkeleton key={idx} />
                ))
              ) : matches.length === 0 ? (
                <div className="py-12 px-4 text-center bg-surface-card border border-border-subtle rounded-2xl space-y-2">
                  <Target size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs font-medium text-text-primary">
                    No active matches scheduled
                  </p>
                  <p className="text-xs text-text-secondary">
                    Host a game to rally players from across Kampala.
                  </p>
                </div>
              ) : (
                matches.map((match) => {
                  const isDetailed = selectedMatchId === match.id;
                  const slotsFilled = match.joinedPlayers.length;
                  const slotsAvailable = match.playersNeeded;
                  const pct = Math.min((slotsFilled / slotsAvailable) * 100, 100);

                  return (
                    <div
                      key={match.id}
                      className="bg-surface-card rounded-2xl p-4  border border-border-subtle space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                              {match.status}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {match.type} · {match.visibility}
                            </span>
                          </div>
                          <h2 className="text-sm sm:text-base font-medium text-text-primary mt-1">
                            {match.title}
                          </h2>
                        </div>
                        <button
                          onClick={() => shareMatch(match)}
                          className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-slate-500 hover:text-text-primary transition-colors"
                          title="Share invite link"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>

                      <div className="bg-surface-raised rounded-[10px] p-3 text-xs space-y-1.5 border border-border-subtle">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <Target size={13} className="text-primary-lime shrink-0" />
                          <span className="truncate">{match.pitchName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <Calendar size={13} className="text-primary-lime shrink-0" />
                          <span>
                            {match.date} · {match.time}
                          </span>
                        </div>
                      </div>

                      {/* Roster & Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">Roster filling</span>
                          <span className="font-medium text-text-primary">
                            {slotsFilled}/{slotsAvailable} players
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-lime rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Payment summary if enabled */}
                      {match.payment && (
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">per player</span>
                            <span className="font-semibold text-text-primary">
                              UGX {match.payment.costPerPlayer.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">collected</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              UGX {match.payment.collectedAmount.toLocaleString()} /{" "}
                              {match.payment.totalCost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {match.joinedPlayers.some((p) => p.userId === userProfile?.id) ? (
                          <div className="flex-1 py-2 px-3 rounded-full bg-surface-raised text-center text-xs font-medium text-text-secondary">
                            Joined
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowJoinPayModal(match)}
                            className="flex-1 py-2 px-3 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            Join match
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMatchId(isDetailed ? null : match.id)}
                          className="py-2 px-4 rounded-full border border-border-subtle text-xs font-medium text-text-secondary hover:bg-surface-raised transition-colors"
                        >
                          {isDetailed ? "Hide lobby" : "Lobby"}
                        </button>
                      </div>

                      {/* Detailed Lobby Roster */}
                      {isDetailed && (
                        <div className="pt-3 border-t border-border-subtle space-y-2 animate-fadeIn">
                          <p className="text-xs font-medium text-text-secondary">
                            joined players ({match.joinedPlayers.length})
                          </p>
                          <div className="space-y-1.5">
                            {match.joinedPlayers.map((p) => {
                              const isMatchCaptain = match.captainId === user?.uid;
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between p-2.5 bg-surface-raised rounded-[10px] text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-border-subtle flex items-center justify-center font-semibold text-[10px]">
                                      {(p.name || "?")[0]}
                                    </div>
                                    <span className="font-medium text-text-primary">
                                      {p.name}
                                    </span>
                                    {p.isCaptain && (
                                      <span className="text-[9px] bg-primary-lime/15 text-primary-lime px-1.5 py-0.2 rounded-full font-semibold">
                                        Host
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isMatchCaptain && !p.isCaptain ? (
                                      <select
                                        value={p.paymentStatus || "pending"}
                                        onChange={(e) =>
                                          handleMatchPaymentStatus(
                                            match.id,
                                            p.id,
                                            e.target.value as any
                                          )
                                        }
                                        className="h-7 px-2 rounded-[6px] bg-surface-raised border border-border-subtle text-[10px]"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="waived">Waived</option>
                                      </select>
                                    ) : (
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                          p.paymentStatus === "paid"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-primary-lime/10 text-primary-lime"
                                        }`}
                                      >
                                        {p.paymentStatus || "joined"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* MY SQUADS TAB */}
          {activeTab === "TEAMS" && (
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <SquadCardSkeleton key={idx} />
                ))
              ) : teams.length === 0 ? (
                <div className="py-12 px-4 text-center bg-surface-card border border-border-subtle rounded-2xl space-y-2">
                  <Shield size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs font-medium text-text-primary">
                    No squads joined yet
                  </p>
                  <p className="text-xs text-text-secondary">
                    Create a squad or join one with an invite code.
                  </p>
                </div>
              ) : (
                teams.map((team) => {
                  const nextEvent = getTeamEvents(team.name)[0];
                  const isDetailed = selectedTeamId === team.id;

                  return (
                    <div
                      key={team.id}
                      className="bg-surface-card rounded-2xl p-4  border border-border-subtle space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[10px] bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                            <Shield size={20} />
                          </div>
                          <div>
                            <h2 className="text-sm sm:text-base font-medium text-text-primary">
                              {team.name}
                            </h2>
                            <p className="text-xs text-text-secondary">
                              {team.type} · {team.members?.length || 0} players
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Next Match Countdown if available */}
                      {nextEvent && (
                        <div className="bg-surface-raised rounded-[10px] p-3 border border-border-subtle flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-primary-lime font-semibold uppercase tracking-wider block">
                              upcoming fixture
                            </span>
                            <div className="text-xs font-medium text-text-primary">
                              {nextEvent.turfName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {nextEvent.date} · {nextEvent.time}
                            </div>
                          </div>
                          <MatchCountdown targetDate={nextEvent.sortDate} />
                        </div>
                      )}

                      {/* Squad Members Avatars and Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {(team.members || []).slice(0, 4).map((m) => (
                            <div
                              key={m.id}
                              className="w-7 h-7 rounded-full bg-border-subtle border-2 border-surface-card flex items-center justify-center text-[10px] font-semibold"
                            >
                              {(m.name || "?")[0]}
                            </div>
                          ))}
                          {(team.members || []).length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-primary-lime text-accent-text border-2 border-surface-card flex items-center justify-center text-[9px] font-bold">
                              +{(team.members || []).length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTeamChat(team)}
                            className="p-2 rounded-full border border-border-subtle text-text-secondary hover:bg-surface-raised transition-colors"
                            title="Squad Chat"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedTeamId(isDetailed ? null : team.id)}
                            className="py-1.5 px-3 rounded-full bg-primary-lime text-accent-text text-xs font-medium transition-colors"
                          >
                            {isDetailed ? "Close" : "Roster"}
                          </button>
                        </div>
                      </div>

                      {/* Roster Drill-Down */}
                      {isDetailed && (
                        <div className="pt-3 border-t border-border-subtle space-y-2 animate-fadeIn">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-text-secondary">
                              squad members ({team.members?.length})
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {(team.members || []).map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-2.5 bg-surface-raised rounded-[10px] text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-border-subtle flex items-center justify-center font-semibold text-[10px]">
                                    {(m.name || "?")[0]}
                                  </div>
                                  <span className="font-medium text-text-primary">
                                    {m.name}
                                  </span>
                                  {m.isCaptain && (
                                    <span className="text-[9px] bg-primary-lime/15 text-primary-lime px-1.5 py-0.2 rounded-full font-semibold">
                                      Captain
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400">{m.contact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Teams;
