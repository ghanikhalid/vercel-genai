"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";

export default function SiteHeader({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <header className="site-header-wrap">
      <div className="site-header">
        <Link href="/" className="site-brand">
          <span className="brand-orb" aria-hidden="true" />
          <span className="brand-text">
            <strong>PRISM POP</strong>
            <em>AI Humor Studio</em>
          </span>
        </Link>

        <nav className="site-nav">
          {user && (
            <>
              <Link href="/gallery" data-active={pathname === "/gallery"}>
                ✨ Caption Wall
              </Link>
              <Link href="/dashboard" data-active={pathname === "/dashboard"}>
                🥠 Daily Fortune
              </Link>
              <Link href="/profile" data-active={pathname === "/profile"}>
                👤 Profile
              </Link>
            </>
          )}
          <AuthButton user={user} />
        </nav>
      </div>
    </header>
  );
}
