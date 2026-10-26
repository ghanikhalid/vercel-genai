import AuthButton from "@/app/components/AuthButton";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabaseServer";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page-wrap">
        <SiteHeader user={null} active="profile" />
        <main className="main-content">
          <section className="gate-card">
            <span className="kicker">Members Only</span>
            <h1 className="gate-title">Sign in to customize your profile.</h1>
            <p className="gate-copy">
              Set your display name and portrait so the community knows who posted each caption.
            </p>
            <div className="gate-actions">
              <AuthButton user={null} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="page-wrap">
      <SiteHeader user={user} active="profile" />

      <main className="main-content">
        <div className="page-header-row">
          <div>
            <span className="kicker">Member Identity</span>
            <h1 className="page-title">
              Club <span className="text-gradient">Profile</span>
            </h1>
          </div>
          <p className="page-sub">
            Your display name appears under every photo you caption on the community wall.
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          userEmail={user.email || ""}
          initialFirstName={profile?.first_name || ""}
          initialLastName={profile?.last_name || ""}
          initialAvatarUrl={profile?.avatar_url || null}
        />
      </main>
    </div>
  );
}
