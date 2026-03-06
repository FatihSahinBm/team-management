import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { createClient } from '@supabase/supabase-js';

// Requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be placed in .env
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
    try {
        // Find tasks due in roughly 2 days and are not completed
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + 2);
        
        const targetDateString = targetDate.toISOString().split('T')[0];

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*, teams(name)')
            .eq('due_date', targetDateString)
            .neq('status', 'completed');

        if (tasksError) throw tasksError;
        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ message: "No tasks due in 2 days" });
        }

        // Group by user
        let messageCount = 0;
        for (const task of tasks) {
            const { data: userTokens } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', task.user_id);

            if (userTokens && userTokens.length > 0) {
                const tokens = userTokens.map(t => t.token);
                await admin.messaging().sendEachForMulticast({
                    tokens: tokens,
                    notification: {
                        title: "Yaklaşan Görev Hatırlatması",
                        body: `"${task.title}" adlı görevinizin bitimine son 2 gün kaldı! Takım: ${task.teams?.name || 'Belirtilmedi'}`,
                    }
                });
                messageCount++;
            }
        }

        return NextResponse.json({ success: true, processedTasks: tasks.length, messagesSent: messageCount });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Cron job failed: " + error.message }, { status: 500 });
    }
}
