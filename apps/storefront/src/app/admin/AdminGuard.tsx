"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const isAdmin = user?.app_metadata?.role === "admin";

        if (!user || !isAdmin) {
          setAuthorized(false);
          await supabase.auth.signOut();
          router.replace("/admin/login");
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        setAuthorized(false);
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f3] flex flex-col items-center justify-center text-[#807d73] space-y-3">
        <Loader2 className="animate-spin text-[#285538]" size={28} />
        <p className="text-xs font-medium">Verifying admin permissions...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}