"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { IconUser } from "@/app/components/Icons";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabaseBrowser";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", currentUser.id)
        .single();

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatusMessage("");

    let uploadedAvatarUrl = avatarUrl;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setStatusMessage(`Avatar upload error: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      uploadedAvatarUrl = publicUrl;
      setAvatarUrl(publicUrl);
    }

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      avatar_url: uploadedAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (updateError) {
      setStatusMessage(`Save failed: ${updateError.message}`);
    } else {
      setStatusMessage("Profile updated.");
      router.refresh();
    }
  };

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

        {loading ? (
          <div className="empty-card">
            <p className="empty-sub">Loading your profile...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="upload-studio"
            style={{ maxWidth: "600px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "18px",
                      objectFit: "cover",
                      border: "1px solid var(--surface-border-bright)",
                    }}
                  />
                ) : (
                  <div className="bento-icon" style={{ width: "64px", height: "64px" }}>
                    <IconUser size={26} />
                  </div>
                )}
                <div>
                  <span className="kicker">Portrait</span>
                  <p className="card-copy" style={{ margin: "4px 0 0" }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span className="kicker">First Name</span>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--surface-border)",
                      color: "var(--text-main)",
                      fontSize: "0.95rem",
                    }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span className="kicker">Last Name</span>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--surface-border)",
                      color: "var(--text-main)",
                      fontSize: "0.95rem",
                    }}
                  />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span className="kicker">Upload New Portrait</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--surface-border)",
                    color: "var(--text-secondary)",
                    fontSize: "0.86rem",
                  }}
                />
              </label>

              <div>
                <button className="btn-primary" type="submit" disabled={saving}>
                  <span>{saving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>

              {statusMessage && (
                <p
                  className={
                    statusMessage.toLowerCase().includes("error") ||
                    statusMessage.toLowerCase().includes("fail")
                      ? "form-error"
                      : "kicker"
                  }
                >
                  {statusMessage}
                </p>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
