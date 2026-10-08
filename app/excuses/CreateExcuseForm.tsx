'use client';

import { useRef, useTransition, useState } from 'react';
import { generateExcuseAction } from '@/app/actions';

export default function CreateExcuseForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg('');

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await generateExcuseAction(formData);
            if (!result.success) {
                setErrorMsg(result.error || 'Generation failed.');
            } else {
                formRef.current?.reset();
            }
        });
    };

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '28px',
            }}
        >
            <h2 style={{ fontSize: '16px', margin: 0, color: '#0f172a' }}>
                Ghostwrite a College Excuse / Diplomatic Email
            </h2>

            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                    Who are you writing to?
                </label>
                <select
                    name="recipient"
                    defaultValue="Professor"
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        backgroundColor: '#ffffff',
                    }}
                >
                    <option value="Professor">Professor</option>
                    <option value="Graduate TA">Graduate TA</option>
                    <option value="Academic Advisor">Academic Advisor</option>
                    <option value="Dorm Resident Advisor (RA)">Dorm RA</option>
                    <option value="Campus Job Supervisor">Campus Job Supervisor</option>
                    <option value="Flaky Group Project Partner">Flaky Group Partner</option>
                </select>
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                    The Unfiltered Situation (What actually happened?)
                </label>
                <textarea
                    name="situation"
                    required
                    rows={3}
                    placeholder="e.g. My alarm didn't ring and I slept through the 8:40 AM midterm recitation..."
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                style={{
                    alignSelf: 'flex-start',
                    padding: '10px 18px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                }}
            >
                {isPending ? 'Ghostwriting Email...' : 'Generate Diplomatic Email'}
            </button>

            {errorMsg && (
                <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                    {errorMsg}
                </p>
            )}
        </form>
    );
}