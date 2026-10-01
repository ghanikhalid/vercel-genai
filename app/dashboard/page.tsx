import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';

export const revalidate = 0;

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    return (
        <main style={{ maxWidth: '640px', margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
            <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>
                &larr; Back to Home
            </Link>
            <div style={{ marginTop: '24px', padding: '24px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px' }}>
                <h1 style={{ fontSize: '22px', color: '#065f46', margin: '0 0 8px 0' }}>Protected Route Accessible</h1>
                <p style={{ margin: 0, color: '#047857' }}>
                    This route is guarded by server-side authentication. Only logged-in users can view this content.
                </p>
            </div>
        </main>
    );
}