import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, assigneeEmail, title: originalTitle, status } = body;

        if (!eventId || !assigneeEmail || !status) {
            return NextResponse.json({ error: "Eksik parametreler (eventId, assigneeEmail veya status)" }, { status: 400 });
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

        // Retrieve the existing event to ensure we don't overwrite attendees/times
        const { data: existingEvent } = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });

        let newSummary = existingEvent.summary;
        let colorId = null;

        if (status === 'completed') {
            // Check if it already has "[Tamamlandı]"
            if (!newSummary.includes("[Tamamlandı]")) {
                // Prepend or replace "Görev:"
                newSummary = `[Tamamlandı] ${newSummary.replace(/^Görev:\s*/, '')}`;
            }
            colorId = '8'; // Graphite (Grey) color in Google Calendar
        } else {
            // Revert back to the normal state
            newSummary = `Görev: ${originalTitle}`;
            colorId = null; // Default color
        }

        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            sendUpdates: 'none', // Don't spam emails for status changing
            requestBody: {
                summary: newSummary,
                colorId: colorId
            }
        });

        return NextResponse.json({ success: true, message: "Takvim etkinliği güncellendi." });

    } catch (error) {
        console.error("Calendar Update Error:", error);
        return NextResponse.json({ error: "Takvim etkinliği güncellenemedi: " + error.message }, { status: 500 });
    }
}
