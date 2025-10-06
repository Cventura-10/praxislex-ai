import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LawFirmProfile {
  id: string;
  nombre_firma: string;
  rnc: string | null;
  abogado_principal: string | null;
  matricula_card: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  provincia: string | null;
  eslogan: string | null;
  sitio_web: string | null;
  logo_url: string | null;
}

export function useLawFirmProfile() {
  const [profile, setProfile] = useState<LawFirmProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
          .from("law_firm_profile")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching law firm profile:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, hasProfile: !!profile };
}
