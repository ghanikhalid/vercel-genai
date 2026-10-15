"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseBrowser";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
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
    if (!userId) return;
    setSaving(true);
    setStatusMessage("");

    let uploadedAvatarUrl = avatarUrl;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}-${Date.now()}.${fileExt}`;

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
      id: userId,
      first_name: firstName,
      last_name: lastName,
      avatar_url: uploadedAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (updateError) {
      setStatusMessage(`Save failed: ${updateError.message}`);
    } else {
      setStatusMessage("Profile successfully updated!");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <Link href="/" className="muted">
        ← Home
      </Link>
      <p className="kicker">Identity</p>
      <h1 className="display" style={{ fontSize: 72 }}>
        PROFILE
      </h1>

      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="avatar" src={avatarUrl} alt="User avatar" />
      )}

      <form onSubmit={handleSave} className="stack" style={{ marginTop: 24, maxWidth: 520 }}>
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="photo">Portrait</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </div>
        <button className="btn btn-blood" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {statusMessage && (
        <p className={statusMessage.toLowerCase().includes("error") || statusMessage.toLowerCase().includes("fail") ? "err" : "ok"}>
          {statusMessage}
        </p>
      )}
    </main>
  );
}
