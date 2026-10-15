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
  const authorIds = [...new Set((images ?? []).map((item) => item.user_id).filter(Boolean))];
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
      <p className="kicker">The wall / members only</p>
      <h1 className="display" style={{ fontSize: "clamp(56px, 10vw, 96px)" }}>
        CAPTION
        <br />
        THE NIGHT
      </h1>
      <p className="lede">
        Upload a still. The model has to land a joke on what is actually in the
        frame — then the room votes.
      </p>

      <UploadForm />

      <hr className="rule" />

      <section className="stack">
        <p className="kicker">Community prints</p>

        {imagesError && (
          <p className="err">
            {imagesError.message.includes("captioned_images")
              ? "Run supabase/schema.sql in the Supabase SQL editor to create the caption tables and RLS policies."
              : imagesError.message}
          </p>
        )}

        {!imagesError && (!images || images.length === 0) && (
          <p className="muted">The wall is empty. Be the first print of the night.</p>
        )}

        <div className="gallery">
          {images?.map((item) => {
            const votes = item.caption_votes ?? [];
            const upvotes = votes.filter((vote) => vote.vote_value === 1).length;
            const downvotes = votes.filter((vote) => vote.vote_value === -1).length;
            const userVote = votes.find((vote) => vote.user_id === user.id)?.vote_value ?? null;
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
