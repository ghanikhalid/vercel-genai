'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseBrowser';

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUserId(user.id);

            const { data } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setAvatarUrl(data.avatar_url || null);
            }
            setLoading(false);
        }
        loadProfile();
    }, [router, supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setSaving(true);
        setStatusMessage('');

        let uploadedAvatarUrl = avatarUrl;

        // 1. Upload photo if selected
        if (file) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                setStatusMessage(`Avatar upload error: ${uploadError.message}`);
                setSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            uploadedAvatarUrl = publicUrl;
            setAvatarUrl(publicUrl);
        }

        // 2. Update relational profile data
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                first_name: firstName,
                last_name: lastName,
                avatar_url: uploadedAvatarUrl,
                updated_at: new Date().toISOString(),
            });

        setSaving(false);
        if (updateError) {
            setStatusMessage(`Save failed: ${updateError.message}`);
        } else {
            setStatusMessage('Profile successfully updated!');
            router.refresh();
        }
    };

    if (loading) {
        return <p style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading profile...</p>;
    }

    return (
        <main style={{ maxWidth: '560px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
            <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>
                &larr; Back to Home
            </Link>
            <h1 style={{ fontSize: '24px', margin: '16px 0' }}>Edit Profile</h1>

            {avatarUrl && (
                <div style={{ marginBottom: '20px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={avatarUrl}
                        alt="User Avatar"
                        style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                    />
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>First Name</label>
                    <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>Last Name</label>
                    <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>Upload Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ fontSize: '14px' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '10px 16px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '8px' }}
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </form>

            {statusMessage && (
                <p style={{ marginTop: '16px', fontSize: '14px', color: statusMessage.includes('error') ? '#dc2626' : '#16a34a' }}>
                    {statusMessage}
                </p>
            )}
        </main>
    );
}