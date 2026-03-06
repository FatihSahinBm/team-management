import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, token } = body;

        if (!userId || !token) {
            return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) { return cookieStore.get(name)?.value; },
                },
            }
        );

        // This requires the fcm_tokens table to exist:
        // create table fcm_tokens (id serial primary key, user_id uuid references auth.users not null, token text not null, created_at timestamp with time zone default timezone('utc'::text, now()) not null, unique(user_id, token));
        
        // Upsert the token to avoid duplicates for the same user/token combination
        const { error } = await supabase
            .from('fcm_tokens')
            .upsert(
                { user_id: userId, token: token },
                { onConflict: 'user_id,token' }
            );

        if (error) {
            console.error("Token upsert error:", error);
            // It might fail if table does not exist. That's fine, we'll ask user to create it.
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Token kaydedildi" });

    } catch (error) {
        console.error("Save Token API Error:", error);
        return NextResponse.json({ error: "Token kaydedilemedi: " + error.message }, { status: 500 });
    }
}
