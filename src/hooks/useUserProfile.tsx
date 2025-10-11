import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "abogado" | "asistente" | "cliente";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  law_firm_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          setError(error.message);
        } else if (data) {
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error("Error in fetchProfile:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('user_profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (err) {
      console.error("Error updating profile:", err);
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    isAdmin: profile?.role === "admin",
    isAbogado: profile?.role === "abogado",
    isAsistente: profile?.role === "asistente",
    isCliente: profile?.role === "cliente",
    isStaff: profile?.role === "admin" || profile?.role === "abogado" || profile?.role === "asistente"
  };
}