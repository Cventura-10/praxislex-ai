import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  type: 'deadline' | 'hearing' | 'document' | 'payment';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const getDaysLeft = (date: string) => {
    const today = new Date();
    const deadline = new Date(date);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newNotifications: Notification[] = [];

      // Fetch upcoming deadlines (next 7 days)
      const { data: deadlinesData } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .eq("completado", false)
        .order("fecha_vencimiento", { ascending: true });

      deadlinesData?.forEach((deadline) => {
        const daysLeft = getDaysLeft(deadline.fecha_vencimiento);
        if (daysLeft >= 0 && daysLeft <= 7) {
          newNotifications.push({
            id: `deadline-${deadline.id}`,
            type: 'deadline',
            title: daysLeft === 0 ? 'Vencimiento HOY' : daysLeft === 1 ? 'Vencimiento mañana' : `Vencimiento en ${daysLeft} días`,
            message: `${deadline.tipo}: ${deadline.caso}`,
            timestamp: new Date(deadline.created_at),
            priority: daysLeft <= 2 ? 'high' : daysLeft <= 5 ? 'medium' : 'low',
            read: false,
          });
        }
      });

      // Fetch upcoming hearings (next 7 days)
      const { data: hearingsData } = await supabase
        .from("hearings")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", new Date().toISOString().split('T')[0])
        .order("fecha", { ascending: true });

      hearingsData?.forEach((hearing) => {
        const hearingDate = new Date(hearing.fecha);
        const today = new Date();
        const daysUntil = Math.ceil((hearingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= 7) {
          newNotifications.push({
            id: `hearing-${hearing.id}`,
            type: 'hearing',
            title: daysUntil === 0 ? 'Audiencia HOY' : daysUntil === 1 ? 'Audiencia mañana' : `Audiencia en ${daysUntil} días`,
            message: `${hearing.juzgado} - ${hearing.hora}`,
            timestamp: new Date(hearing.created_at),
            priority: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
            read: false,
          });
        }
      });

      // Sort notifications by priority and timestamp
      newNotifications.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.priority === 'medium' && b.priority === 'low') return -1;
        if (a.priority === 'low' && b.priority === 'medium') return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for deadlines and hearings
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deadlines'
        },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hearings'
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    refetch: fetchNotifications,
  };
}