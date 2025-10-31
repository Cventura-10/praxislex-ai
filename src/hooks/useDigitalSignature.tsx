import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SignerRole =
  | "arrendador"
  | "arrendatario"
  | "fiador"
  | "abogado"
  | "notario"
  | "testigo"
  | "comprador"
  | "vendedor"
  | "poderdante"
  | "poderhabiente";

export type EnvelopeStatus =
  | "borrador"
  | "enviado"
  | "visto"
  | "firmado_parcial"
  | "firmado_total"
  | "rechazado"
  | "expirado";

export interface Signer {
  persona_id: string;
  rol_firma: SignerRole;
  orden: number;
  email?: string;
  whatsapp?: string;
  verificacion: {
    otp?: "sms" | "email" | "wa";
    kba?: boolean;
    adjunto_id?: string;
  };
  firma_completada?: boolean;
  firma_fecha?: string;
  firma_ip?: string;
}

export interface SignatureEnvelope {
  id?: string;
  acto_slug: string;
  documento_origen: string;
  documento_url?: string;
  firmantes: Signer[];
  placeholders_firmas: Array<{
    nombre: string;
    pagina: string | number;
    tipo: "firma" | "iniciales" | "sello";
    required: boolean;
  }>;
  politicas: {
    fidelidad_template: "STRICT";
    hash_pdf: string;
    timestamp?: string;
    pades?: string;
    audit_trail_embed: boolean;
  };
  estado: EnvelopeStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  audit_trail?: Array<{
    evento: string;
    timestamp: string;
    user_id?: string;
    ip?: string;
    detalles?: string;
  }>;
}

export function useDigitalSignature() {
  const queryClient = useQueryClient();

  const { data: envelopes, isLoading } = useQuery({
    queryKey: ["signature-envelopes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signature_envelopes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SignatureEnvelope[];
    },
  });

  const createEnvelope = useMutation({
    mutationFn: async (envelope: SignatureEnvelope) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("signature_envelopes")
        .insert({
          ...envelope,
          created_by: user?.id,
          estado: "borrador",
          audit_trail: [
            {
              evento: "envelope_created",
              timestamp: new Date().toISOString(),
              user_id: user?.id,
              detalles: "Sobre de firma creado",
            },
          ],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature-envelopes"] });
      toast.success("Sobre de firma creado");
    },
    onError: (error) => {
      toast.error("Error al crear sobre: " + error.message);
    },
  });

  const sendEnvelope = useMutation({
    mutationFn: async (envelopeId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current envelope to append to audit trail
      const { data: envelope } = await supabase
        .from("signature_envelopes")
        .select("*")
        .eq("id", envelopeId)
        .single();

      if (!envelope) throw new Error("Envelope not found");

      const updatedAuditTrail = [
        ...(envelope.audit_trail || []),
        {
          evento: "envelope_sent",
          timestamp: new Date().toISOString(),
          user_id: user?.id,
          detalles: "Sobre enviado a firmantes",
        },
      ];

      const { data, error } = await supabase
        .from("signature_envelopes")
        .update({
          estado: "enviado",
          audit_trail: updatedAuditTrail,
        })
        .eq("id", envelopeId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Send emails/WhatsApp to signers
      // This would be implemented via an edge function

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature-envelopes"] });
      toast.success("Sobre enviado a firmantes");
    },
    onError: (error) => {
      toast.error("Error al enviar sobre: " + error.message);
    },
  });

  const updateEnvelopeStatus = useMutation({
    mutationFn: async ({ id, status, auditEvent }: { 
      id: string; 
      status: EnvelopeStatus;
      auditEvent: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: envelope } = await supabase
        .from("signature_envelopes")
        .select("*")
        .eq("id", id)
        .single();

      if (!envelope) throw new Error("Envelope not found");

      const updatedAuditTrail = [
        ...(envelope.audit_trail || []),
        {
          evento: auditEvent,
          timestamp: new Date().toISOString(),
          user_id: user?.id,
          detalles: `Estado actualizado a ${status}`,
        },
      ];

      const { data, error } = await supabase
        .from("signature_envelopes")
        .update({
          estado: status,
          audit_trail: updatedAuditTrail,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature-envelopes"] });
    },
    onError: (error) => {
      toast.error("Error al actualizar estado: " + error.message);
    },
  });

  return {
    envelopes: envelopes || [],
    isLoading,
    createEnvelope,
    sendEnvelope,
    updateEnvelopeStatus,
  };
}

// Helper para generar hash SHA-256 de documento
export async function generateDocumentHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
