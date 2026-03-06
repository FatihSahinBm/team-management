import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { assigneeId, title, message } = body;

        if (!assigneeId || !title || !message) {
            return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: { get(name) { return cookieStore.get(name)?.value; } },
            }
        );

        // Fetch user's FCM tokens
        const { data: userTokens, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', assigneeId);

        if (error || !userTokens || userTokens.length === 0) {
            // User might not have enabled notifications
            console.log(`Bypass Notification: ${assigneeId} no FCM token found.`);
            return NextResponse.json({ success: true, message: "Kullanıcının bildirim izni yok, işlem bypass edildi." });
        }

        // Send to all their devices
        const tokens = userTokens.map(t => t.token);
        
        const payload = {
            notification: {
                title: title,
                body: message,
            },
            data: {
                // You can add extra generic data logic if needed
                click_action: "FLUTTER_NOTIFICATION_CLICK", // common standard
            }
        };

        const response = await admin.messaging().sendEachForMulticast({
            tokens: tokens,
            notification: payload.notification,
            data: payload.data
        });

        console.log("FCM Notification responses:", response.successCount, "successes,", response.failureCount, "failures.");

        return NextResponse.json({ success: true, message: "Bildirim başarıyla gönderildi" });

    } catch (error) {
        console.error("FCM Send Error:", error);
        return NextResponse.json({ error: "Bildirim gönderilemedi: " + error.message }, { status: 500 });
    }
}
