import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";
import { IconCamera, IconCookie, IconSparkle, IconUser } from "./Icons";

export default function SiteHeader({
  user,
  active,
}: {
  user: User | null;
  active?: "home" | "gallery" | "dashboard" | "profile";
}) {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        <span className="brand-orb" aria-hidden="true" />
        <span>PRISM POP</span>
        <span className="brand-tag">CHIC EDITION</span>
      </Link>

      <nav className="site-nav" aria-label="Main navigation">
        <Link
          href="/"
          className={`nav-pill ${active === "home" ? "active" : ""}`}
        >
          <IconSparkle size={14} />
          <span>Overview</span>
        </Link>
        <Link
          href="/gallery"
          className={`nav-pill ${active === "gallery" ? "active" : ""}`}
        >
          <IconCamera size={14} />
          <span>Caption Wall</span>
        </Link>
        <Link
          href="/dashboard"
          className={`nav-pill ${active === "dashboard" ? "active" : ""}`}
        >
          <IconCookie size={14} />
          <span>Daily Fortune</span>
        </Link>
        <Link
          href="/profile"
          className={`nav-pill ${active === "profile" ? "active" : ""}`}
        >
          <IconUser size={14} />
          <span>Profile</span>
        </Link>
      </nav>

      <div className="header-actions">
        <AuthButton user={user} />
      </div>
    </header>
  );
}
