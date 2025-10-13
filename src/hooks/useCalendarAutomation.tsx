import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useCalendarAutomation = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to hearing changes
    const hearingChannel = supabase
      .channel('hearing-reminders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hearings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          toast({
            title: "Nueva audiencia programada",
            description: `Se ha creado una audiencia para ${payload.new.caso}`,
          });
        }
      )
      .subscribe();

    // Subscribe to reminder notifications
    const reminderChannel = supabase
      .channel('reminder-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const reminder = payload.new;
            const remindAt = new Date(reminder.remind_at);
            const now = new Date();
            const timeDiff = remindAt.getTime() - now.getTime();

            // If reminder is within 24 hours, show notification
            if (timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000) {
              toast({
                title: "Recordatorio próximo",
                description: reminder.title,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      hearingChannel.unsubscribe();
      reminderChannel.unsubscribe();
    };
  }, [user, toast]);

  const createCalendarEvent = async (hearing: any) => {
    // Create ICS file for calendar import
    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${hearing.id}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${hearing.fecha.replace(/-/g, '')}T${hearing.hora.replace(/:/g, '')}00`,
      `SUMMARY:${hearing.caso}`,
      `DESCRIPTION:Audiencia en ${hearing.juzgado}`,
      `LOCATION:${hearing.ubicacion || hearing.juzgado}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([event], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audiencia-${hearing.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { createCalendarEvent };
};
