"use client";

import { useEffect, useState, useTransition } from "react";
import { castVoteAction } from "@/app/actions";
import { IconVoteDown, IconVoteUp } from "@/app/components/Icons";

export interface CaptionedPhotoItem {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  author_name: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
}

export default function CaptionCard({ image }: { image: CaptionedPhotoItem }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticVote, setOptimisticVote] = useState<number>(image.userVote);

  useEffect(() => {
    setOptimisticVote(image.userVote);
  }, [image.userVote, image.upvotes, image.downvotes, image.score]);

  const activeVote = optimisticVote;
  const upvotes =
    image.upvotes + (activeVote === 1 ? 1 : 0) - (image.userVote === 1 ? 1 : 0);
  const downvotes =
    image.downvotes +
    (activeVote === -1 ? 1 : 0) -
    (image.userVote === -1 ? 1 : 0);
  const score = upvotes - downvotes;

  const handleVote = (val: 1 | -1) => {
    setError(null);
    // Clicking the already-selected vote button retracts the vote (0)
    const nextVote = activeVote === val ? 0 : val;
    setOptimisticVote(nextVote);

    startTransition(async () => {
      const res = await castVoteAction(image.id, nextVote);
      if (!res.success) {
        setOptimisticVote(image.userVote);
        setError(res.error || "Could not record vote.");
      }
    });
  };

  return (
    <article className="meme-card">
      <div className="meme-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.image_url}
          alt={image.caption}
          className="meme-img"
          loading="lazy"
        />
      </div>

      <div className="meme-caption-box">
        <p className="meme-below-caption">&ldquo;{image.caption}&rdquo;</p>
      </div>

      <footer className="meme-bar">
        <div className="meme-credit">
          <span className="meme-author">{image.author_name}</span>
          <time className="meme-date">
            {new Date(image.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>

        <div className="vote-pill" role="group" aria-label="Vote on this caption">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleVote(1)}
            className={`vote-btn up ${activeVote === 1 ? "active" : ""}`}
            aria-label={activeVote === 1 ? "Remove upvote" : "Upvote"}
            aria-pressed={activeVote === 1}
            title={activeVote === 1 ? "Click again to take back your vote" : "Upvote"}
          >
            <IconVoteUp size={15} />
            <span>{upvotes}</span>
          </button>

          <span
            className={`vote-net ${
              score > 0 ? "pos" : score < 0 ? "neg" : ""
            }`}
          >
            {score > 0 ? `+${score}` : score}
          </span>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleVote(-1)}
            className={`vote-btn down ${activeVote === -1 ? "active" : ""}`}
            aria-label={activeVote === -1 ? "Remove downvote" : "Downvote"}
            aria-pressed={activeVote === -1}
            title={activeVote === -1 ? "Click again to take back your vote" : "Downvote"}
          >
            <IconVoteDown size={15} />
            <span>{downvotes}</span>
          </button>
        </div>
      </footer>

      {error && <p className="meme-vote-error">{error}</p>}
    </article>
  );
}
