import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "./UserContext";
import { chatService } from "../services/chatService";
import { Conversation } from "../types/firebase";
import { FEATURES } from "../config/features";

/**
 * Unread chat indicator state backed by `users/{uid}.chatReadAt` and
 * `users/{uid}.chatReadBaselineAt`.
 *
 * Known limits:
 * 1. Second-device lag: UserContext loads `users/{uid}` once via `getDoc`
 *    (not `onSnapshot`), so reading a conversation on one device does not
 *    clear the badge on another already-open device until that device reloads
 *    or re-authenticates.
 * 2. Client clock differences: `lastMessageAt` (written in `chatService.sendMessage`
 *    with `new Date().toISOString()`) and `chatReadAt` / `chatReadBaselineAt`
 *    rely on client clocks. If a sender's clock is ahead of the reader's clock,
 *    a conversation can stay marked unread briefly until the reader's clock catches
 *    up; if a sender's clock is behind, a new message may appear already read.
 */

interface ChatUnreadContextType {
  unreadCount: number;
  unreadConvIds: Set<string>;
  markRead: (convId: string) => Promise<void>;
}

const EMPTY_SET = new Set<string>();

const ChatUnreadContext = createContext<ChatUnreadContextType>({
  unreadCount: 0,
  unreadConvIds: EMPTY_SET,
  markRead: async () => {},
});

function parseIsoMs(iso?: string): number | null {
  if (typeof iso !== "string" || !iso.trim()) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

const MARK_READ_WRITE_THROTTLE_MS = 2000;

export const ChatUnreadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAdmin, userProfile, updateProfile } = useUser();
  const uid = user?.uid ?? null;
  const hasProfile = Boolean(userProfile);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [localReadAt, setLocalReadAt] = useState<Record<string, string>>({});

  // Capture the time this provider first saw the current signed-in user in this session
  const sessionBaselineRef = useRef<{ uid: string; iso: string } | null>(null);
  if (uid && sessionBaselineRef.current?.uid !== uid) {
    sessionBaselineRef.current = { uid, iso: new Date().toISOString() };
  } else if (!uid && sessionBaselineRef.current !== null) {
    sessionBaselineRef.current = null;
  }

  const persistedBaselineUidRef = useRef<string | null>(null);
  const lastWriteMsByConvRef = useRef<Record<string, number>>({});

  // Keep refs to latest auth/profile values so markRead stays referentially stable
  const uidRef = useRef<string | null>(uid);
  const isAdminRef = useRef<boolean>(isAdmin);
  const userProfileRef = useRef(userProfile);
  const updateProfileRef = useRef(updateProfile);

  uidRef.current = uid;
  isAdminRef.current = isAdmin;
  userProfileRef.current = userProfile;
  updateProfileRef.current = updateProfile;

  // Reset per-session local maps whenever the active user changes or signs out
  useEffect(() => {
    setLocalReadAt({});
    lastWriteMsByConvRef.current = {};
    if (!uid) {
      setConversations([]);
      persistedBaselineUidRef.current = null;
    }
  }, [uid]);

  // Subscribe ONCE per signed-in non-admin user after userProfile has loaded
  useEffect(() => {
    if (!uid || isAdmin || !hasProfile) {
      setConversations([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = chatService.subscribeToUserConversations(
        uid,
        (convs) => {
          setConversations(Array.isArray(convs) ? convs : []);
        },
        () => {
          setConversations([]);
        }
      );
    } catch {
      setConversations([]);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [uid, isAdmin, hasProfile]);

  // Persist chatReadBaselineAt ONCE if missing on the user's profile (non-fatal)
  useEffect(() => {
    if (!uid || isAdmin || !userProfile) return;
    if (userProfile.chatReadBaselineAt) return;
    if (persistedBaselineUidRef.current === uid) return;

    persistedBaselineUidRef.current = uid;
    const baselineIso =
      sessionBaselineRef.current?.uid === uid
        ? sessionBaselineRef.current.iso
        : new Date().toISOString();

    (async () => {
      try {
        await updateProfileRef.current({ chatReadBaselineAt: baselineIso });
      } catch (err) {
        console.warn("Could not persist chatReadBaselineAt:", err);
      }
    })();
  }, [uid, isAdmin, userProfile]);

  const markRead = useCallback(async (convId: string): Promise<void> => {
    const cleanConvId = typeof convId === "string" ? convId.trim() : "";
    if (!cleanConvId) return;
    if (!uidRef.current || isAdminRef.current || !userProfileRef.current) return;

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // Immediately update local state map so badges clear at once even if Firestore is slow/fails
    setLocalReadAt((prev) => {
      const prevMs = parseIsoMs(prev[cleanConvId]);
      if (prevMs !== null && prevMs >= nowMs) return prev;
      return { ...prev, [cleanConvId]: nowIso };
    });

    // Skip Firestore write if the stored value is already within 2 seconds of now
    const storedIso = userProfileRef.current.chatReadAt?.[cleanConvId];
    const storedMs = parseIsoMs(storedIso);
    const lastAttemptMs = lastWriteMsByConvRef.current[cleanConvId] ?? null;
    const latestPersistedMs =
      storedMs !== null && lastAttemptMs !== null
        ? Math.max(storedMs, lastAttemptMs)
        : storedMs ?? lastAttemptMs;

    if (
      latestPersistedMs !== null &&
      Math.abs(nowMs - latestPersistedMs) < MARK_READ_WRITE_THROTTLE_MS
    ) {
      return;
    }

    lastWriteMsByConvRef.current[cleanConvId] = nowMs;

    try {
      await updateProfileRef.current({
        chatReadAt: {
          ...userProfileRef.current.chatReadAt,
          [cleanConvId]: nowIso,
        },
      });
    } catch (err) {
      console.warn("Could not persist chatReadAt:", err);
    }
  }, []);

  const unreadConvIds = useMemo(() => {
    if (!uid || isAdmin || !userProfile) return EMPTY_SET;

    const effectiveBaselineIso =
      userProfile.chatReadBaselineAt ||
      (sessionBaselineRef.current?.uid === uid
        ? sessionBaselineRef.current.iso
        : undefined);
    const baselineMs = parseIsoMs(effectiveBaselineIso);
    const profileReadAt = userProfile.chatReadAt || {};

    const ids = new Set<string>();
    for (const conv of conversations) {
      if (!conv?.id) continue;
      if (!FEATURES.squads && conv.type === "TEAM") continue;

      const lastMsgMs = parseIsoMs(conv.lastMessageAt);
      if (lastMsgMs === null) continue;

      const profileReadMs = parseIsoMs(profileReadAt[conv.id]);
      const localReadMs = parseIsoMs(localReadAt[conv.id]);

      let readWatermarkMs: number | null = baselineMs;
      if (profileReadMs !== null) {
        readWatermarkMs = profileReadMs;
      }
      if (localReadMs !== null && (readWatermarkMs === null || localReadMs > readWatermarkMs)) {
        readWatermarkMs = localReadMs;
      }

      if (readWatermarkMs !== null && lastMsgMs > readWatermarkMs) {
        ids.add(conv.id);
      }
    }

    return ids;
  }, [uid, isAdmin, userProfile, conversations, localReadAt]);

  const value = useMemo<ChatUnreadContextType>(
    () => ({
      unreadCount: unreadConvIds.size,
      unreadConvIds,
      markRead,
    }),
    [unreadConvIds, markRead]
  );

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
};

export const useChatUnread = (): ChatUnreadContextType =>
  useContext(ChatUnreadContext);
