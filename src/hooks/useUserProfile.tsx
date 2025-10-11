import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        setProfile(data as UserProfile);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const subscription = supabase
      .channel(`user_profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>) => {
    if (!user) return { success: false, error: "No user authenticated" };

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  return { 
    profile, 
    loading, 
    error, 
    updateProfile,
    isPro: profile?.role === "abogado" || profile?.role === "admin", 
    isAdmin: profile?.role === "admin", 
    isClient: profile?.role === "cliente" 
  };
}
