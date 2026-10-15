import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";

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

  const needsNameCompletion = user && (!profile?.first_name || !profile?.last_name);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="kicker">Room on fire / Vol. 04</p>
          <h1 className="display" style={{ fontSize: "clamp(72px, 14vw, 140px)" }}>
            LAST
            <br />
            NITE
          </h1>
          <p className="lede">
            Drop a photograph. Gemini reads the frame and writes the one-liner that
            only works on that picture — then we stamp it across the print.
          </p>
        </div>
        <div className="stamp">Members Only / Google Sign-In</div>
      </section>

      <hr className="rule" />

      {user ? (
        <section className="stack">
          {needsNameCompletion && (
            <div className="panel panel-warn">
              <p className="kicker">Registration incomplete</p>
              <p className="lede" style={{ fontSize: "18px", marginBottom: 16 }}>
                Set your first and last name so the gallery can credit the print.
              </p>
              <Link className="btn btn-blood" href="/profile">
                Complete Profile
              </Link>
            </div>
          )}

          <div className="panel">
            <p className="kicker">Signed in</p>
            <h2 className="display" style={{ fontSize: 48 }}>
              {(profile?.first_name || "Anonymous") + " " + (profile?.last_name || "")}
            </h2>
            <p className="muted">User ID: {user.id}</p>
          </div>

          <nav className="row">
            <Link className="btn btn-blood" href="/gallery">
              Open the Gallery
            </Link>
            <Link className="btn" href="/profile">
              Profile
            </Link>
            <Link className="btn" href="/dashboard">
              Backstage
            </Link>
          </nav>
        </section>
      ) : (
        <section className="panel">
          <p className="lede" style={{ margin: 0 }}>
            Sign in with Google to upload, caption, vote, and even look at the wall.
            The door stays locked until you do.
          </p>
        </section>
      )}
    </main>
  );
}
