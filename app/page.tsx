import { supabase } from '../lib/supabaseClient';

// Ensure the page always fetches fresh data on every request (disables static caching)
export const revalidate = 0;

export default async function Home() {
    // Fetch data directly on the server
    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: true });

    return (
        <main
            style={{
                maxWidth: '680px',
                margin: '48px auto',
                padding: '0 20px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            <header style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    Interview Prep To-Do List
                </h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>
                    (May or may not be useful.)
                </p>
            </header>

            {error && (
                <div
                    style={{
                        padding: '14px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}
                >
                    <strong>Error loading items:</strong> {error.message}
                </div>
            )}

            {items && items.length === 0 && (
                <p style={{ color: '#9ca3af' }}>No records found in database.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items?.map((item) => (
                    <article
                        key={item.id}
                        style={{
                            padding: '18px 20px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <h2 style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: '#111827' }}>
                                {item.title}
                            </h2>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>#{item.id}</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                            {item.description}
                        </p>
                    </article>
                ))}
            </div>
        </main>
    );
}