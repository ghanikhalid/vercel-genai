"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { rollDailyFortuneAction, type DailyFortuneRecord } from "@/app/actions";
import { IconCookie, IconDice, IconSparkle } from "@/app/components/Icons";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatRemaining(ms: number) {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(clamped / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((clamped % 3600) / 60)).padStart(2, "0");
  const seconds = String(clamped % 60).padStart(2, "0");
  return { hours, minutes, seconds, totalSeconds: clamped };
}

export default function FortuneRoller({
  initialFortune,
  isAuthenticated,
}: {
  initialFortune: DailyFortuneRecord | null;
  isAuthenticated: boolean;
}) {
  const [fortune, setFortune] = useState<DailyFortuneRecord | null>(initialFortune);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const rolledAtMs = fortune?.rolled_at ? new Date(fortune.rolled_at).getTime() : 0;
  const nextRollMs = rolledAtMs ? rolledAtMs + COOLDOWN_MS : 0;
  const remainingMs = Math.max(0, nextRollMs - nowMs);
  const isLocked = remainingMs > 0;
  const countdown = formatRemaining(remainingMs);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 14;
    const rx = (0.5 - y) * 14;
    setTilt({ rx, ry, gx: Math.round(x * 100), gy: Math.round(y * 100) });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  const handleRoll = () => {
    if (!isAuthenticated) {
      setError("Sign in with Google in the header to crack open today's meme fortune.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await rollDailyFortuneAction();
      if (res.fortune) {
        setFortune(res.fortune);
        setNowMs(Date.now());
      }
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="fortune-experience">
      <div className="fortune-stage-grid">
        {/* Left column: Oracle controls + 24h lock timer */}
        <div className="fortune-control-panel">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>DAILY MEME ORACLE · ONCE EVERY 24 HOURS</span>
          </div>

          <h1 className="page-title" style={{ marginTop: "14px" }}>
            Crack open your <span className="text-gradient">Daily Meme Fortune.</span>
          </h1>

          <p className="page-sub" style={{ marginTop: "12px" }}>
            Once every 24 hours, Gemini channels the universe to write a custom meme headline and fortune-cookie prophecy predicting the exact chaotic energy of your day.
          </p>

          <div className="fortune-action-box">
            <button
              type="button"
              onClick={handleRoll}
              disabled={isPending || isLocked}
              className={`fortune-roll-btn ${isPending ? "is-rolling" : ""} ${
                isLocked ? "is-locked" : ""
              }`}
            >
              <span className="fortune-btn-icon">
                {isPending ? (
                  <IconSparkle size={20} />
                ) : isLocked ? (
                  <IconCookie size={20} />
                ) : (
                  <IconDice size={20} />
                )}
              </span>
              <span>
                {isPending
                  ? "Consulting the Meme Oracle..."
                  : isLocked
                  ? "Today's Fortune Cracked"
                  : fortune
                  ? "Roll New 24h Meme Fortune"
                  : "Crack Open Today's Fortune"}
              </span>
            </button>

            {isLocked && (
              <div className="cooldown-bar" aria-live="polite">
                <div className="cooldown-header">
                  <span className="cooldown-label">NEXT FORTUNE UNLOCKS IN</span>
                  <span className="cooldown-status">LOCKED FOR 24H</span>
                </div>
                <div className="cooldown-digits">
                  <div className="digit-box">
                    <span className="digit-val">{countdown.hours}</span>
                    <span className="digit-unit">HRS</span>
                  </div>
                  <span className="digit-sep">:</span>
                  <div className="digit-box">
                    <span className="digit-val">{countdown.minutes}</span>
                    <span className="digit-unit">MIN</span>
                  </div>
                  <span className="digit-sep">:</span>
                  <div className="digit-box">
                    <span className="digit-val">{countdown.seconds}</span>
                    <span className="digit-unit">SEC</span>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}
          </div>

          {fortune && (
            <div className="fortune-meta-pills">
              <div className="meta-pill">
                <span className="meta-pill-label">TODAY&apos;S AURA</span>
                <span className="meta-pill-value">{fortune.vibe_tag}</span>
              </div>
              <div className="meta-pill">
                <span className="meta-pill-label">LUCKY METRIC</span>
                <span className="meta-pill-value">{fortune.lucky_stat}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right column: 3D Interactive Typographic Meme Fortune Card */}
        <div className="fortune-3d-viewport">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`fortune-3d-card ${isPending ? "spinning-3d" : ""} ${
              fortune ? "is-revealed" : "is-unrolled"
            }`}
            style={
              {
                "--rx": `${tilt.rx}deg`,
                "--ry": `${tilt.ry}deg`,
                "--gx": `${tilt.gx}%`,
                "--gy": `${tilt.gy}%`,
              } as React.CSSProperties
            }
          >
            <div className="fortune-3d-glare" />

            {fortune ? (
              <>
                <div className="fortune-text-showcase">
                  <div className="fortune-showcase-top">
                    <span className="fortune-chip">
                      <IconCookie size={14} />
                      <span>TODAY&apos;S MEME HEADLINE</span>
                    </span>
                    <span className="fortune-serial">24H EDITION</span>
                  </div>

                  <blockquote className="fortune-meme-headline">
                    &ldquo;{fortune.caption}&rdquo;
                  </blockquote>

                  <div className="fortune-divider-line">
                    <IconSparkle size={14} />
                  </div>
                </div>

                <div className="fortune-slip">
                  <div className="fortune-slip-header">
                    <span className="slip-kicker">FORTUNE COOKIE SLIP · YOUR DAY AHEAD</span>
                    <span className="slip-date">
                      {new Date(fortune.rolled_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="fortune-prophecy">&ldquo;{fortune.prophecy}&rdquo;</p>
                </div>
              </>
            ) : (
              <div className="fortune-mystery-state">
                <div className="mystery-orb-ring">
                  <div className="mystery-cookie-icon">
                    <IconCookie size={44} />
                  </div>
                </div>
                <span className="kicker" style={{ marginTop: "20px" }}>
                  UNOPENED 24-HOUR ORACLE
                </span>
                <h2 className="mystery-title">
                  What meme is your day going to become?
                </h2>
                <p className="mystery-copy">
                  Hit the button to crack open a fresh AI meme headline and daily prophecy tailored to your next 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
