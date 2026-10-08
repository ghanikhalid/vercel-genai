'use client';

import { useTransition } from 'react';
import { castVoteAction } from '@/app/actions';

export default function ExcuseCard({
                                       excuse,
                                       score,
                                       userVote,
                                       isLoggedIn,
                                   }: {
    excuse: any;
    score: number;
    userVote: number | null;
    isLoggedIn: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    const handleVote = (val: number) => {
        if (!isLoggedIn) {
            alert('Please sign in to vote!');
            return;
        }
        startTransition(async () => {
            await castVoteAction(excuse.id, val);
        });
    };

    const authorName = excuse.profiles?.first_name
        ? `${excuse.profiles.first_name} ${excuse.profiles.last_name || ''}`.trim()
        : 'Anonymous Student';

    return (
        <article
            style={{
                display: 'flex',
                gap: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '20px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
        >
            {/* Upvote / Downvote Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '48px' }}>
                <button
                    onClick={() => handleVote(1)}
                    disabled={isPending || !isLoggedIn}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                        color: userVote === 1 ? '#16a34a' : '#9ca3af',
                        fontWeight: userVote === 1 ? 'bold' : 'normal',
                    }}
                    title="Would Actually Send (+1)"
                >
                    ▲
                </button>
                <span
                    style={{
                        fontSize: '15px',
                        fontWeight: 'bold',
                        margin: '4px 0',
                        color: score > 0 ? '#16a34a' : score < 0 ? '#dc2626' : '#6b7280',
                    }}
                >
          {score}
        </span>
                <button
                    onClick={() => handleVote(-1)}
                    disabled={isPending || !isLoggedIn}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                        color: userVote === -1 ? '#dc2626' : '#9ca3af',
                        fontWeight: userVote === -1 ? 'bold' : 'normal',
                    }}
                    title="Academic Probation (-1)"
                >
                    ▼
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>
            To: {excuse.recipient}
          </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            By: {authorName}
          </span>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#4b5563', fontStyle: 'italic' }}>
                    <strong>Messy Situation:</strong> "{excuse.situation}"
                </p>

                {/* Diplomatic Email Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                        Subject: {excuse.subject}
                    </div>
                    <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155' }}>
                        {excuse.diplomatic_email}
                    </div>
                </div>

                {/* Unfiltered Reality Box */}
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b' }}>Unfiltered Reality: </span>
                    <span style={{ fontSize: '13px', color: '#7f1d1d' }}>{excuse.unfiltered_reality}</span>
                </div>
            </div>
        </article>
    );
}