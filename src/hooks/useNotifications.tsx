import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "reminder";
  priority: "low" | "medium" | "high" | "urgent";
  category: "hearing" | "deadline" | "payment" | "case" | "client" | "system";
  related_id?: string;
  related_table?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  created_at: string;
  expires_at?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Cargar notificaciones iniciales
  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("[useNotifications] No user authenticated, skipping notifications load");
        setIsLoading(false);
        return;
      }

      console.log("[useNotifications] Loading notifications for user:", user.id);
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[useNotifications] Supabase error:", error);
        // Don't throw, just log and continue with empty notifications
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      console.log("[useNotifications] Loaded", data?.length || 0, "notifications");
      const typedData = (data || []) as Notification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.is_read).length);
    } catch (error: any) {
      console.error("[useNotifications] Unexpected error:", error);
      // Graceful degradation - don't crash the app
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    let notificationsChannel: RealtimeChannel | null = null;

    const setupNotifications = async () => {
      try {
        await loadNotifications();

        notificationsChannel = supabase
          .channel("notifications-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
            },
            (payload) => {
              console.log("[useNotifications] New notification received:", payload);
              const newNotification = payload.new as Notification;

              setNotifications((prev) => [newNotification, ...prev]);
              setUnreadCount((prev) => prev + 1);

              // Mostrar toast para notificaciones de alta prioridad
              if (newNotification.priority === "high" || newNotification.priority === "urgent") {
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                  duration: 5000,
                });
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
            },
            (payload) => {
              const updated = payload.new as Notification;
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
              );
              
              // Actualizar contador si cambió el estado de leído
              if (updated.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          )
          .subscribe();

        setChannel(notificationsChannel);
      } catch (error) {
        console.error("[useNotifications] Error setting up notifications:", error);
      }
    };

    setupNotifications();

    return () => {
      if (notificationsChannel) {
        notificationsChannel.unsubscribe();
      }
    };
  }, []);

  // Marcar notificación como leída
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.rpc("mark_notification_read", {
        p_notification_id: id,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const { data, error } = await supabase.rpc("mark_all_notifications_read");

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: "Listo",
        description: `${data} notificaciones marcadas como leídas`,
      });
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las notificaciones",
        variant: "destructive",
      });
    }
  };

  // Eliminar notificación
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      });
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications,
  };
}