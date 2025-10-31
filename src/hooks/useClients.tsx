import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  nombre_completo: string;
  cedula_rnc_masked?: string | null;
  email_masked?: string | null;
  telefono_masked?: string | null;
  direccion_masked?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientFullData {
  id: string;
  nombre_completo: string;
  cedula_rnc: string;
  email: string;
  telefono: string;
  direccion: string;
  nacionalidad?: string;
  estado_civil?: string;
  profesion?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  pasaporte?: string;
  ocupacion?: string;
  empresa_empleador?: string;
  matricula_card?: string;
  matricula_profesional?: string;
  tipo_persona?: string;
  razon_social?: string;
  representante_legal?: string;
  cargo_representante?: string;
  // v1.4.4 - Campos de domicilio geo RD
  provincia_id?: string;
  municipio_id?: string;
  ciudad_id?: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_clients_masked', {
        p_user_id: user.id
      });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error al cargar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientById = async (clientId: string): Promise<ClientFullData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase.rpc('reveal_client_pii', {
        p_client_id: clientId
      });

      if (error) throw error;
      
      // La función retorna un array, tomamos el primer elemento
      const result: any = Array.isArray(data) ? data[0] : data;
      if (!result) return null;
      
      return {
        id: result.client_id || clientId,
        nombre_completo: result.nombre_completo || '',
        cedula_rnc: result.cedula_rnc || '',
        email: result.email || '',
        telefono: result.telefono || '',
        direccion: result.direccion || '',
        nacionalidad: result.nacionalidad || '',
        estado_civil: result.estado_civil || '',
        profesion: result.profesion || '',
        fecha_nacimiento: result.fecha_nacimiento || '',
        lugar_nacimiento: result.lugar_nacimiento || '',
        pasaporte: result.pasaporte || '',
        ocupacion: result.ocupacion || '',
        empresa_empleador: result.empresa_empleador || '',
        matricula_card: result.matricula_card || '',
        matricula_profesional: result.matricula_profesional || '',
        tipo_persona: result.tipo_persona || 'fisica',
        razon_social: result.razon_social || '',
        representante_legal: result.representante_legal || '',
        cargo_representante: result.cargo_representante || '',
        // v1.4.4 - Domicilio geo RD
        provincia_id: result.provincia_id || '',
        municipio_id: result.municipio_id || '',
        ciudad_id: result.ciudad_id || '',
      };
    } catch (error: any) {
      console.error("Error getting client data:", error);
      toast({
        title: "Error al obtener datos del cliente",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const searchClientByCedula = async (cedula: string): Promise<ClientFullData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // First find client by encrypted cedula match
      const { data: clientList, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id);

      if (searchError) throw searchError;

      // Try to find matching client by revealing PII
      for (const client of clientList || []) {
        const fullData = await getClientById(client.id);
        if (fullData && fullData.cedula_rnc === cedula) {
          return fullData;
        }
      }

      return null;
    } catch (error: any) {
      console.error("Error searching client:", error);
      return null;
    }
  };

  return {
    clients,
    loading,
    fetchClients,
    getClientById,
    searchClientByCedula
  };
}
