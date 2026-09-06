import React, { useState, useEffect } from "react";
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
import { useUser } from "../context/UserContext";

type AuthMode = "SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD";
export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isOwner: userIsOwner, loading: authLoading, signInWithGoogle } = useUser();

  /* Safe access to navigation state */ const stateParams =
    location.state || {};
  const from = stateParams.from?.pathname || "/home";
  const prefilledEmail = stateParams.email || "";
  const searchParams = new URLSearchParams(location.search);
  const showSeedButton = searchParams.get("seed") === "true";
  const [mode, setMode] = useState<AuthMode>("SIGN_IN");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  // If already authenticated, redirect directly to the designated tab
  useEffect(() => {
    if (!authLoading && user) {
      let targetRoute = from && from !== "/auth" ? from : null;
      if (isAdmin) {
        if (!targetRoute || !targetRoute.startsWith("/admin")) targetRoute = "/admin/overview";
        navigate(targetRoute, { replace: true });
      } else if (userIsOwner) {
        if (!targetRoute || targetRoute === "/home" || targetRoute === "/") targetRoute = "/owner";
        navigate(targetRoute, { replace: true });
      } else {
        if (!targetRoute || targetRoute === "/" || targetRoute === "/owner" || targetRoute.startsWith("/admin")) targetRoute = "/home";
        navigate(targetRoute, { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, userIsOwner, navigate, from]);
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
      fullName.trim().length > 0 &&
      phone.length >= 0
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== handleSubmit triggered ===");
    console.log("Mode:", mode);
    console.log("Form State:", { email, passwordLength: password.length, fullName, phone, isOwner });
    console.log("Validation States:", {
      isFormValid: isFormValid(),
      loading,
      isSubmitting,
      validateEmail: validateEmail(email)
    });

    if (!isFormValid() || loading || isSubmitting) {
      console.log("handleSubmit returned early. Reason:", {
        formInvalid: !isFormValid(),
        isLoading: loading,
        isCurrentlySubmitting: isSubmitting
      });
      return;
    }
    
    console.log("Proceeding with authentication...");
    setLoading(true);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (mode === "SIGN_UP") {
        console.log("Starting SIGN_UP flow...");
        const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=22C55E&color=fff&bold=true`;
        const role = isOwner ? "OWNER" : "PLAYER";
        
        // Save pending role in localStorage to prevent the onAuthStateChanged race condition in UserContext
        localStorage.setItem("pitchly_pending_role", role);
        localStorage.setItem("pitchly_pending_name", fullName);
        localStorage.setItem("pitchly_pending_phone", phone);

        try {
          console.log("Calling createUserWithEmailAndPassword...");
          const { user } = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          console.log("createUserWithEmailAndPassword SUCCESS, UID:", user.uid);
          
          console.log("Saving user profile to Firestore...");
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
          }, { merge: true });
          console.log("Firestore profile saved successfully.");
          
          // Navigation is handled by the useEffect above when user context updates.
        } catch (innerError: any) {
          console.error("Inner error during SIGN_UP:", innerError);
          throw innerError;
        } finally {
          // Always clean up the pending role so it doesn't linger or leak, even on signup failure
          localStorage.removeItem("pitchly_pending_role");
          localStorage.removeItem("pitchly_pending_name");
          localStorage.removeItem("pitchly_pending_phone");
        }
      } else if (mode === "SIGN_IN") {
        console.log("Calling signInWithEmailAndPassword...");
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        console.log("signInWithEmailAndPassword SUCCESS, UID:", user.uid);
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

        // Navigation is handled by the useEffect above when user context updates.
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

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || loading || isSubmitting) return;
    setIsGoogleLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const preferredRole = isOwner ? "OWNER" : "PLAYER";
      const firebaseUser = await signInWithGoogle(preferredRole);

      let userRole = preferredRole;
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role || preferredRole;
        }
      } catch (e) {
        console.warn("Could not read user doc on Google signin", e);
      }

      const isAdminUser =
        firebaseUser.uid === "0uVlAOWTy7dpqAW5tsgxQVs4PW43" ||
        userRole === "admin" ||
        userRole === "ADMIN" ||
        userRole === "super_admin";

      // Navigation is handled by the useEffect above when user context updates.
    } catch (err: any) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
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
            <div className="flex gap-2 bg-surface-raised p-1.5 rounded-full mb-6">
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

          {mode !== "FORGOT_PASSWORD" && (
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || loading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-surface-raised hover:bg-surface-card border border-border-subtle hover:border-primary-lime/40 text-text-primary py-3.5 px-4 rounded-full font-bold text-[13.5px] transition-all duration-200 active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="animate-spin text-primary-lime" size={18} />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {mode === "SIGN_UP" ? "Sign up with Google" : "Continue with Google"}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border-subtle"></div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  or continue with email
                </span>
                <div className="flex-1 h-px bg-border-subtle"></div>
              </div>
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
                    placeholder="Phone Number (Optional)"
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
