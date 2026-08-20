"use client";

import { useState } from "react";
import { Loader2, Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

// Singleton instance banayein taaki multiple instances na banein
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = getSupabaseClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // 1. Verify Role Permission
      const role = data.user?.app_metadata?.role;
      if (role !== "admin") {
        setErrorMsg("Access Denied: You do not have administrator permissions.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 2. Redirect with fresh session cookies
      if (data?.session) {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] flex flex-col justify-center items-center p-4 text-[#243126] font-sans">
      <div className="w-full max-w-md bg-[#f9f7f2] rounded-3xl border border-[#e6e0d2] p-8 space-y-6 shadow-xs">
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#dce6d8] border border-[#c2d3bd] rounded-2xl flex items-center justify-center mx-auto text-[#1e3b2b]">
            <Lock size={20} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#243126]">
            Divine You Admin
          </h1>
          <p className="text-xs text-[#66655d]">
            Sign in with your authorized administrator credentials.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-[#243126]">Admin Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-[#807d73]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@gmail.com"
                className="w-full bg-white border border-[#ded8ca] rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none focus:border-[#285538] transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-[#243126]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-[#807d73]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#ded8ca] rounded-xl pl-10 pr-3.5 py-2.5 text-xs outline-none focus:border-[#285538] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#243126] text-white font-medium hover:bg-[#1a231b] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}