import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  limit,
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Team, TeamMember } from "../types/firebase";
import { communityActivityService } from "./communityActivityService";
import { chatService } from "./chatService";
import { SITE_URL } from "../utils/contact";

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
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  return `${origin}/teams/join/${encodeURIComponent(inviteCode)}`;
}

function sanitizeAvatar(v: unknown): string {
  return typeof v === "string" && v.startsWith("https://") && v.length <= 1000 ? v : "";
}

// Built-in starter teams (empty for self-serve mode)
export const DEFAULT_TEAMS: Team[] = [];

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
    const initialMembers = team.members || [];
    const memberIds = Array.from(
      new Set(
        [team.captainId, ...initialMembers.map((m) => m.userId)].filter(
          (uid): uid is string => Boolean(uid)
        )
      )
    );
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
      members: initialMembers,
      memberIds,
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
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error("Please sign in to join this squad.");
    }
    if (player.userId && player.userId !== currentUid) {
      throw new Error("Authenticated user mismatch. Please sign in again.");
    }

    const team = await this.getByInviteCode(inviteCode);
    if (!team) {
      throw new Error(`Invalid or expired squad invite code: "${inviteCode}"`);
    }

    const currentMembers = team.members || [];
    const existingMemberIds = team.memberIds || [];
    const isAlreadyInMembers = currentMembers.some((m) => m.userId === currentUid);

    if (isAlreadyInMembers) {
      // Ensure user is also synced into team chat even if already on roster
      const chatParticipantIds = Array.from(
        new Set(
          [team.captainId, ...currentMembers.map((m) => m.userId), currentUid].filter(
            (uid): uid is string => Boolean(uid)
          )
        )
      );
      await chatService.createTeamConversation(team.id, team.name, chatParticipantIds);
      return { team, isNewMember: false };
    }

    const now = new Date().toISOString();
    const newMember: TeamMember = {
      id: `m_${currentUid}`,
      userId: currentUid,
      name: player.name,
      contact: player.contact || "",
      isCaptain: false,
      role: "player",
      hasPaid: false,
      avatar: sanitizeAvatar(player.avatar),
      joinedAt: now,
      status: "active",
      paymentStatus: "pending",
    };

    const updatedMembers = [...currentMembers, newMember];
    const updatedMemberIds = Array.from(new Set([...existingMemberIds, currentUid]));
    const updatedTeam: Team = {
      ...team,
      members: updatedMembers,
      memberIds: updatedMemberIds,
      updatedAt: now,
    };

    // Update only changed fields in Firestore; surface errors cleanly
    const docRef = doc(db, COLLECTION_NAME, team.id);
    await updateDoc(docRef, {
      members: updatedMembers,
      memberIds: arrayUnion(currentUid),
      updatedAt: now,
    });

    // Update local cache only after Firestore succeeds
    this.saveToLocalCache(updatedTeam);

    // Add joined player to the team conversation
    const chatParticipantIds = Array.from(
      new Set(
        [team.captainId, ...updatedMembers.map((m) => m.userId), currentUid].filter(
          (uid): uid is string => Boolean(uid)
        )
      )
    );
    await chatService.createTeamConversation(team.id, team.name, chatParticipantIds);

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
