import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { seedTurfs } from "../utils/seedTurfs";
type AuthMode = "SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD";
export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  /* Safe access to navigation state */ const stateParams =
    location.state || {};
  const from = stateParams.from?.pathname || "/home";
  const prefilledEmail = stateParams.email || "";
  const searchParams = new URLSearchParams(location.search);
  const showSeedButton = searchParams.get("seed") === "true";
  const [mode, setMode] = useState<AuthMode>("SIGN_IN");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  /* Form State */ const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedTurfs();
      setSeedMessage({
        text: result.message,
        type: result.success ? "success" : "error",
      });
    } catch (err: any) {
      setSeedMessage({
        text: err.message || "Failed to seed turfs",
        type: "error",
      });
    } finally {
      setIsSeeding(false);
    }
  };
  /* Validation helpers */ const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = () => {
    if (mode === "FORGOT_PASSWORD") return validateEmail(email);
    if (mode === "SIGN_IN") return validateEmail(email) && password.length >= 6;
    return (
      validateEmail(email) &&
      password.length >= 6 &&
      fullName.trim().length > 2 &&
      phone.length >= 8
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || loading || isSubmitting) return;
    setLoading(true);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (mode === "SIGN_UP") {
        const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=22C55E&color=fff&bold=true`;
        const role = isOwner ? "OWNER" : "PLAYER";
        
        // Save pending role in localStorage to prevent the onAuthStateChanged race condition in UserContext
        localStorage.setItem("pitchly_pending_role", role);

        try {
          const { user } = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          
          await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            name: fullName,
            email,
            phone,
            role: isOwner ? "OWNER" : "PLAYER",
            roles: isOwner ? ["OWNER", "PLAYER"] : ["PLAYER"],
            avatar: photoURL,
            avatarId: `avatar_${String(Math.floor(Math.random() * 20) + 1).padStart(2, "0")}`,
            bio: isOwner ? "Turf Business Owner" : "Football enthusiast",
            createdAt: new Date().toISOString(),
          });
          
          navigate(role === "OWNER" ? "/owner" : "/home", { replace: true });
        } finally {
          // Always clean up the pending role so it doesn't linger or leak, even on signup failure
          localStorage.removeItem("pitchly_pending_role");
        }
      } else if (mode === "SIGN_IN") {
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        let userRole = "PLAYER";
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            userRole = userDoc.data().role || "PLAYER";
          }
        } catch (e) {
          console.warn("Failed to fetch user role on signin", e);
        }
        let targetRoute = from;
        const isAdminUser = 
          user.uid === "0uVlAOWTy7dpqAW5tsgxQVs4PW43" ||
          userRole === "admin" ||
          userRole === "ADMIN" ||
          userRole === "super_admin";

        if (isAdminUser) {
          if (!targetRoute.startsWith("/admin")) {
            targetRoute = "/admin/overview";
          }
        } else if (targetRoute === "/home" || targetRoute === "/") {
          if (userRole === "OWNER" || userRole === "owner") {
            targetRoute = "/owner";
          } else if (userRole === "staff" || userRole === "STAFF") {
            targetRoute = "/staff";
          } else {
            targetRoute = "/home";
          }
        }
        navigate(targetRoute, { replace: true });
      } else if (mode === "FORGOT_PASSWORD") {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage("Password reset link sent to your email!");
        setMode("SIGN_IN");
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already registered"))
        setError("This email is already registered. Try logging in.");
      else if (msg.includes("Invalid login credentials"))
        setError("Incorrect email or password.");
      else setError(msg || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#0e0f12] flex flex-col justify-center p-4 sm:p-12 animate-fadeIn font-body relative overflow-hidden text-text-primary">
      {/* Visual Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-lime/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full mx-auto relative z-10">
        <div className="mb-10 text-center animate-slideUp">
          <button
            onClick={() =>
              mode === "FORGOT_PASSWORD"
                ? setMode("SIGN_IN")
                : navigate("/onboarding")
            }
            className="mb-8 inline-flex items-center gap-2 text-text-secondary hover:text-primary-lime transition-all text-xs font-bold uppercase tracking-widest group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {mode === "FORGOT_PASSWORD"
              ? "Back to Login"
              : "Back to Intro"}
          </button>
          <Logo
            size={80}
            showText={true}
            showTagline={true}
            className="mx-auto"
          />
        </div>
        
        <div className="p-4 rounded-2xl bg-surface-card shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-border-subtle animate-slideUp">
          {mode !== "FORGOT_PASSWORD" && (
            <div className="flex gap-2 bg-surface-raised p-1.5 rounded-full mb-8">
              <button
                onClick={() => {
                  setMode("SIGN_IN");
                  setError(null);
                }}
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest rounded-full transition-all ${mode === "SIGN_IN" ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20" : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMode("SIGN_UP");
                  setError(null);
                }}
                className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest rounded-full transition-all ${mode === "SIGN_UP" ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20" : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
              >
                Register
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                <AlertCircle
                  className="text-red-500 shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-relaxed uppercase tracking-widest">
                  {error}
                </p>
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
                <Shield
                  className="text-emerald-500 shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed uppercase tracking-widest">
                  {successMessage}
                </p>
              </div>
            )}
            {mode === "SIGN_UP" && (
              <>
                <div className="relative group">
                  <UserIcon
                    className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${fullName ? "text-primary-lime" : "text-[#71717A]"}`}
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-full py-4 pl-12 pr-5 text-[14px] font-medium text-text-primary outline-none transition-all placeholder:text-slate-400 focus:bg-surface-card"
                  />
                </div>
                <div className="relative group">
                  <Phone
                    className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${phone ? "text-primary-lime" : "text-[#71717A]"}`}
                    size={18}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-full py-4 pl-12 pr-5 text-[14px] font-medium text-text-primary outline-none transition-all placeholder:text-slate-400 focus:bg-surface-card"
                  />
                </div>
              </>
            )}
            <div className="relative group">
              <Mail
                className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${validateEmail(email) ? "text-primary-lime" : "text-[#71717A]"}`}
                size={18}
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-full py-4 pl-12 pr-5 text-[14px] font-medium text-text-primary outline-none transition-all placeholder:text-slate-400 focus:bg-surface-card"
              />
            </div>
            {mode !== "FORGOT_PASSWORD" && (
              <div className="relative group">
                <Lock
                  className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${password.length >= 6 ? "text-primary-lime" : "text-[#71717A]"}`}
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-raised border border-border-subtle focus:border-primary-lime rounded-full py-4 pl-12 pr-12 text-[14px] font-medium text-text-primary outline-none transition-all placeholder:text-slate-400 focus:bg-surface-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-lime"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}
            {mode === "SIGN_UP" && (
              <div className="flex items-center gap-4 bg-surface-raised p-4 rounded-2xl border border-border-subtle">
                <div className="flex-1">
                  <p className="text-text-primary text-[11px] font-black uppercase tracking-widest">
                    Turf Owner Account?
                  </p>
                  <p className="text-text-secondary text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                    Access owner management dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOwner(!isOwner)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors border ${isOwner ? "bg-primary-lime border-primary-lime" : "bg-surface-card border-border-subtle"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${isOwner ? "translate-x-6 bg-app-base" : "translate-x-0 bg-slate-400"}`}
                  />
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || loading || !isFormValid()}
              className="w-full flex items-center justify-center gap-3 mt-6 bg-primary-lime hover:bg-[#96E600] text-accent-text py-4 rounded-full font-bold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-lime/20 active:scale-[0.98]"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{mode === "SIGN_UP" ? "Creating..." : "Loading..."}</span>
                </>
              ) : mode === "SIGN_IN" ? (
                "Enter Pitch"
              ) : mode === "SIGN_UP" ? (
                "Register"
              ) : (
                "Reset Password"
              )}
            </button>
            
            {mode === "SIGN_IN" && (
              <button
                type="button"
                onClick={() => setMode("FORGOT_PASSWORD")}
                className="w-full text-center text-[11px] font-bold text-text-secondary hover:text-primary-lime transition-colors mt-4"
              >
                Forgot Password?
              </button>
            )}
          </form>
          
          {showSeedButton && (
            <div className="mt-8 pt-8 border-t border-border-subtle">
              {seedMessage && (
                <div
                  className={`mb-4 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest ${seedMessage.type === "success" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"}`}
                >
                  {seedMessage.text}
                </div>
              )}
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest font-black bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 py-3 rounded-full transition-colors"
              >
                {isSeeding ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Database size={14} />
                )}
                {isSeeding ? "Seeding Turfs..." : "Seed Test Turfs"}
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-[#71717A] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Shield size={12} className="text-primary-lime" /> End-to-End Encrypted Session
        </p>
      </div>
      <style>{` @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } } .animate-shake { animation: shake 0.3s ease-in-out; } `}</style>
    </div>
  );
};
