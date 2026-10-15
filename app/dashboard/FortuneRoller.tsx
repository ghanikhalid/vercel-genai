"use client";

import { useEffect, useState, useTransition } from "react";
import { rollDailyFortuneAction, type DailyFortuneRecord } from "@/app/actions";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}h : ${minutes}m : ${seconds}s`;
}

export default function FortuneRoller({
  initialFortune,
}: {
  initialFortune: DailyFortuneRecord | null;
}) {
  const [fortune, setFortune] = useState<DailyFortuneRecord | null>(initialFortune);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState<number>(() => Date.now());
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRollTime = fortune?.rolled_at
    ? new Date(fortune.rolled_at).getTime() + COOLDOWN_MS
    : 0;
  const remainingMs = Math.max(0, nextRollTime - now);
  const isLocked = remainingMs > 0;

  const handleRoll = () => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await rollDailyFortuneAction();
      if (res.fortune) {
        setFortune(res.fortune);
      }
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 16,
      ry: (x - 0.5) * 16,
      gx: Math.round(x * 100),
      gy: Math.round(y * 100),
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <section className="fortune-stage">
      <div className="fortune-controls glass-card">
        <div className="fortune-orb-wrap" aria-hidden="true">
          <div className={`cookie-orb ${isPending ? "is-spinning" : ""}`}>
            <span className="cookie-emoji">🥠</span>
            <span className="cookie-ring cookie-ring-1" />
            <span className="cookie-ring cookie-ring-2" />
          </div>
        </div>

        <div className="fortune-cta-copy">
          <span className="kicker">
            {isLocked ? "ORACLE COOLING DOWN" : "READY TO CRACK OPEN"}
          </span>
          <h2 className="card-heading">
            {isLocked
              ? "Today’s Prophecy Has Spoken"
              : "Roll Your Daily Meme Forecast"}
          </h2>
          <p className="muted">
            {isLocked
              ? "Your fate is sealed for the next 24 hours. Let the meme guide your choices."
              : "Tap Roll and Gemini will summon a meme + fortune slip that predicts how your day is actually going to go."}
          </p>

          <div className="row" style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={handleRoll}
              disabled={isPending || isLocked}
              className="btn btn-primary btn-lg"
            >
              {isPending
                ? "Summoning Your Fate..."
                : isLocked
                ? `Next Roll in ${formatRemaining(remainingMs)}`
                : "🎲 Roll Today’s Meme Fortune"}
            </button>

            {fortune?.rolled_at && (
              <span className="stat-chip">
                Last rolled{" "}
                {new Date(fortune.rolled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {errorMsg && (
            <p className="err" style={{ marginTop: 12 }}>
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {fortune ? (
        <div
          className="fortune-showcase-perspective"
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
        >
          <article
            className="fortune-card-3d"
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              ["--glare-x" as string]: `${tilt.gx}%`,
              ["--glare-y" as string]: `${tilt.gy}%`,
            }}
          >
            <div className="fortune-glare" />

            <div className="fortune-badges">
              <span className="neon-tag neon-tag-pink">
                ✨ {fortune.vibe_tag}
              </span>
              <span className="neon-tag neon-tag-cyan">
                🔮 {fortune.lucky_stat}
              </span>
            </div>

            <div className="frame fortune-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fortune.image_url} alt={fortune.caption} />
              <p className="frame-caption">{fortune.caption}</p>
            </div>

            <div className="fortune-slip">
              <span className="slip-label">TODAY’S FORTUNE SLIP</span>
              <p className="slip-text">“{fortune.prophecy}”</p>
            </div>
          </article>
        </div>
      ) : (
        <div className="glass-card empty-fortune-card">
          <p className="empty-title">No Fortune Cracked Yet Today</p>
          <p className="muted">
            Hit the roll button above to generate your first 24-hour meme
            forecast.
          </p>
        </div>
      )}
    </section>
  );
}
