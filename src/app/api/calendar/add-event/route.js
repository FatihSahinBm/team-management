import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, dueDate, assigneeEmail, providerToken } = body;
        console.log(`[Calendar API] Request target: ${assigneeEmail}, providerToken length: ${providerToken?.length || 0}`);

        if (!title || !dueDate || !assigneeEmail) {
            return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
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
            console.error(`[Calendar API] Token Error for ${assigneeEmail}:`, tokenError?.message || 'Token not found');
            return NextResponse.json({ 
                error: `Takvim Hatası: ${assigneeEmail} adlı kullanıcının Google Takvim erişim izni bulunamadı. Kullanıcının sistemden çıkış yapıp tekrar Google ile giriş yapması gerekiyor.` 
            }, { status: 403 });
        }

        // Initialize Google Calendar API with the assignee's tokens
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID, // You need to set these in .env.local if you want refresh tokens to work automatically
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        oauth2Client.setCredentials({ 
            access_token: assigneeTokens.provider_token,
            refresh_token: assigneeTokens.provider_refresh_token 
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Verify: whose calendar are we accessing?
        try {
            const calendarInfo = await calendar.calendars.get({ calendarId: 'primary' });
            console.log(`[Calendar API] Token owner calendar: ${calendarInfo.data.summary} (${calendarInfo.data.id})`);
        } catch (verifyErr) {
            console.error(`[Calendar API] Could not verify calendar owner:`, verifyErr.message);
        }

        // Format dates for Google Calendar
        const startDate = new Date(dueDate + 'T09:00:00+03:00'); // 09:00 Turkey time
        const endDate = new Date(dueDate + 'T10:00:00+03:00');   // 10:00 Turkey time

        console.log(`[Calendar API] Creating event: "${title}" on ${dueDate}, start: ${startDate.toISOString()}, end: ${endDate.toISOString()}`);

        // Create the event
        const event = {
            summary: `Görev: ${title}`,
            description: `Ekip Yönetim Sistemi üzerinden atanan görev.\n\nGörev başlığı: ${title}`,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'Europe/Istanbul',
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Europe/Istanbul',
            },
            attendees: [
                { email: assigneeEmail }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 60 },      // 1 hour before
                ],
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all',
        });

        console.log(`[Calendar API] Success! Event ID: ${response.data.id}, htmlLink: ${response.data.htmlLink}`);
        return NextResponse.json({ success: true, eventId: response.data.id });

    } catch (error) {
        console.error("Calendar API Error:", error, error.stack);
        return NextResponse.json({ error: "Takvim etkinliği oluşturulamadı: " + error.message }, { status: 500 });
    }
}
