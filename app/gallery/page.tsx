import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import CaptionCard from "./CaptionCard";
import UploadForm from "./UploadForm";

export const revalidate = 0;

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: images, error: imagesError } = await supabase
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
    ...new Set((images ?? []).map((item) => item.user_id).filter(Boolean)),
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

  return (
    <main className="page">
      <section className="section-hero">
        <span className="pill-badge">
          <span className="pill-dot" />
          Community Meme Studio
        </span>
        <h1 className="hero-title">
          Drop a Photo.{" "}
          <span className="gradient-text">Stamp the Punchline.</span>
        </h1>
        <p className="lede">
          Upload any picture. Gemini inspects the exact scene, writes a funny or
          painfully relatable caption that fits the frame, and superimposes it
          for the room to rate.
        </p>
      </section>

      <UploadForm />

      <hr className="rule" />

      <section className="stack">
        <span className="kicker">Community Feed &amp; Live Rankings</span>

        {imagesError && (
          <p className="err">
            {imagesError.message.includes("captioned_images")
              ? "Run supabase/schema.sql in the Supabase SQL editor to create the caption tables and RLS policies."
              : imagesError.message}
          </p>
        )}

        {!imagesError && (!images || images.length === 0) && (
          <div className="glass-card empty-fortune-card">
            <p className="empty-title">No Captioned Photos Yet</p>
            <p className="muted">
              Upload the first picture above and let Gemini roast it.
            </p>
          </div>
        )}

        <div className="gallery">
          {images?.map((item) => {
            const votes = item.caption_votes ?? [];
            const upvotes = votes.filter((vote) => vote.vote_value === 1).length;
            const downvotes = votes.filter(
              (vote) => vote.vote_value === -1
            ).length;
            const userVote =
              votes.find((vote) => vote.user_id === user.id)?.vote_value ??
              null;
            const author = profileById.get(item.user_id);

            return (
              <CaptionCard
                key={item.id}
                image={{
                  id: item.id,
                  image_url: item.image_url,
                  caption: item.caption,
                  authorName: author?.first_name
                    ? `${author.first_name} ${author.last_name || ""}`.trim()
                    : "Anonymous",
                }}
                score={upvotes - downvotes}
                userVote={userVote}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
