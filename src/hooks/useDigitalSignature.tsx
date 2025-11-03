import { useToast } from "@/hooks/use-toast";

// NOTA: Este hook está temporalmente deshabilitado hasta que se creen las tablas
// signature_envelopes y document_signatures en la base de datos.
// Ver ESTADO_ACTUAL_SISTEMA.md para más detalles.

export interface SignatureEnvelope {
  id: string;
  user_id: string;
  tenant_id?: string;
  document_version_id?: string;
  generated_act_id?: string;
  status: 'draft' | 'sent' | 'pending' | 'completed' | 'declined' | 'expired';
  signers: any[];
  expires_at?: string;
  message?: string;
  require_all_signatures: boolean;
  sent_at?: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DocumentSignature {
  id: string;
  envelope_id: string;
  signer_email: string;
  signer_name: string;
  signer_role?: string;
  status: 'pending' | 'signed' | 'declined';
  signed_at?: string;
  declined_at?: string;
  signature_data?: string;
  ip_address?: string;
  user_agent?: string;
  access_token?: string;
  token_expires_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function useDigitalSignature() {
  const { toast } = useToast();

  // Funcionalidad temporalmente deshabilitada - retornar valores mock
  return {
    envelopes: [],
    loadingEnvelopes: false,
    getEnvelopeSignatures: async (envelopeId: string) => [],
    createEnvelope: async (envelope: Partial<SignatureEnvelope>) => {
      toast({
        title: "Funcionalidad no disponible",
        description: "La firma digital está temporalmente deshabilitada",
        variant: "destructive",
      });
      throw new Error("Signature tables not yet created");
    },
    sendEnvelope: async ({ envelopeId, signers }: { envelopeId: string; signers: any[] }) => {
      toast({
        title: "Funcionalidad no disponible",
        description: "La firma digital está temporalmente deshabilitada",
        variant: "destructive",
      });
      throw new Error("Signature tables not yet created");
    },
    signDocument: async ({ signatureId, signatureData }: { signatureId: string; signatureData: string }) => {
      toast({
        title: "Funcionalidad no disponible",
        description: "La firma digital está temporalmente deshabilitada",
        variant: "destructive",
      });
      throw new Error("Signature tables not yet created");
    },
  };
}