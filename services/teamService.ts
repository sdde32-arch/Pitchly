import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Team, TeamMember } from "../types/firebase";
import { communityActivityService } from "./communityActivityService";

const COLLECTION_NAME = "teams";
const LOCAL_STORAGE_PREFIX = "pitchly_teams_cache";

/**
 * Generate a memorable, URL-safe unique squad invite code
 * e.g. "NTINDA-7F2A" or "KAMPALA-X9K3"
 */
export function generateSquadInviteCode(teamName: string = "SQUAD"): string {
  const cleanName = teamName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "SQUAD";
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}-${randomSuffix}`;
}

/**
 * Generate full shareable invite URL
 */
export function generateSquadInviteUrl(inviteCode: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://pitchly.app";
  return `${origin}/teams/join/${encodeURIComponent(inviteCode)}`;
}

// Built-in starter teams for zero-latency initial load and offline demos
export const DEFAULT_TEAMS: Team[] = [
  {
    id: "team-ntinda-legends",
    name: "Ntinda Legends",
    type: "7-a-side",
    location: "Ntinda Arena Turf",
    description: "Competitive Friday night 7v7 squad. High tempo, positive vibes, looking for agile wingers.",
    captainId: "demo-user-id",
    ownerId: "demo-user-id",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "ACTIVE",
    inviteCode: "NTINDA-7701",
    inviteUrl: generateSquadInviteUrl("NTINDA-7701"),
    members: [
      {
        id: "m1",
        userId: "demo-user-id",
        name: "John Doe",
        contact: "+256 770 000 000",
        isCaptain: true,
        role: "captain",
        hasPaid: true,
        joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: "m2",
        name: "Kato Paul",
        contact: "+256 782 123 456",
        isCaptain: false,
        role: "player",
        hasPaid: true,
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
        joinedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: "m3",
        name: "Mike Ross",
        contact: "+256 754 123 456",
        isCaptain: false,
        role: "player",
        hasPaid: false,
        joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: "m4",
        name: "Harvey S.",
        contact: "+256 701 123 456",
        isCaptain: false,
        role: "vice_captain",
        hasPaid: true,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        joinedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "team-lugogo-titans",
    name: "Lugogo Titans",
    type: "7-a-side",
    location: "Lugogo Sports Complex",
    description: "Fast-breaking counter-attack specialists. Weekend morning fixtures and regional tournaments.",
    captainId: "user-capt-2",
    ownerId: "user-capt-2",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    status: "ACTIVE",
    inviteCode: "TITANS-9924",
    inviteUrl: generateSquadInviteUrl("TITANS-9924"),
    members: [
      {
        id: "lt-1",
        name: "Brian Mugerwa",
        contact: "+256 702 334 455",
        isCaptain: true,
        role: "captain",
        hasPaid: true,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      },
      {
        id: "lt-2",
        name: "Emmanuel Ssebo",
        contact: "+256 772 889 900",
        isCaptain: false,
        role: "player",
        hasPaid: true,
      },
      {
        id: "lt-3",
        name: "David Ochieng",
        contact: "+256 788 112 233",
        isCaptain: false,
        role: "player",
        hasPaid: true,
      },
    ],
  },
];

export const teamService = {
  collectionPath: COLLECTION_NAME,

  /**
   * Create a new team with unique invite code & persistence
   */
  async create(team: Partial<Team> & { name: string; captainId: string }): Promise<Team> {
    const teamId = team.id || `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteCode = team.inviteCode || generateSquadInviteCode(team.name);
    const inviteUrl = generateSquadInviteUrl(inviteCode);

    const now = new Date().toISOString();
    const newTeam: Team = {
      id: teamId,
      name: team.name,
      description: team.description || "",
      type: team.type || "7-a-side",
      location: team.location || "Kampala",
      logo: team.logo || "",
      captainId: team.captainId,
      ownerId: team.ownerId || team.captainId,
      createdAt: team.createdAt || now,
      updatedAt: now,
      status: "ACTIVE",
      inviteCode,
      inviteUrl,
      members: team.members || [],
    };

    // Save to Firestore
    try {
      const docRef = doc(db, COLLECTION_NAME, teamId);
      await setDoc(docRef, newTeam);
    } catch (error) {
      console.warn("Firestore team create offline/fallback:", error);
    }

    // Save to local cache
    this.saveToLocalCache(newTeam);

    // Announce to Community Feed
    communityActivityService
      .publishActivity({
        type: "team_formed",
        title: `${newTeam.name} Formed`,
        subtitle: `Founded by Captain (${newTeam.type})`,
        description:
          newTeam.description ||
          `New squad registered in ${newTeam.location}. Join via invite code: ${newTeam.inviteCode}`,
        timestamp: new Date().toISOString(),
        userName: newTeam.members?.[0]?.name || "Team Captain",
        userAvatar: newTeam.members?.[0]?.avatar,
        userBadge: "Club Founder",
        venue: newTeam.location,
        teamData: {
          teamName: newTeam.name,
          captain: newTeam.members?.[0]?.name || "Captain",
          membersCount: newTeam.members?.length || 1,
          homePitch: newTeam.location,
          badgeColor: "#A8FF00",
          badgeInitials: newTeam.name.substring(0, 2).toUpperCase(),
          motto: newTeam.description,
        },
      })
      .catch(() => {});

    return newTeam;
  },

  /**
   * Fetch team by ID
   */
  async getById(id: string): Promise<Team | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Team;
        // Ensure inviteCode exists
        if (!data.inviteCode) {
          data.inviteCode = generateSquadInviteCode(data.name);
          data.inviteUrl = generateSquadInviteUrl(data.inviteCode);
        }
        return data;
      }
    } catch (error) {
      console.warn(`Firestore getById error for ${id}, using local fallback:`, error);
    }

    // Check local storage or defaults
    const local = this.getAllLocalTeams();
    const found = local.find((t) => t.id === id);
    if (found) return found;

    return DEFAULT_TEAMS.find((t) => t.id === id) || null;
  },

  /**
   * Find a team by its unique invite code (Case-insensitive)
   */
  async getByInviteCode(code: string): Promise<Team | null> {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    // 1. Try querying Firestore
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("inviteCode", "==", cleanCode),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Team;
      }
    } catch (error) {
      console.warn("Firestore query by inviteCode failed, checking local cache:", error);
    }

    // 2. Try Local Cache & Defaults
    const local = this.getAllLocalTeams();
    const foundLocal = local.find(
      (t) => (t.inviteCode || "").toUpperCase() === cleanCode
    );
    if (foundLocal) return foundLocal;

    const foundDefault = DEFAULT_TEAMS.find(
      (t) => (t.inviteCode || "").toUpperCase() === cleanCode
    );
    if (foundDefault) return foundDefault;

    // Check if code matches a team ID directly
    return this.getById(cleanCode.toLowerCase());
  },

  /**
   * Regenerate invite code for a team (Captains only)
   */
  async regenerateInviteCode(teamId: string, teamName: string): Promise<{ inviteCode: string; inviteUrl: string }> {
    const inviteCode = generateSquadInviteCode(teamName);
    const inviteUrl = generateSquadInviteUrl(inviteCode);

    try {
      const docRef = doc(db, COLLECTION_NAME, teamId);
      await updateDoc(docRef, { inviteCode, inviteUrl, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.warn("Firestore regenerate inviteCode error:", error);
    }

    // Update local cache
    const team = await this.getById(teamId);
    if (team) {
      team.inviteCode = inviteCode;
      team.inviteUrl = inviteUrl;
      this.saveToLocalCache(team);
    }

    return { inviteCode, inviteUrl };
  },

  /**
   * Join a team directly using an invite code
   */
  async joinByInviteCode(
    inviteCode: string,
    player: {
      userId: string;
      name: string;
      contact?: string;
      avatar?: string;
    }
  ): Promise<{ team: Team; isNewMember: boolean }> {
    const team = await this.getByInviteCode(inviteCode);
    if (!team) {
      throw new Error(`Invalid or expired squad invite code: "${inviteCode}"`);
    }

    const currentMembers = team.members || [];
    const existingIndex = currentMembers.findIndex(
      (m) => (m.userId && m.userId === player.userId) || m.name.toLowerCase() === player.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // User is already a member
      return { team, isNewMember: false };
    }

    const newMember: TeamMember = {
      id: `m_${player.userId || Date.now()}`,
      userId: player.userId,
      name: player.name,
      contact: player.contact || "",
      isCaptain: false,
      role: "player",
      hasPaid: false,
      avatar: player.avatar || "",
      joinedAt: new Date().toISOString(),
      status: "active",
      paymentStatus: "pending",
    };

    const updatedMembers = [...currentMembers, newMember];
    const updatedTeam: Team = {
      ...team,
      members: updatedMembers,
      updatedAt: new Date().toISOString(),
    };

    // Update in Firestore
    try {
      const docRef = doc(db, COLLECTION_NAME, team.id);
      await setDoc(docRef, updatedTeam, { merge: true });
    } catch (error) {
      console.warn("Firestore join team save error:", error);
    }

    // Update local cache
    this.saveToLocalCache(updatedTeam);

    // Announce to Community Feed
    communityActivityService
      .publishActivity({
        type: "team_update",
        title: `${player.name} Joined ${team.name}!`,
        subtitle: `New squad signing via Invite Link`,
        description: `Welcome ${player.name} to the roster! ${team.name} now has ${updatedMembers.length} active players.`,
        timestamp: new Date().toISOString(),
        userName: player.name,
        userAvatar: player.avatar,
        userBadge: "New Signing",
        venue: team.location,
        teamData: {
          teamName: team.name,
          captain: team.members?.[0]?.name || "Captain",
          membersCount: updatedMembers.length,
          homePitch: team.location,
          badgeColor: "#A8FF00",
          badgeInitials: team.name.substring(0, 2).toUpperCase(),
        },
      })
      .catch(() => {});

    return { team: updatedTeam, isNewMember: true };
  },

  /**
   * List all teams for a user (as captain or member)
   */
  async listByUser(userId: string): Promise<Team[]> {
    const teamsMap = new Map<string, Team>();

    // 1. Try fetching from Firestore
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("status", "==", "ACTIVE")
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const team = docSnap.data() as Team;
        const isMember =
          team.captainId === userId ||
          team.ownerId === userId ||
          (team.members || []).some((m) => m.userId === userId);
        if (isMember) {
          if (!team.inviteCode) {
            team.inviteCode = generateSquadInviteCode(team.name);
            team.inviteUrl = generateSquadInviteUrl(team.inviteCode);
          }
          teamsMap.set(team.id, team);
        }
      });
    } catch (error) {
      console.warn("Firestore listByUser error, falling back to local:", error);
    }

    // 2. Merge local cache
    const local = this.getAllLocalTeams();
    local.forEach((team) => {
      const isMember =
        team.captainId === userId ||
        team.ownerId === userId ||
        (team.members || []).some((m) => m.userId === userId);
      if (isMember && !teamsMap.has(team.id)) {
        teamsMap.set(team.id, team);
      }
    });

    // 3. Fallback to default teams if user has none
    if (teamsMap.size === 0) {
      DEFAULT_TEAMS.forEach((t) => {
        teamsMap.set(t.id, t);
      });
    }

    return Array.from(teamsMap.values());
  },

  /**
   * List public squads for discovery
   */
  async listPublic(): Promise<Team[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Team);
      }
    } catch (error) {
      console.warn("Firestore listPublic error:", error);
    }
    return [...DEFAULT_TEAMS, ...this.getAllLocalTeams()];
  },

  // --- Local Cache Helpers ---
  saveToLocalCache(team: Team) {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getAllLocalTeams();
      const filtered = existing.filter((t) => t.id !== team.id);
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX,
        JSON.stringify([team, ...filtered])
      );
    } catch (e) {
      console.warn("Local storage save error:", e);
    }
  },

  getAllLocalTeams(): Team[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
