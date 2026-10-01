import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import AuthButton from './components/AuthButton';

export const revalidate = 0;

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        profile = data;
    }

    const needsNameCompletion = user && (!profile?.first_name || !profile?.last_name);

    return (
        <main style={{ maxWidth: '640px', margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Assignment 3 App</h1>
                <AuthButton user={user} />
            </header>

            {user ? (
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {needsNameCompletion && (
                        <div style={{ padding: '16px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#92400e' }}>
                                Profile Incomplete!
                            </p>
                            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#78350f' }}>
                                Please set your first and last name to complete your registration.
                            </p>
                            <Link
                                href="/profile"
                                style={{ display: 'inline-block', padding: '8px 14px', backgroundColor: '#d97706', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}
                            >
                                Complete Profile
                            </Link>
                        </div>
                    )}

                    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Welcome back!</h2>
                        <p style={{ margin: '4px 0', color: '#4b5563' }}>
                            <strong>User ID:</strong> {user.id}
                        </p>
                        <p style={{ margin: '4px 0', color: '#4b5563' }}>
                            <strong>Name:</strong> {profile?.first_name || '—'} {profile?.last_name || '—'}
                        </p>
                    </div>

                    <nav style={{ display: 'flex', gap: '12px' }}>
                        <Link
                            href="/profile"
                            style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '6px', textDecoration: 'none' }}
                        >
                            Go to Profile Settings
                        </Link>
                        <Link
                            href="/dashboard"
                            style={{ padding: '10px 16px', backgroundColor: '#10b981', color: '#ffffff', borderRadius: '6px', textDecoration: 'none' }}
                        >
                            View Protected Route
                        </Link>
                    </nav>
                </section>
            ) : (
                <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: '8px' }}>
                    <p style={{ color: '#4b5563', marginBottom: '16px' }}>Sign in to access your profile and protected features.</p>
                </div>
            )}
        </main>
    );
}