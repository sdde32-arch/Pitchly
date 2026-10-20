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
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-base">
        <Loader2 className="animate-spin text-primary-lime" size={32} />
      </div>
    );
  }

  // Strict Platform Admin check only
  if (isAdmin) {
    return <>{children}</>;
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in failed");
    }
  };

  return (
    <div className="min-h-screen bg-app-base flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary-lime/15 border border-primary-lime/30 text-primary-lime mx-auto flex items-center justify-center">
          <KeyRound size={24} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">
            Administrator Access Required
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Access to this administrative section requires a platform administrator account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full h-11 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span>Sign In with Authorized Google Account</span>
        </button>

        <div className="pt-2">
          <button
            onClick={() => navigate("/home")}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const RequireOrganizer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAdmin, userProfile, loading, signInWithGoogle } = useUser();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-base">
        <Loader2 className="animate-spin text-primary-lime" size={32} />
      </div>
    );
  }

  const isOrganizer = Boolean(
    userProfile &&
      ((userProfile.roles as string[] | undefined)?.includes("ORGANIZER") ||
        (userProfile.role as string | undefined) === "ORGANIZER")
  );

  // Both Platform Admin and Tournament Organizers can access
  if (isAdmin || isOrganizer) {
    return <>{children}</>;
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in failed");
    }
  };

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
            Access to this management portal requires an authorized Administrator or Tournament Organizer account. Please sign in below.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full h-11 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span>Sign In with Authorized Google Account</span>
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
