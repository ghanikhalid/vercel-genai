'use server';

import { createClient } from '@/lib/supabaseServer';
import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateExcuseAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'You must be signed in to generate an excuse.' };
        }

        const situation = formData.get('situation') as string;
        const recipient = (formData.get('recipient') as string) || 'Professor';

        if (!situation || situation.trim().length === 0) {
            return { success: false, error: 'Please describe your situation.' };
        }

        if (!process.env.GEMINI_API_KEY) {
            return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' };
        }

        const promptText = `You are an elite college communications ghostwriter. 
A student is in this real-life messy situation: "${situation}".
The email is meant for: "${recipient}".

Respond strictly with valid JSON with these exact keys:
{
  "subject": "Clear, professional, polite email subject line",
  "diplomatic_email": "A polished, courteous, completely professional email asking for grace, extension, or understanding without oversharing.",
  "unfiltered_reality": "A hilarious, 2-sentence painfully honest translation of what the student is actually thinking/dealing with."
}`;

        const candidateModels = [
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
        ];

        let response: any = null;
        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                response = await ai.models.generateContent({
                    model,
                    contents: promptText,
                    config: {
                        responseMimeType: 'application/json',
                    },
                });
                if (response?.text) {
                    break;
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`Model ${model} failed (${err?.message || err}). Trying next candidate...`);
            }
        }

        if (!response || !response.text) {
            return {
                success: false,
                error: lastError?.message || 'All candidate models are temporarily unavailable. Please try again shortly.',
            };
        }

        let rawText = response.text || '{}';
        // Strip markdown code fences if wrapped in ```json ... ```
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        let parsed: { subject?: string; diplomatic_email?: string; unfiltered_reality?: string } = {};
        try {
            parsed = JSON.parse(rawText);
        } catch {
            return { success: false, error: 'Failed to parse AI output into valid JSON. Please retry.' };
        }

        // Insert generation into Supabase table
        const { error: insertError } = await supabase.from('email_excuses').insert({
            user_id: user.id,
            situation: situation.trim(),
            recipient: recipient.trim(),
            subject: parsed.subject || 'Inquiry Regarding Course Assignment',
            diplomatic_email: parsed.diplomatic_email || 'Dear Professor, I am writing to request a brief extension...',
            unfiltered_reality: parsed.unfiltered_reality || 'I fell asleep at my desk and completely panicked.',
        });

        if (insertError) {
            return { success: false, error: `Database error: ${insertError.message}` };
        }

        revalidatePath('/excuses');
        return { success: true };
    } catch (err: any) {
        console.error('Server action generation error:', err);
        return { success: false, error: err?.message || 'An unexpected error occurred during generation.' };
    }
}

export async function castVoteAction(excuseId: string, voteValue: number): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'You must be signed in to vote.' };
        }

        const { error } = await supabase.from('excuse_votes').upsert(
            {
                excuse_id: excuseId,
                user_id: user.id,
                vote_value: voteValue,
            },
            { onConflict: 'excuse_id,user_id' }
        );

        if (error) {
            return { success: false, error: `Vote failed: ${error.message}` };
        }

        revalidatePath('/excuses');
        return { success: true };
    } catch (err: any) {
        console.error('Server action vote error:', err);
        return { success: false, error: err?.message || 'Failed to submit vote.' };
    }
}