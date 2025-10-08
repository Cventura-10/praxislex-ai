import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "free" | "pro" | "admin";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("free"); // Default to free if error
        } else {
          setRole(data.role as UserRole);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setRole("free");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, loading, isPro: role === "pro", isAdmin: role === "admin", isFree: role === "free" };
}
