import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ActParty {
  id: string;
  expediente_id: string | null;
  acto_slug: string | null;
  persona_id: string | null;
  professional_id: string | null;
  side: 'actor' | 'demandado' | 'tercero';
  rol: string;
  snapshot: Record<string, any>;
  created_at: string;
  user_id: string;
}

export function useActParties(expedienteId?: string, actoSlug?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["act_parties", expedienteId, actoSlug],
    queryFn: async () => {
      let query = supabase
        .from("act_parties")
        .select("*")
        .order("created_at", { ascending: true });

      if (expedienteId) {
        query = query.eq("expediente_id", expedienteId);
      }
      if (actoSlug) {
        query = query.eq("acto_slug", actoSlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActParty[];
    },
    enabled: !!(expedienteId || actoSlug),
  });

  const addPartyMutation = useMutation({
    mutationFn: async (party: Omit<ActParty, "id" | "created_at" | "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("act_parties")
        .insert({
          ...party,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["act_parties"] });
      toast({
        title: "Parte agregada",
        description: "La parte se agregó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar parte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removePartyMutation = useMutation({
    mutationFn: async (partyId: string) => {
      const { error } = await supabase
        .from("act_parties")
        .delete()
        .eq("id", partyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["act_parties"] });
      toast({
        title: "Parte eliminada",
        description: "La parte se eliminó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar parte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    parties,
    isLoading,
    addParty: addPartyMutation.mutate,
    removeParty: removePartyMutation.mutate,
  };
}
