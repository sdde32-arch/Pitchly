import React, { useEffect, useState } from "react";
import { UserProfileData, useUser } from "../context/UserContext";
import {
  ArrowRight,
  ShieldCheck,
  LogOut,
  Zap,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useNavigate } from "react-router-dom";

export const WelcomeBack: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOwner, loading } = useUser();
  const [lastUser, setLastUser] = useState<UserProfileData | null>(null);

  // If already logged in, skip welcome-back and go directly to home
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin/overview", { replace: true });
      } else if (isOwner) {
        navigate("/owner", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [user, loading, isAdmin, isOwner, navigate]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pitchly_last_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && (parsed.name || parsed.email)) {
          setLastUser(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Invalid last user in storage", e);
    }
    navigate("/onboarding", { replace: true });
  }, [navigate]);

  if (!lastUser) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-app-base gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-white font-display">Pitchly</span>
          <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
        </div>
        <div className="w-6 h-6 border-2 border-primary-lime/20 border-t-primary-lime rounded-full animate-spin" />
      </div>
    );
  }

  const handleQuickResume = () => {
    if (user) {
      if (isAdmin) navigate("/admin/overview", { replace: true });
      else if (isOwner) navigate("/owner", { replace: true });
      else navigate("/home", { replace: true });
    } else {
      navigate("/auth", { state: { email: lastUser.email } });
    }
  };
  return (
    <div
      className="fixed inset-0 h-full w-full bg-slate-100 dark:bg-[#0e0f12] overflow-y-auto overflow-x-hidden p-4 sm:p-8 animate-fadeIn font-body relative"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
    >
      <div className="max-w-sm w-full text-center mx-auto my-auto py-8 relative z-10 bg-white dark:bg-[#14151a] p-4 sm:p-10 rounded-[16px] border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="flex justify-center mb-10">
          <Logo
            size={64}
            showText={true}
            showTagline={false}
          />
        </div>
        <div className="mb-10">
          <div className="h-24 w-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-slate-50 dark:border-[#1c1e26] shadow-sm">
            <img
              src={lastUser.avatar}
              className="w-full h-full object-cover"
              alt={lastUser.name}
            />
          </div>
          <p className="text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-[0.1em] text-xs mb-1.5">
            Welcome Back
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {lastUser.name}
          </h1>
        </div>
        <button
          onClick={handleQuickResume}
          className="w-full min-h-[56px] py-4 rounded-full bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mb-6 cursor-pointer"
        >
          Continue Session <ArrowRight size={20} />
        </button>
        <button
          onClick={() => navigate("/auth")}
          className="text-slate-500 dark:text-zinc-400 font-medium text-xs sm:text-sm hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Not you? Switch Account
        </button>
      </div>
    </div>
  );
};
