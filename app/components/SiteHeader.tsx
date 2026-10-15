"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";

export default function SiteHeader({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <em>NYC / After Hours</em>
        <strong>LAST&nbsp;NITE</strong>
      </Link>
      <nav className="site-nav">
        {user && (
          <>
            <Link href="/gallery" data-active={pathname === "/gallery"}>
              Gallery
            </Link>
            <Link href="/profile" data-active={pathname === "/profile"}>
              Profile
            </Link>
            <Link href="/dashboard" data-active={pathname === "/dashboard"}>
              Backstage
            </Link>
          </>
        )}
        <AuthButton user={user} />
      </nav>
    </header>
  );
}
