"use client";

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useTeamStore } from '@/store/useTeamStore';

export const useNotification = () => {
    const user = useTeamStore((state) => state.user);

    useEffect(() => {
        const setupNotifications = async () => {
            if (!user) return;
            
            // Try to get the FCM token
            const token = await requestForToken();
            if (token) {
                console.log('FCM Token received:', token);
                // Save it to database
                await fetch('/api/notifications/save-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        token: token
                    })
                });
            }
        };

        setupNotifications();

        // Listen for foreground and background messages if supported
        onMessageListener().then((payload) => {
            console.log('Received foreground message:', payload);
            // Example: show a toast or a custom browser notification
            if (payload.notification) {
                const { title, body } = payload.notification;
                new Notification(title, { body });
            }
        }).catch((err) => console.log('Message listener failed or ignored: ', err));

    }, [user]);
};
