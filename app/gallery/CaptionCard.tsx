"use client";

import { useState, useTransition } from "react";
import { castVoteAction } from "@/app/actions";

export default function CaptionCard({
  image,
  score,
  userVote,
}: {
  image: {
    id: string;
    image_url: string;
    caption: string;
    authorName: string;
  };
  score: number;
  userVote: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleVote = (value: number) => {
    startTransition(async () => {
      await castVoteAction(image.id, value);
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 12,
      ry: (x - 0.5) * 12,
    });
  };

  return (
    <article
      className="caption-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={{
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
    >
      <div className="frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.image_url} alt={image.caption} />
        <p className="frame-caption">{image.caption}</p>
      </div>
      <div className="meta-row">
        <span className="author">By {image.authorName}</span>
        <div className="votes">
          <button
            type="button"
            onClick={() => handleVote(1)}
            disabled={isPending}
            data-on={userVote === 1 ? "up" : undefined}
            title="Upvote"
          >
            ▲
          </button>
          <span className="score">{score}</span>
          <button
            type="button"
            onClick={() => handleVote(-1)}
            disabled={isPending}
            data-on={userVote === -1 ? "down" : undefined}
            title="Downvote"
          >
            ▼
          </button>
        </div>
      </div>
    </article>
  );
}
