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

// Community activity feed (empty default for self-serve mode)
export const INITIAL_COMMUNITY_ACTIVITIES: CommunityActivity[] = [];

// In-memory store for fallback & instant hydration
let memoryActivities: CommunityActivity[] = [...INITIAL_COMMUNITY_ACTIVITIES];

export const communityActivityService = {
  /**
   * Seed Firestore if empty with the initial rich community activities
   */
  async seedDefaultActivitiesIfEmpty(): Promise<void> {
    // No-op: self-serve mode - activities are created by real user matches and squads
    return;
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
