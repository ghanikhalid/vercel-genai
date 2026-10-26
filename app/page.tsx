import Link from "next/link";
import AuthButton from "@/app/components/AuthButton";
import {
  IconCamera,
  IconCookie,
  IconHeroLineScene,
  IconSparkle,
  IconUser,
} from "@/app/components/Icons";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="page-wrap">
      <SiteHeader user={user} active="home" />

      <main className="main-content">
        <section className="hero-stage-3d">
          <div className="hero-copy-col">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>AI PHOTO CAPTIONS · DAILY MEME ORACLE</span>
            </div>

            <h1 className="hero-title">
              Drop any photo.{" "}
              <span className="text-gradient">Crack your daily meme fortune.</span>
            </h1>

            <p className="hero-sub">
              Turn any camera-roll moment into a spot-on caption, or roll your 24-hour meme prophecy to see how your day will unfold.
            </p>

            <div className="hero-cta-row">
              {user ? (
                <>
                  <Link href="/gallery" className="btn-primary">
                    <IconCamera size={16} />
                    <span>Caption a Photo</span>
                  </Link>
                  <Link href="/dashboard" className="btn-ghost">
                    <IconCookie size={16} />
                    <span>Roll Daily Fortune</span>
                  </Link>
                </>
              ) : (
                <>
                  <AuthButton user={null} />
                  <Link href="/dashboard" className="btn-ghost">
                    <IconCookie size={16} />
                    <span>Preview Daily Fortune</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Apple-inspired 3D perspective floating card stack */}
          <div className="apple-3d-scene" aria-hidden="true">
            <div className="apple-3d-rig">
              <div className="floating-chip chip-top-left">
                <IconSparkle size={14} />
                <span>INSTANT WIT</span>
              </div>
              <div className="floating-chip chip-bottom-right">
                <IconCookie size={14} />
                <span>24H PROPHECY</span>
              </div>

              <div className="showcase-card-back">
                <div className="showcase-back-label">UPVOTED +42</div>
                <div className="showcase-back-caption">
                  &ldquo;POV: YOU SAID &lsquo;ONE QUICK FIX&rsquo; AT 4:55 PM&rdquo;
                </div>
              </div>

              <div className="showcase-card-front">
                <div className="showcase-art">
                  <div className="showcase-svg-wrap">
                    <IconHeroLineScene size={112} />
                  </div>
                </div>
                <div className="showcase-meme-bar">
                  &ldquo;ME PRETENDING MY 47 OPEN TABS ARE A CAREFULLY ENGINEERED SYSTEM&rdquo;
                </div>
                <div className="showcase-slip">
                  <span className="showcase-slip-kicker">TODAY&apos;S FORTUNE</span>
                  <p className="showcase-slip-text">
                    You will improvise through three minor plot twists while holding an iced drink.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bento-grid">
          <div className="bento-card">
            <div className="bento-icon">
              <IconCamera size={22} />
            </div>
            <div className="bento-body">
              <span className="kicker">01 · Visual Comedy</span>
              <h2 className="card-heading">Context-aware photo captions</h2>
              <p className="card-copy">
                Drop any photo and get a witty caption tailored to the moment.
              </p>
            </div>
          </div>

          <div className="bento-card">
            <div className="bento-icon">
              <IconCookie size={22} />
            </div>
            <div className="bento-body">
              <span className="kicker">02 · 24-Hour Ritual</span>
              <h2 className="card-heading">Daily Meme Fortune Cookie</h2>
              <p className="card-copy">
                Crack open one custom meme prophecy every 24 hours.
              </p>
            </div>
          </div>

          <div className="bento-card">
            <div className="bento-icon">
              <IconUser size={22} />
            </div>
            <div className="bento-body">
              <span className="kicker">03 · Members-Only Wall</span>
              <h2 className="card-heading">Private club + live voting</h2>
              <p className="card-copy">
                Share with members, vote on favorites, or take back your vote anytime.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
