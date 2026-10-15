import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import AuthButton from "./components/AuthButton";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const needsNameCompletion =
    user && (!profile?.first_name || !profile?.last_name);

  return (
    <main className="page">
      <section className="hero-3d-grid">
        <div>
          <span className="pill-badge">
            <span className="pill-dot" />
            Powered by Gemini Vision &amp; 3D Motion
          </span>
          <h1 className="hero-title">
            Turn Any Photo Into{" "}
            <span className="gradient-text">Pure Comedy Gold.</span>
          </h1>
          <p className="lede">
            Drop a snapshot and let AI write a punchline that only works on your
            exact frame — or crack open your 24-hour Meme Fortune Cookie to see
            how your day is about to unfold.
          </p>

          <div className="row" style={{ marginTop: 26 }}>
            {user ? (
              <>
                <Link className="btn btn-primary btn-lg" href="/gallery">
                  ✨ Open Caption Wall
                </Link>
                <Link className="btn btn-secondary btn-lg" href="/dashboard">
                  🥠 Roll Daily Meme Fortune
                </Link>
              </>
            ) : (
              <AuthButton user={null} />
            )}
          </div>
        </div>

        <div className="stage-3d" aria-hidden="true">
          <div className="floating-stack">
            <div className="showcase-layer layer-back" />
            <div className="showcase-layer layer-main">
              <span className="kicker">LIVE 3D PREVIEW</span>
              <div className="layer-emoji-stage">🦝🧋💻</div>
              <div className="layer-caption-pill">
                “ME AT 2 AM CONVINCED ONE MORE TAB WILL FIX MY LIFE”
              </div>
            </div>
            <div className="layer-floating-badge">🥠 24H FORTUNE ORACLE</div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      {user ? (
        <section className="stack">
          {needsNameCompletion && (
            <div className="panel panel-warn">
              <span className="kicker">Profile Incomplete</span>
              <h2 className="card-heading">Claim Your Creator Tag</h2>
              <p className="lede" style={{ fontSize: 17, marginBottom: 16 }}>
                Add your first and last name so every captioned meme on the wall
                credits you properly.
              </p>
              <Link className="btn btn-primary" href="/profile">
                Complete Profile
              </Link>
            </div>
          )}

          <div className="bento-grid">
            <div className="bento-card">
              <div className="bento-icon">📸</div>
              <span className="kicker">AI CAPTION STUDIO</span>
              <h2 className="card-heading">Superimpose the Joke</h2>
              <p className="muted" style={{ marginBottom: 18 }}>
                Upload any photo to Supabase Storage. Gemini inspects every
                detail in the frame, lands a custom joke, and stamps it onto the
                image for the community to upvote or downvote.
              </p>
              <Link className="btn btn-primary" href="/gallery">
                Go to Caption Wall →
              </Link>
            </div>

            <div className="bento-card">
              <div className="bento-icon">🥠</div>
              <span className="kicker">ONCE EVERY 24 HOURS</span>
              <h2 className="card-heading">Daily Meme Fortune Cookie</h2>
              <p className="muted" style={{ marginBottom: 18 }}>
                Roll once a day for a freshly generated meme and prophetic slip
                predicting the exact chaotic energy your day has in store.
              </p>
              <Link className="btn btn-secondary" href="/dashboard">
                Crack Today’s Cookie →
              </Link>
            </div>

            <div className="bento-card">
              <div className="bento-icon">🌈</div>
              <span className="kicker">SIGNED IN CREATOR</span>
              <h2 className="card-heading">
                {(profile?.first_name || "Anonymous") +
                  " " +
                  (profile?.last_name || "")}
              </h2>
              <p className="muted" style={{ marginBottom: 18 }}>
                User ID: {user.id.slice(0, 12)}… • Update your avatar and
                display name anytime.
              </p>
              <Link className="btn btn-ghost" href="/profile">
                Edit Profile →
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="glass-card stack" style={{ textAlign: "center", alignItems: "center" }}>
          <span className="pill-badge">
            <span className="pill-dot" />
            Members-Only Club
          </span>
          <h2 className="card-heading" style={{ marginBottom: 0 }}>
            Sign in with Google to Unlock the Wall &amp; Daily Fortune
          </h2>
          <p className="lede" style={{ fontSize: 17 }}>
            Viewing captioned memes, uploading photos, voting, and rolling your
            24-hour meme fortune all require a verified Google account.
          </p>
        </section>
      )}
    </main>
  );
}
