import Link from "next/link";
import { cookies } from "next/headers";
import AuthButton from "@/app/components/AuthButton";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabaseServer";
import type { DailyFortuneRecord } from "@/app/actions";
import FortuneRoller from "./FortuneRoller";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialFortune: DailyFortuneRecord | null = null;

  if (user) {
    const { data: dbRow, error } = await supabase
      .from("daily_meme_fortunes")
      .select("caption, prophecy, vibe_tag, lucky_stat, rolled_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && dbRow) {
      initialFortune = dbRow as DailyFortuneRecord;
    } else {
      const cookieStore = await cookies();
      const rawCookie = cookieStore.get(`prism_fortune_${user.id}`)?.value;
      if (rawCookie) {
        try {
          initialFortune = JSON.parse(rawCookie) as DailyFortuneRecord;
        } catch {
          initialFortune = null;
        }
      }
    }
  }

  return (
    <div className="page-wrap">
      <SiteHeader user={user} active="dashboard" />

      <main className="main-content">
        <FortuneRoller
          initialFortune={initialFortune}
          isAuthenticated={Boolean(user)}
        />

        {!user && (
          <section className="gate-card" style={{ marginTop: "24px" }}>
            <span className="kicker">Members Only</span>
            <h2 className="gate-title">Sign in to save your daily 24-hour roll.</h2>
            <p className="gate-copy">
              Each Google account gets one custom AI meme fortune every 24 hours. Sign in below to unlock your personal fortune slip and countdown clock.
            </p>
            <div className="gate-actions">
              <AuthButton user={null} />
              <Link href="/gallery" className="btn-ghost">
                Visit Caption Wall
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
