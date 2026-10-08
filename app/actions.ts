'use server';

import { createClient } from '@/lib/supabaseServer';
import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateExcuseAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('You must be signed in to generate an excuse.');
    }

    const situation = formData.get('situation') as string;
    const recipient = (formData.get('recipient') as string) || 'Professor';

    if (!situation || situation.trim().length === 0) {
        throw new Error('Please describe your situation.');
    }

    // Generate structured output using Gemini
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an elite college communications ghostwriter. 
A student is in this real-life messy situation: "${situation}".
The email is meant for: "${recipient}".

Respond strictly with valid JSON with these exact keys:
{
  "subject": "Clear, professional, polite email subject line",
  "diplomatic_email": "A polished, courteous, completely professional email asking for grace, extension, or understanding without oversharing.",
  "unfiltered_reality": "A hilarious, 2-sentence painfully honest translation of what the student is actually thinking/dealing with."
}`,
        config: {
            responseMimeType: 'application/json',
        },
    });

    const parsed = JSON.parse(response.text || '{}');

    const { error } = await supabase.from('email_excuses').insert({
        user_id: user.id,
        situation: situation.trim(),
        recipient: recipient.trim(),
        subject: parsed.subject || 'Inquiry Regarding Course Assignment',
        diplomatic_email: parsed.diplomatic_email || 'Dear Professor, I am writing to request a brief extension...',
        unfiltered_reality: parsed.unfiltered_reality || 'I fell asleep at my desk and completely panicked.',
    });

    if (error) {
        throw new Error(`Failed to save excuse: ${error.message}`);
    }

    revalidatePath('/excuses');
}

export async function castVoteAction(excuseId: string, voteValue: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('You must be signed in to vote.');
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
        throw new Error(`Failed to record vote: ${error.message}`);
    }

    revalidatePath('/excuses');
}