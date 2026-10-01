'use client';

import { createClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function AuthButton({ user }: { user: User | null }) {
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    if (user) {
        return (
            <button
                onClick={handleLogout}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
            >
                Sign Out
            </button>
        );
    }

    return (
        <button
            onClick={handleLogin}
            style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#fff', cursor: 'pointer' }}
        >
            Sign in with Google
        </button>
    );
}