import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { CommunityActivity } from "../types/firebase";

const COLLECTION_NAME = "communityActivities";

// Initial authentic mock feed used during offline or first-run seeding
export const INITIAL_COMMUNITY_ACTIVITIES: CommunityActivity[] = [
  // --- RECENT MATCHES PLAYED ---
  {
    id: "act_match_1",
    type: "match_played",
    title: "Kampala Stars 4 - 2 Ntinda Veterans",
    subtitle: "High-octane 7-a-side thriller under the floodlights",
    description: "Dennis O. put on a clinical finishing masterclass with a first-half hat-trick, sealing the victory in the 48th minute.",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    userName: "Dennis Ochieng",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    userBadge: "Match MVP",
    venue: "Lugogo Arena Turf",
    matchData: {
      homeTeam: "Kampala Stars",
      awayTeam: "Ntinda Veterans",
      homeScore: 4,
      awayScore: 2,
      scorers: ["Dennis O. (12', 24', 38')", "Kigozi B. (48')", "Mukasa P. (19')", "Okello J. (42')"],
      mvp: "Dennis Ochieng (Kampala Stars)",
      pitchName: "Lugogo Arena Turf",
      format: "7-a-side",
    },
    likesCount: 14,
    celebrationsCount: 8,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_match_2",
    type: "match_played",
    title: "Bugolobi Ballers 3 - 3 Muyenga Strikers",
    subtitle: "Dramatic 6-goal draw with 89th-minute equalizer",
    description: "A back-and-forth battle where Muyenga's Tendo scored a sensational curling free kick with the final kick of the match.",
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // 1.5 hrs ago
    userName: "Coach Ronald",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    userBadge: "Organizer",
    venue: "Fusion Sports Bugolobi",
    matchData: {
      homeTeam: "Bugolobi Ballers",
      awayTeam: "Muyenga Strikers",
      homeScore: 3,
      awayScore: 3,
      scorers: ["Ronald K. (15', 30')", "Paul S. (55')", "Tendo A. (22', 89')", "Ivan B. (65')"],
      mvp: "Tendo Alex (Muyenga Strikers)",
      pitchName: "Fusion Sports Bugolobi",
      format: "8-a-side",
    },
    likesCount: 19,
    celebrationsCount: 11,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_match_3",
    type: "match_played",
    title: "Kyanja United 5 - 1 Naguru All-Stars",
    subtitle: "Dominant attacking showcase at Kyanja Arena",
    description: "Kyanja United commanded possession from kick-off, scoring 4 goals in the opening twenty minutes.",
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(), // 3.5 hrs ago
    userName: "Arthur Mugabi",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    userBadge: "Captain",
    venue: "Kyanja Arena",
    matchData: {
      homeTeam: "Kyanja United",
      awayTeam: "Naguru All-Stars",
      homeScore: 5,
      awayScore: 1,
      scorers: ["Arthur M. (5', 18')", "Moses K. (12')", "Derrick O. (40')", "Brian T. (52')", "Kasumba R. (33')"],
      mvp: "Arthur Mugabi (Kyanja United)",
      pitchName: "Kyanja Arena",
      format: "6-a-side",
    },
    likesCount: 9,
    celebrationsCount: 5,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_match_4",
    type: "match_played",
    title: "Kololo Royals 2 - 1 Nsambya Lions",
    subtitle: "Tactical masterclass decided in stoppage time",
    description: "Kololo Royals held off a late barrage from Nsambya Lions after George K. chipped the keeper in the 88th minute.",
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(), // 6 hrs ago
    userName: "George Kakande",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    userBadge: "Striker",
    venue: "Tal Olympic Stadium",
    matchData: {
      homeTeam: "Kololo Royals",
      awayTeam: "Nsambya Lions",
      homeScore: 2,
      awayScore: 1,
      scorers: ["Henry W. (34')", "George K. (88')", "Brian N. (62')"],
      mvp: "George Kakande (Kololo Royals)",
      pitchName: "Tal Olympic Stadium",
      format: "7-a-side",
    },
    likesCount: 22,
    celebrationsCount: 13,
    likedBy: [],
    celebratedBy: [],
  },

  // --- NEW TEAMS FORMED ---
  {
    id: "act_team_1",
    type: "team_formed",
    title: "Lugogo Thunder FC Formed",
    subtitle: "Founded by Captain Brian Kyobe with 9 confirmed players",
    description: "Official grassroot squad formed to compete in midweek Kampala floodlight tournaments. Currently scouting for a goalkeeper.",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 mins ago
    userName: "Brian Kyobe",
    userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    userBadge: "Club Founder",
    venue: "Lugogo Hockey Ground Turf",
    teamData: {
      teamName: "Lugogo Thunder FC",
      captain: "Brian Kyobe",
      membersCount: 9,
      homePitch: "Lugogo Hockey Ground Turf",
      badgeColor: "#A8FF00",
      badgeInitials: "LT",
      motto: "Pace, Precision & Unyielding Spirit",
    },
    likesCount: 27,
    celebrationsCount: 16,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_team_2",
    type: "team_formed",
    title: "Ggaba Waves SC Registered",
    subtitle: "New lakeside squad led by Coach Ivan Mukasa",
    description: "Formed with 8 core players from the Ggaba and Munyonyo areas. Looking for weekend 7-a-side sparring matches.",
    timestamp: new Date(Date.now() - 170 * 60 * 1000).toISOString(), // ~3 hrs ago
    userName: "Ivan Mukasa",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    userBadge: "Head Coach",
    venue: "Tal Olympic Stadium",
    teamData: {
      teamName: "Ggaba Waves SC",
      captain: "Ivan Mukasa",
      membersCount: 8,
      homePitch: "Tal Olympic Stadium",
      badgeColor: "#38bdf8",
      badgeInitials: "GW",
      motto: "Lake Breeze Dominance & Fast Breaks",
    },
    likesCount: 18,
    celebrationsCount: 12,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_team_3",
    type: "team_formed",
    title: "Bunga Titans FC Squad Activated",
    subtitle: "Solomon Tumwesigye officially registered 11 players",
    description: "Squad roster finalized for the upcoming weekend league. Full navy and neon kits revealed.",
    timestamp: new Date(Date.now() - 310 * 60 * 1000).toISOString(), // 5 hrs ago
    userName: "Solomon Tumwesigye",
    userAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
    userBadge: "Manager",
    venue: "Fusion Sports Bugolobi",
    teamData: {
      teamName: "Bunga Titans FC",
      captain: "Solomon Tumwesigye",
      membersCount: 11,
      homePitch: "Fusion Sports Bugolobi",
      badgeColor: "#f59e0b",
      badgeInitials: "BT",
      motto: "Built for Greatness • United as One",
    },
    likesCount: 31,
    celebrationsCount: 20,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_team_4",
    type: "team_formed",
    title: "Ntinda Strykers FC Launched",
    subtitle: "Speed and agility squad founded by David Mugisha",
    description: "7 dynamic players assembled, ready for high-intensity 5-a-side and 7-a-side friendly challenges.",
    timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(), // 8 hrs ago
    userName: "David Mugisha",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    userBadge: "Captain",
    venue: "Kyanja Arena",
    teamData: {
      teamName: "Ntinda Strykers FC",
      captain: "David Mugisha",
      membersCount: 7,
      homePitch: "Kyanja Arena",
      badgeColor: "#ec4899",
      badgeInitials: "NS",
      motto: "Fast Footwork, Relentless Pressure",
    },
    likesCount: 15,
    celebrationsCount: 9,
    likedBy: [],
    celebratedBy: [],
  },

  // --- TOURNAMENTS COMPLETED ---
  {
    id: "act_tourn_1",
    type: "tournament_completed",
    title: "WEHAT Inter-Hub Cup Concluded! 🏆",
    subtitle: "BUNGA FC crowned Champions after an epic 3-2 Grand Final",
    description: "16 elite clubs competed across Kampala. BUNGA FC defeated WEHAT FC in a thrilling extra-time climax at Tal Olympic Stadium.",
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(), // 2.3 hrs ago
    userName: "WEHAT Tournament Committee",
    userAvatar: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80",
    userBadge: "Tournament Official",
    venue: "Tal Olympic Stadium",
    tournamentData: {
      tournamentName: "WEHAT Soccer Tournament (Season 1)",
      champion: "BUNGA FC 🏆",
      runnerUp: "WEHAT FC 🥈",
      participantsCount: 16,
      goldenBootWinner: "Raymond Junior (8 Goals)",
      goldenBootGoals: 8,
      season: "Season 1",
      prizePool: "UGX 3,500,000",
      tournamentId: "wehat-s2-w2",
    },
    likesCount: 68,
    celebrationsCount: 42,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_tourn_2",
    type: "tournament_completed",
    title: "Friday Night Lights Futsal Concluded 🥇",
    subtitle: "KLA STARS emerge victorious among 12 top squads",
    description: "An unforgettable evening of intense quick-touch futsal with over 54 goals scored throughout the knockout brackets.",
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hrs ago
    userName: "Kampala Futsal League",
    userAvatar: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80",
    userBadge: "League Admin",
    venue: "Fusion Sports Bugolobi",
    tournamentData: {
      tournamentName: "Friday Night Lights Futsal Invitational",
      champion: "KLA STARS 🥇",
      runnerUp: "BUGOLOBI UNITED 🥈",
      participantsCount: 12,
      goldenBootWinner: "Joseph Katende (11 Goals)",
      goldenBootGoals: 11,
      season: "March Invitational",
      prizePool: "UGX 2,000,000",
    },
    likesCount: 45,
    celebrationsCount: 29,
    likedBy: [],
    celebratedBy: [],
  },
  {
    id: "act_tourn_3",
    type: "tournament_completed",
    title: "Kampala Corporate Turf Super League Final 🏆",
    subtitle: "STANBIC BALLERS edge AIRTEL STRIKERS on penalties (4-3)",
    description: "After a 1-1 deadlock at full-time, Stanbic's keeper made two heroic saves in the shootout to claim the corporate trophy.",
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
    userName: "Corporate Football Association",
    userAvatar: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=100&auto=format&fit=crop&q=80",
    userBadge: "Official",
    venue: "Lugogo Arena Turf",
    tournamentData: {
      tournamentName: "Kampala Corporate Turf Super League",
      champion: "STANBIC BALLERS 🏆",
      runnerUp: "AIRTEL STRIKERS 🥈",
      participantsCount: 20,
      goldenBootWinner: "Samson Lubega (9 Goals)",
      goldenBootGoals: 9,
      season: "Q1 Championship",
      prizePool: "UGX 5,000,000",
    },
    likesCount: 53,
    celebrationsCount: 34,
    likedBy: [],
    celebratedBy: [],
  },
];

// In-memory store for fallback & instant hydration
let memoryActivities: CommunityActivity[] = [...INITIAL_COMMUNITY_ACTIVITIES];

export const communityActivityService = {
  /**
   * Seed Firestore if empty with the initial rich community activities
   */
  async seedDefaultActivitiesIfEmpty(): Promise<void> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        console.log("[CommunityActivity] Seeding initial activities to Firestore...");
        const batch = writeBatch(db);
        INITIAL_COMMUNITY_ACTIVITIES.forEach((activity) => {
          const docRef = doc(db, COLLECTION_NAME, activity.id);
          batch.set(docRef, activity);
        });
        await batch.commit();
        console.log("[CommunityActivity] Seeded successfully!");
      }
    } catch (error) {
      console.warn("[CommunityActivity] Firestore seeding encountered an error, falling back to local store:", error);
    }
  },

  /**
   * Real-time subscription to community activities
   */
  subscribeToCommunityActivities(
    callback: (activities: CommunityActivity[]) => void,
    onError?: (err: any) => void
  ): () => void {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, orderBy("timestamp", "desc"), limit(25));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Trigger background seeding if empty
            this.seedDefaultActivitiesIfEmpty();
            callback(memoryActivities);
            return;
          }

          const items: CommunityActivity[] = [];
          snapshot.forEach((d) => {
            items.push({ ...(d.data() as CommunityActivity), id: d.id });
          });

          // Sort in descending order of timestamp
          items.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          memoryActivities = items;
          callback(items);
        },
        (error) => {
          console.warn("[CommunityActivity] Firestore subscription error, using memory activities:", error);
          callback(memoryActivities);
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("[CommunityActivity] Error initializing subscription:", err);
      callback(memoryActivities);
      return () => {};
    }
  },

  /**
   * One-time fetch of activities
   */
  async getCommunityActivities(): Promise<CommunityActivity[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, orderBy("timestamp", "desc"), limit(25));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await this.seedDefaultActivitiesIfEmpty();
        return memoryActivities;
      }

      const items: CommunityActivity[] = [];
      snapshot.forEach((d) => {
        items.push({ ...(d.data() as CommunityActivity), id: d.id });
      });

      memoryActivities = items;
      return items;
    } catch (error) {
      console.warn("[CommunityActivity] Error fetching activities:", error);
      return memoryActivities;
    }
  },

  /**
   * React (Cheer/Like or Celebrate) to an activity item
   */
  async toggleReaction(
    activityId: string,
    reaction: "like" | "celebrate",
    userId?: string
  ): Promise<{ likesCount: number; celebrationsCount: number }> {
    const defaultUser = userId || "community_fan_" + Math.floor(Math.random() * 1000);

    // Update memory state optimistically
    const targetIdx = memoryActivities.findIndex((a) => a.id === activityId);
    let target = targetIdx !== -1 ? memoryActivities[targetIdx] : null;

    if (target) {
      const likedBy = target.likedBy || [];
      const celebratedBy = target.celebratedBy || [];

      if (reaction === "like") {
        const isLiked = likedBy.includes(defaultUser);
        target.likesCount = Math.max(0, target.likesCount + (isLiked ? -1 : 1));
        target.likedBy = isLiked
          ? likedBy.filter((u) => u !== defaultUser)
          : [...likedBy, defaultUser];
      } else {
        const isCelebrated = celebratedBy.includes(defaultUser);
        target.celebrationsCount = Math.max(
          0,
          target.celebrationsCount + (isCelebrated ? -1 : 1)
        );
        target.celebratedBy = isCelebrated
          ? celebratedBy.filter((u) => u !== defaultUser)
          : [...celebratedBy, defaultUser];
      }
      memoryActivities[targetIdx] = { ...target };
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, activityId);
      const isLike = reaction === "like";
      const fieldCount = isLike ? "likesCount" : "celebrationsCount";
      const fieldList = isLike ? "likedBy" : "celebratedBy";

      // If document exists, update via Firestore
      const hasReacted =
        target &&
        ((isLike && target.likedBy?.includes(defaultUser)) ||
          (!isLike && target.celebratedBy?.includes(defaultUser)));

      await updateDoc(docRef, {
        [fieldCount]: increment(hasReacted ? 1 : -1),
        [fieldList]: hasReacted ? arrayUnion(defaultUser) : arrayRemove(defaultUser),
      });
    } catch (err) {
      console.warn("[CommunityActivity] Firestore reaction sync warning (optimistic fallback used):", err);
    }

    return {
      likesCount: target?.likesCount || 0,
      celebrationsCount: target?.celebrationsCount || 0,
    };
  },

  /**
   * Publish a new community activity (e.g. from match completion or team creation)
   */
  async publishActivity(
    data: Omit<CommunityActivity, "id" | "likesCount" | "celebrationsCount">
  ): Promise<CommunityActivity> {
    const id = "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newActivity: CommunityActivity = {
      ...data,
      id,
      likesCount: 0,
      celebrationsCount: 0,
      likedBy: [],
      celebratedBy: [],
    };

    memoryActivities = [newActivity, ...memoryActivities];

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, newActivity);
    } catch (err) {
      console.warn("[CommunityActivity] Error saving new activity to Firestore:", err);
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
    }

    return newActivity;
  },
};
