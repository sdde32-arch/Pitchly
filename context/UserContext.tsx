import React, { createContext, useContext, useState, useEffect } from "react";
import { USER_STATS, BADGES } from "../constants";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface Badge {
  id: string;
  name: string;
  icon: string;
  desc: string;
  earned: boolean;
}

interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  rank: number;
  totalGames: number;
}

export interface UserProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  role:
    | "PLAYER"
    | "OWNER"
    | "ADMIN"
    | "player"
    | "owner"
    | "admin"
    | "staff"
    | "super_admin";
  roles?: ("PLAYER" | "OWNER")[];
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string;
  avatarId?: string;
}

export type UserRole =
  | "PLAYER"
  | "OWNER"
  | "ADMIN"
  | "player"
  | "owner"
  | "admin"
  | "staff"
  | "super_admin";

interface UserContextType {
  user: User | null;
  session: any;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOwner: boolean;
  isPlayer: boolean;
  isStaff: boolean;
  stats: UserStats;
  badges: Badge[];
  userProfile: UserProfileData | null;
  addXP: (amount: number) => void;
  updateProfile: (data: Partial<UserProfileData>) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (preferredRole?: "PLAYER" | "OWNER") => Promise<User>;
  switchRole: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStats>(USER_STATS);
  const [badges, setBadges] = useState(BADGES);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        localStorage.removeItem("pitchly_is_guest");
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            localStorage.removeItem("pitchly_pending_role");
            const data = snap.data();
            
            // Deterministic default avatar selection so every existing account gets a diverse selection instantly
            const fallbackIndex = (firebaseUser.uid.charCodeAt(0) % 20) + 1;
            const fallbackAvatarId = `avatar_${String(fallbackIndex).padStart(2, "0")}`;

            let profile: UserProfileData = {
              id: firebaseUser.uid,
              name:
                data.name ||
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "Pitchly User",
              email: data.email || firebaseUser.email || "",
              phone: data.phone || "",
              avatar:
                data.avatar ||
                firebaseUser.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
              bio: data.bio || "Ready to play.",
              role: data.role || "PLAYER",
              roles: data.roles || ["PLAYER", "OWNER"],
              hasCompletedOnboarding: data.hasCompletedOnboarding || false,
              onboardingCompletedAt: data.onboardingCompletedAt,
              avatarId: data.avatarId || fallbackAvatarId,
            };
            setUserProfile(profile);
            localStorage.setItem(
              "pitchly_last_user",
              JSON.stringify(profile),
            );
          } else {
            const pendingRole = localStorage.getItem("pitchly_pending_role") as UserRole | null;
            const isOwnerRole = pendingRole === "OWNER" || pendingRole === "owner";
            const defaultAvatar = isOwnerRole 
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email?.split("@")[0] || "Owner")}&background=22C55E&color=fff&bold=true`
              : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";

            // Randomly assign one of the 20 bubble-head avatars for a delightful new user experience!
            const randomAvatarIndex = Math.floor(Math.random() * 20) + 1;
            const randomAvatarId = `avatar_${String(randomAvatarIndex).padStart(2, "0")}`;

            let newProfile: UserProfileData = {
              id: firebaseUser.uid,
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "Pitchly User",
              email: firebaseUser.email || "",
              phone: "",
              avatar: firebaseUser.photoURL || defaultAvatar,
              avatarId: randomAvatarId,
              bio: isOwnerRole ? "Turf Business Owner" : "Ready to play.",
              role: pendingRole || "PLAYER",
              roles: isOwnerRole ? ["OWNER", "PLAYER"] : ["PLAYER"],
              hasCompletedOnboarding: false,
            };
            await setDoc(docRef, newProfile, { merge: true });
            setUserProfile(newProfile);
            localStorage.setItem(
              "pitchly_last_user",
              JSON.stringify(newProfile),
            );
          }
        } catch (err) {
          console.warn("Profile fetch error:", err);
        }
      } else {
        setUserProfile(null);
      }
      try {
        await auth.authStateReady();
      } catch (err) {}
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateProfile = async (data: Partial<UserProfileData>) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("pitchly_last_user", JSON.stringify(updated));
      return updated;
    });
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, data, { merge: true });
    }
  };

  const switchRole = () => {
    if (isAdmin) {
      console.warn("switchRole is disabled for admin accounts");
      return;
    }
    if (!userProfile) return;
    const newRole = userProfile.role === "PLAYER" ? "OWNER" : "PLAYER";
    updateProfile({ role: newRole });
  };

  const addXP = (amount: number) => {
    setStats((prev) => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let newNextLevelXP = prev.nextLevelXP;
      while (newXP >= newNextLevelXP) {
        newXP -= newNextLevelXP;
        newLevel += 1;
        newNextLevelXP = Math.floor(newNextLevelXP * 1.2);
      }
      return {
        ...prev,
        currentXP: newXP,
        level: newLevel,
        nextLevelXP: newNextLevelXP,
        totalGames: prev.totalGames + 1,
      };
    });
  };

  const signInWithGoogle = async (preferredRole?: "PLAYER" | "OWNER"): Promise<User> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    
    if (preferredRole) {
      localStorage.setItem("pitchly_pending_role", preferredRole);
    }
    
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) {
        const assignedRole = preferredRole || (localStorage.getItem("pitchly_pending_role") as UserRole) || "PLAYER";
        const isOwnerRole = assignedRole === "OWNER" || assignedRole === "owner";
        const randomAvatarIndex = (firebaseUser.uid.charCodeAt(0) % 20) + 1;
        const randomAvatarId = `avatar_${String(randomAvatarIndex).padStart(2, "0")}`;
        
        const newProfile: UserProfileData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Pitchly User",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
          avatar:
            firebaseUser.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || "Player")}&background=22C55E&color=fff&bold=true`,
          avatarId: randomAvatarId,
          bio: isOwnerRole ? "Turf Business Owner" : "Ready to play on FootLink.",
          role: assignedRole,
          roles: isOwnerRole ? ["OWNER", "PLAYER"] : ["PLAYER"],
          hasCompletedOnboarding: true,
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(docRef, newProfile, { merge: true });
        setUserProfile(newProfile);
        localStorage.setItem("pitchly_last_user", JSON.stringify(newProfile));
      }
    } catch (e) {
      console.warn("Error setting up Google user profile doc:", e);
    } finally {
      localStorage.removeItem("pitchly_pending_role");
    }
    
    return firebaseUser;
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
    localStorage.removeItem("pitchly_is_guest");
    localStorage.removeItem("pitchly_last_user");
    setUserProfile(null);
    setUser(null);
  };

  const targetUid = "0uVlAOWTy7dpqAW5tsgxQVs4PW43";
  const isHardcodedAdmin =
    userProfile?.id === targetUid || user?.uid === targetUid;
  const isAdmin =
    isHardcodedAdmin ||
    userProfile?.role === "admin" ||
    userProfile?.role === "ADMIN" ||
    userProfile?.role === "super_admin";
  const isSuperAdmin = userProfile?.role === "super_admin";
  const isOwner = userProfile?.role === "owner" || userProfile?.role === "OWNER";
  const isStaff = (userProfile?.role as any) === "staff" || (userProfile?.role as any) === "STAFF";
  const isPlayer =
    !isHardcodedAdmin &&
    (userProfile?.role === "player" ||
      userProfile?.role === "PLAYER" ||
      userProfile?.role === undefined);

  return (
    <UserContext.Provider
      value={{
        user,
        session: null,
        loading,
        role: userProfile?.role || "PLAYER",
        isAdmin,
        isSuperAdmin,
        isOwner,
        isPlayer,
        isStaff,
        stats,
        badges,
        addXP,
        userProfile,
        updateProfile,
        signOut,
        signInWithGoogle,
        switchRole,
      }}
    >
      {" "}
      {children}{" "}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
