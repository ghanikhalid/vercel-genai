import AuthButton from "@/app/components/AuthButton";
import { IconCamera } from "@/app/components/Icons";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabaseServer";
import CaptionCard, { type CaptionedPhotoItem } from "./CaptionCard";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="page-wrap">
        <SiteHeader user={null} active="gallery" />
        <main className="main-content">
          <section className="gate-card">
            <span className="kicker">Members Only</span>
            <h1 className="gate-title">Sign in to view &amp; vote on captions.</h1>
            <p className="gate-copy">
              The Caption Wall is a private community studio. Sign in with Google to upload photos, generate AI meme captions, and vote on the feed.
            </p>
            <div className="gate-actions">
              <AuthButton user={null} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  const { data: rawImages, error: imagesError } = await supabase
    .from("captioned_images")
    .select(
      `
      id,
      user_id,
      image_url,
      caption,
      created_at,
      caption_votes (user_id, vote_value)
    `
    )
    .order("created_at", { ascending: false });

  const profileById = new Map<
    string,
    { first_name: string | null; last_name: string | null }
  >();
  const authorIds = [
    ...new Set((rawImages ?? []).map((item) => item.user_id).filter(Boolean)),
  ];
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", authorIds);
    for (const profile of profiles ?? []) {
      profileById.set(profile.id, profile);
    }
  }

  const items: CaptionedPhotoItem[] = (rawImages ?? []).map((row) => {
    const votes = (row.caption_votes ?? []) as Array<{
      user_id: string;
      vote_value: number;
    }>;
    let upvotes = 0;
    let downvotes = 0;
    let userVote = 0;

    for (const v of votes) {
      if (v.vote_value === 1) upvotes += 1;
      if (v.vote_value === -1) downvotes += 1;
      if (v.user_id === user.id) userVote = v.vote_value;
    }

    const prof = profileById.get(row.user_id);
    const fullName = [prof?.first_name, prof?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: row.id,
      image_url: row.image_url,
      caption: row.caption,
      created_at: row.created_at,
      author_name: fullName || "Club Member",
      score: upvotes - downvotes,
      upvotes,
      downvotes,
      userVote,
    };
  });

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="page-wrap">
      <SiteHeader user={user} active="gallery" />

      <main className="main-content">
        <div className="page-header-row">
          <div>
            <span className="kicker">Community Meme Studio</span>
            <h1 className="page-title">
              Drop a photo. <span className="text-gradient">Stamp the punchline.</span>
            </h1>
          </div>
          <p className="page-sub">
            Gemini inspects the exact objects, expressions, and awkward timing in your photo and burns a relatable caption onto the frame. Click an active vote button again anytime to take back your vote.
          </p>
        </div>

        <UploadForm />

        {imagesError && (
          <div className="schema-banner">
            <strong>Database setup required:</strong>{" "}
            {imagesError.message.includes("captioned_images")
              ? "Run supabase/schema.sql in your Supabase SQL Editor to create the captioned_images & caption_votes tables."
              : imagesError.message}
          </div>
        )}

        <section className="feed-section">
          <div className="feed-header">
            <h2 className="section-title">Community Caption Feed</h2>
            <span className="count-pill">{items.length} captioned</span>
          </div>

          {!imagesError && items.length === 0 ? (
            <div className="empty-card">
              <div style={{ display: "inline-flex", marginBottom: "10px", color: "var(--accent-champagne)" }}>
                <IconCamera size={28} />
              </div>
              <p className="empty-title">No captioned photos yet.</p>
              <p className="empty-sub">
                Upload the first picture above and let Gemini write the punchline.
              </p>
            </div>
          ) : (
            <div className="meme-grid">
              {items.map((item) => (
                <CaptionCard key={item.id} image={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
