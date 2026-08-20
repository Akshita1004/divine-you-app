"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Mail, Phone, Loader2, Lock } from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";

export function ContactView() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Endpoint call with logged-in user email
      const response = await fetch("http://localhost:7000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.name || user.email?.split("@")[0] || "Customer",
          email: user.email,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        setMessage("");
      } else {
        setErrorMessage(data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Contact Form Submission Error:", err);
      setErrorMessage("Backend server (port 7000) unreachable. Please start backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between font-sans">
      <div>
        <TrustBar />
        <Header />

        {/* Contact Main Content Section */}
        <section className="mx-auto max-w-6xl px-8 lg:px-14 my-10 sm:my-14 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column: Bold Heading & Contact Info */}
            <div className="lg:col-span-5 pt-1 space-y-7">
              <div>
                <h1 className="font-serif text-4xl sm:text-[44px] font-medium tracking-[-0.01em] text-[#243126] leading-tight">
                  Contact Us
                </h1>
                <p className="mt-3.5 text-xs sm:text-sm text-[#66655d] leading-relaxed max-w-sm">
                  Our team replies within one business day, Monday to Saturday.
                </p>
              </div>

              {/* Info Items */}
              <div className="space-y-4 pt-2 text-xs sm:text-sm text-[#243126]">
                <div className="flex items-center gap-3">
                  <MapPin size={17} className="text-[#243126] shrink-0 stroke-[1.7]" />
                  <span>New Delhi, India</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={17} className="text-[#243126] shrink-0 stroke-[1.7]" />
                  <a href="mailto:support@divineyou.com" className="hover:text-[#285538] transition-colors">
                    support@divineyou.com
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={17} className="text-[#243126] shrink-0 stroke-[1.7]" />
                  <a href="tel:+919876543210" className="hover:text-[#285538] transition-colors">
                    +91 9876543210
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Whiter Form Card without Email Box */}
            <div className="lg:col-span-7 flex justify-end">
              <div className="w-full max-w-[520px] rounded-[24px] border border-[#e8e2d4] bg-white p-6 sm:p-8 shadow-xs">
                {!isLoggedIn ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#f3efe6] flex items-center justify-center mx-auto text-[#285538]">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-[#243126]">
                        Sign in required
                      </h3>
                      <p className="text-xs text-[#66655d] mt-1 max-w-xs mx-auto">
                        Please sign in to send a message directly from your registered account email.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="rounded-xl bg-[#285538] px-6 py-2.5 text-xs font-medium text-white shadow-2xs hover:bg-[#1f462c] transition cursor-pointer"
                    >
                      Sign in to Account
                    </button>
                  </div>
                ) : isSubmitted ? (
                  <div className="py-10 text-center space-y-2.5">
                    <h3 className="font-serif text-2xl text-[#285538] font-medium">
                      Thank you for reaching out!
                    </h3>
                    <p className="text-xs text-[#66655d]">
                      Your message has been sent from <span className="font-medium text-[#243126]">{user?.email}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="mt-4 text-xs font-semibold text-[#285538] underline cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Auto-filled User Info Badge */}
                    <div className="p-3 rounded-xl bg-[#fbf9f3] border border-[#ded8ca]/80 text-xs text-[#66655d]">
                      Sending as: <span className="font-semibold text-[#243126]">{user?.email}</span>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#243126] mb-1.5">
                        Message
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="How can we help?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-xl border border-[#ded8ca] bg-[#fbf9f3]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[#243126] placeholder:text-[#807d73] focus:border-[#285538] focus:bg-white outline-none transition resize-none"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-[#285538] px-6 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xs hover:bg-[#1f462c] transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                        <span>{loading ? "Sending..." : "Send Message"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}