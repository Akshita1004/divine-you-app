"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/auth-context";

type AuthMode =
  | "signin"
  | "signup"
  | "verify-otp"
  | "reset-email"
  | "reset-otp"
  | "reset-password";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramMode = searchParams.get("mode");
  const redirectParam = searchParams.get("redirect");
  const targetRedirect = redirectParam || "/account";

  const initialMode: AuthMode = paramMode === "signup" ? "signup" : "signin";

  const { setUserSession } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  // 6-Digit OTP Array & Refs
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer State for Resend OTP (30s)
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Loading, Error & Success States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Countdown timer handler for OTP verification modes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (mode === "verify-otp" || mode === "reset-otp") {
      if (resendTimer > 0) {
        setCanResend(false);
        interval = setInterval(() => {
          setResendTimer((prev) => prev - 1);
        }, 1000);
      } else {
        setCanResend(true);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, resendTimer]);

  // Handle single digit OTP box input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpArray];
    newOtp[index] = value.slice(-1);
    setOtpArray(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation for OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste event for 6-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpArray(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Resend OTP trigger (Overrides previous OTP & restarts 30s timer)
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "reset-otp") {
        await authService.sendOtp(email.trim());
      } else {
        await authService.register({
          name: fullName,
          email: email.trim(),
          password,
        });
      }

      setOtpArray(Array(6).fill(""));
      setResendTimer(30);
      setCanResend(false);
      setSuccessMsg("A new 6-digit OTP has been sent to your email.");
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE OAUTH
  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${targetRedirect}`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err?.message || "Failed to initiate Google Login");
    }
  };

  // 1. SIGN IN: Email & Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await authService.login({ email: email.trim(), password });
      if (res.user && res.token) {
        setUserSession(res.user, res.token);
        router.push(targetRedirect);
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (
        serverMsg &&
        (serverMsg.toLowerCase().includes("does not exist") ||
          serverMsg.toLowerCase().includes("invalid login"))
      ) {
        setError("Account does not exist. Please create an account first.");
      } else {
        setError(serverMsg || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. SIGN UP: Register User & Duplicate Check
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await authService.register({
        name: fullName,
        email: email.trim(),
        password,
      });

      if (res.token && res.user) {
        setUserSession(res.user, res.token);
        router.push(targetRedirect);
      } else {
        setOtpArray(Array(6).fill(""));
        setResendTimer(30);
        setCanResend(false);
        setSuccessMsg(res.message || "OTP sent to your email!");
        setMode("verify-otp");
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (
        serverMsg &&
        (serverMsg.toLowerCase().includes("already exist") ||
          serverMsg.toLowerCase().includes("already registered"))
      ) {
        setError("Account already exists with this email. Please sign in instead.");
      } else {
        setError(serverMsg || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. VERIFY OTP SUBMIT
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const joinedOtp = otpArray.join("");

    if (joinedOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        otp: joinedOtp,
      });

      if (res.user && res.token) {
        setUserSession(res.user, res.token);
        router.push(targetRedirect);
      } else {
        setError(res.message || "Verification failed.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // 4. RESET PASSWORD FLOWS
  const handleResetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await authService.sendOtp(email.trim());
      setOtpArray(Array(6).fill(""));
      setResendTimer(30);
      setCanResend(false);
      setSuccessMsg("Reset OTP code sent to your email!");
      setMode("reset-otp");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(targetRedirect);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header Title & Subtitle */}
      <div className="text-center max-w-md mb-8 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-[-0.015em] text-[#243126]">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
            ? "Join Divine You"
            : mode === "verify-otp" || mode === "reset-otp"
            ? "Welcome back"
            : "Reset your password"}
        </h1>
        <p className="text-xs sm:text-sm text-[#66655d] leading-relaxed">
          {mode === "signin"
            ? "Sign in to track orders and manage your details."
            : mode === "signup"
            ? "Create an account to earn points on every order."
            : mode === "verify-otp" || mode === "reset-otp"
            ? "Sign in to track orders and manage your details."
            : "We'll send a password reset code to your email address."}
        </p>
      </div>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-[440px] rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-8 shadow-2xs">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Email ID
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-[#243126]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setMode("reset-email");
                  }}
                  className="text-[11px] text-[#285538] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs disabled:opacity-70"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-[#e8e2d4]" />
                <span className="absolute bg-white px-2.5 text-[10px] text-[#807d73] uppercase tracking-wider font-medium">
                  Or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#ded8ca] bg-white py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#fbf9f3] transition cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: SIGN UP */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                placeholder="User Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs disabled:opacity-70"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-[#e8e2d4]" />
                <span className="absolute bg-white px-2.5 text-[10px] text-[#807d73] uppercase tracking-wider font-medium">
                  Or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#ded8ca] bg-white py-2.5 text-xs sm:text-sm font-medium text-[#243126] hover:bg-[#fbf9f3] transition cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: VERIFY OTP */}
        {(mode === "verify-otp" || mode === "reset-otp") && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#243126]">
                Enter OTP
              </h3>
              <p className="text-xs text-[#66655d] mt-1 leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-[#243126]">
                  {email || "your email"}
                </span>
                .
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {otpArray.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-2xl border border-[#ded8ca] bg-[#fbf9f3]/40 text-[#243126] focus:border-[#285538] focus:bg-white outline-none transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex items-center justify-between text-xs text-[#66655d] pt-1">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setMode(mode === "reset-otp" ? "reset-email" : "signup");
                }}
                className="hover:underline text-[#66655d] hover:text-[#243126] cursor-pointer"
              >
                Change email
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="font-medium text-[#285538] hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              ) : (
                <span>Resend OTP in {resendTimer}s</span>
              )}
            </div>
          </form>
        )}

        {/* VIEW 4: RESET EMAIL */}
        {mode === "reset-email" && (
          <form onSubmit={handleResetEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs disabled:opacity-70"
            >
              {loading ? "Sending..." : "Continue"}
            </button>
          </form>
        )}

        {/* VIEW 5: RESET PASSWORD */}
        {mode === "reset-password" && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#243126] mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showResetConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#243126] placeholder:text-[#99968d] focus:border-[#285538] focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77756c] hover:text-[#243126] transition cursor-pointer"
                >
                  {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#285538] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1f462c] transition cursor-pointer shadow-2xs"
              >
                Update password
              </button>
            </div>
          </form>
        )}

        {/* Bottom Card Navigation Links */}
        <div className="mt-6 text-center border-t border-[#f0ebd9] pt-4 text-xs text-[#66655d]">
          {mode === "signup" ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setMode("signin");
                }}
                className="font-medium text-[#285538] underline hover:text-[#1f462c] cursor-pointer"
              >
                Sign in
              </button>
            </span>
          ) : mode === "signin" ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setMode("signup");
                }}
                className="font-medium text-[#285538] underline hover:text-[#1f462c] cursor-pointer"
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              New to Divine You?{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setMode("signup");
                }}
                className="font-medium text-[#285538] underline hover:text-[#1f462c] cursor-pointer"
              >
                Create an account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between">
      <div>
        <TrustBar />
        <Header />

        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12 sm:py-16 flex flex-col items-center">
          <Suspense
            fallback={
              <div className="py-24 flex justify-center text-[#807d73]">
                <Loader2 className="animate-spin text-[#285538]" size={28} />
              </div>
            }
          >
            <LoginContent />
          </Suspense>
        </section>
      </div>

      <Footer />
    </main>
  );
}