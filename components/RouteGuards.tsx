import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";

export const RequireAuth: React.FC<{ children: React.ReactNode; blockAdmin?: boolean }> = ({
  children,
  blockAdmin = false,
}) => {
  const { user, isAdmin, loading } = useUser();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-base">
        <Loader2 className="animate-spin text-primary-lime" size={32} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  if (isAdmin) {
    return <Navigate to="/admin/overview" replace />;
  }
  return <>{children}</>;
};

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAdmin, loading, signInWithGoogle } = useUser();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [organizerUnlocked, setOrganizerUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return (
          localStorage.getItem("pitchly_organizer_access") === "true" ||
          sessionStorage.getItem("pitchly_organizer_access") === "true"
        );
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-base">
        <Loader2 className="animate-spin text-primary-lime" size={32} />
      </div>
    );
  }

  // If already full admin or unlocked via pitchside organizer access
  if (isAdmin || organizerUnlocked) {
    return <>{children}</>;
  }

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim().toLowerCase();
    // Valid organizer passcodes
    if (clean === "wehat2026" || clean === "admin" || clean === "sdde32" || clean === "pitchly") {
      try {
        localStorage.setItem("pitchly_organizer_access", "true");
        sessionStorage.setItem("pitchly_organizer_access", "true");
      } catch {}
      setOrganizerUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect organizer passcode. Please try again or sign in with Google.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in failed");
    }
  };

  // If visiting an admin route without credentials, show a sleek organizer access card
  return (
    <div className="min-h-screen bg-app-base flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary-lime/15 border border-primary-lime/30 text-primary-lime mx-auto flex items-center justify-center">
          <KeyRound size={24} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">
            Organizer &amp; Admin Access
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Access tournament score controls and result management. Sign in with your organizer account (<strong className="text-text-primary">sdde32@gmail.com</strong>) or use the pitchside passcode.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePasscodeUnlock} className="space-y-3">
          <input
            type="password"
            placeholder="Enter Organizer Passcode (e.g. wehat2026)"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full h-11 px-3.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime text-center tracking-wider"
          />
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Unlock Score Portal
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border-subtle w-full" />
          <span className="bg-surface-card px-2 text-[10px] uppercase font-bold text-text-tertiary absolute">
            Or
          </span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Sign In with Google</span>
        </button>

        <div className="pt-2">
          <button
            onClick={() => navigate("/tournament")}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Return to Tournament Match Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const RequireOwner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isOwner, loading } = useUser();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-base">
        <Loader2 className="animate-spin text-primary-lime" size={32} />
      </div>
    );
  }
  if (!isOwner) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
