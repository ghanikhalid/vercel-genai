"use client";

import { createClient } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <button className="btn btn-ghost" onClick={handleLogout} type="button">
        Sign Out
      </button>
    );
  }

  return (
    <button className="btn btn-primary" onClick={handleLogin} type="button">
      Sign in with Google
    </button>
  );
}
