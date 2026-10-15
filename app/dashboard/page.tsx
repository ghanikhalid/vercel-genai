import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabaseServer";
import type { DailyFortuneRecord } from "@/app/actions";
import FortuneRoller from "./FortuneRoller";

export const revalidate = 0;

export default async function DailyFortunePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  let initialFortune: DailyFortuneRecord | null = null;

  const { data: dbRow, error: selectErr } = await supabase
    .from("daily_meme_fortunes")
    .select("image_url, caption, prophecy, vibe_tag, lucky_stat, rolled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!selectErr && dbRow) {
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

  return (
    <main className="page">
      <section className="section-hero">
        <span className="pill-badge">
          <span className="pill-dot" />
          24-Hour Meme Oracle
        </span>
        <h1 className="hero-title">
          Your Daily <span className="gradient-text">Meme Cookie.</span>
        </h1>
        <p className="lede">
          Once every 24 hours, crack open a freshly generated meme and prophetic
          roast predicting the exact energy your day is about to serve.
        </p>
      </section>

      <FortuneRoller initialFortune={initialFortune} />
    </main>
  );
}
