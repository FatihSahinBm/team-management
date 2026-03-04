import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, assigneeEmail } = body;

        if (!eventId || !assigneeEmail) {
            return NextResponse.json({ error: "Eksik parametreler (eventId veya assigneeEmail)" }, { status: 400 });
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

        // Fetch the assignee's tokens from the database
        const { data: assigneeTokens, error: tokenError } = await supabase
            .from('user_tokens')
            .select('provider_token, provider_refresh_token')
            .eq('email', assigneeEmail)
            .single();

        if (tokenError || !assigneeTokens || !assigneeTokens.provider_token) {
            return NextResponse.json({ 
                error: `Takvim Hatası: ${assigneeEmail} kullanıcısının erişim izni bulunamadı.` 
            }, { status: 403 });
        }

        // Initialize Google Calendar API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ 
            access_token: assigneeTokens.provider_token,
            refresh_token: assigneeTokens.provider_refresh_token
        });
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
            sendUpdates: 'all', // Yalnızca etkinlik iptal edildiğinde katılımcılara e-posta gönderir
        });

        return NextResponse.json({ success: true, message: "Takvim etkinliği silindi." });

    } catch (error) {
        console.error("Calendar Delete Error:", error);
        return NextResponse.json({ error: "Takvim etkinliği silinemedi: " + error.message }, { status: 500 });
    }
}
