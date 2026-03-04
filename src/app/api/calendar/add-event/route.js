import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, dueDate, assigneeEmail, providerToken } = body;

        fs.appendFileSync('calendar_debug.log', `[${new Date().toISOString()}] Request target: ${assigneeEmail}, providerToken length: ${providerToken?.length || 0}\n`);

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
            fs.appendFileSync('calendar_debug.log', `[${new Date().toISOString()}] Token Error for ${assigneeEmail}: ${tokenError?.message || 'Token not found'}\n`);
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

        // Format dates for Google Calendar
        const startDate = new Date(dueDate);
        startDate.setHours(9, 0, 0); // Default to 09:00 AM on the due date
        
        const endDate = new Date(startDate);
        endDate.setHours(10, 0, 0); // 1 hour duration

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
            sendUpdates: 'none', // E-posta gönderme (Sessizce ekle)
        });

        fs.appendFileSync('calendar_debug.log', `[${new Date().toISOString()}] Success! Event ID: ${response.data.id}\n`);
        return NextResponse.json({ success: true, eventId: response.data.id });

    } catch (error) {
        console.error("Calendar API Error:", error);
        fs.appendFileSync('calendar_debug.log', `[${new Date().toISOString()}] ERROR: ${error.message}\nStack: ${error.stack}\n`);
        return NextResponse.json({ error: "Takvim etkinliği oluşturulamadı: " + error.message }, { status: 500 });
    }
}
