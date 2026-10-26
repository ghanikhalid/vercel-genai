"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUser } from "@/app/components/Icons";
import { createClient } from "@/lib/supabaseBrowser";

export default function ProfileForm({
  userId,
  userEmail,
  initialFirstName,
  initialLastName,
  initialAvatarUrl,
}: {
  userId: string;
  userEmail: string;
  initialFirstName: string;
  initialLastName: string;
  initialAvatarUrl: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setStatusMessage("Profile updated.");
      router.refresh();
    }
  };

  return (
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
            <div
              className="bento-icon"
              style={{ width: "64px", height: "64px", marginBottom: 0 }}
            >
              <IconUser size={26} />
            </div>
          )}
          <div>
            <span className="kicker">Portrait</span>
            <p className="card-copy" style={{ margin: "4px 0 0" }}>
              {userEmail}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <label
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            <span className="kicker">First Name</span>
            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="chic-input"
            />
          </label>

          <label
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            <span className="kicker">Last Name</span>
            <input
              type="text"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="chic-input"
            />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className="kicker">Upload New Portrait</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="chic-file-input"
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
  );
}
