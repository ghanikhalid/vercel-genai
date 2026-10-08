import { createClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import ExcuseCard from './ExcuseCard';
import CreateExcuseForm from './CreateExcuseForm';

export const revalidate = 0;

export default async function ExcusesFeedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Query excuses with author profiles and votes
    const { data: excuses } = await supabase
        .from('email_excuses')
        .select(`
      id,
      situation,
      recipient,
      subject,
      diplomatic_email,
      unfiltered_reality,
      created_at,
      profiles:user_id (first_name, last_name, avatar_url),
      excuse_votes (user_id, vote_value)
    `)
        .order('created_at', { ascending: false });

    return (
        <main style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', margin: 0, color: '#0f172a' }}>Syllabus Diplomat</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                        Turn chaotic college disasters into polished professional emails. Vote on the most plausible excuses!
                    </p>
                </div>
                <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>
                    &larr; Home
                </Link>
            </header>

            {user ? (
                <CreateExcuseForm />
            ) : (
                <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                        <Link href="/" style={{ color: '#2563eb', fontWeight: 'bold' }}>Sign in with Google</Link> to generate diplomatic excuses and rate submissions!
                    </p>
                </div>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Community Submissions & Rankings</h2>

                {(!excuses || excuses.length === 0) && (
                    <p style={{ color: '#94a3b8' }}>No excuses posted yet. Generate the first one above!</p>
                )}

                {excuses?.map((item: any) => {
                    const upvotes = item.excuse_votes.filter((v: any) => v.vote_value === 1).length;
                    const downvotes = item.excuse_votes.filter((v: any) => v.vote_value === -1).length;
                    const netScore = upvotes - downvotes;
                    const userVote = user ? item.excuse_votes.find((v: any) => v.user_id === user.id)?.vote_value : null;

                    return (
                        <ExcuseCard
                            key={item.id}
                            excuse={item}
                            score={netScore}
                            userVote={userVote}
                            isLoggedIn={!!user}
                        />
                    );
                })}
            </section>
        </main>
    );
}