import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();

  const { data: envelopes = [], isLoading: loadingEnvelopes } = useQuery({
    queryKey: ["signature_envelopes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("signature_envelopes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SignatureEnvelope[];
    },
  });

  const getEnvelopeSignatures = async (envelopeId: string) => {
    const { data, error } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("envelope_id", envelopeId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as DocumentSignature[];
  };

  const createEnvelopeMutation = useMutation({
    mutationFn: async (envelope: Partial<SignatureEnvelope>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("signature_envelopes")
        .insert({
          ...envelope,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature_envelopes"] });
      toast({
        title: "Sobre de firma creado",
        description: "El sobre de firma ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendEnvelopeMutation = useMutation({
    mutationFn: async ({ envelopeId, signers }: { envelopeId: string; signers: any[] }) => {
      const { error: envError } = await supabase
        .from("signature_envelopes")
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          signers,
        })
        .eq("id", envelopeId);

      if (envError) throw envError;

      const signatures = signers.map((signer) => ({
        envelope_id: envelopeId,
        signer_email: signer.email,
        signer_name: signer.name,
        signer_role: signer.role,
        access_token: crypto.randomUUID(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: sigError } = await supabase
        .from("document_signatures")
        .insert(signatures);

      if (sigError) throw sigError;

      return { envelopeId, signatures };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature_envelopes"] });
      toast({
        title: "Sobre enviado",
        description: "Los firmantes recibirán un email para firmar el documento",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signDocumentMutation = useMutation({
    mutationFn: async ({ signatureId, signatureData }: { signatureId: string; signatureData: string }) => {
      const { error } = await supabase
        .from("document_signatures")
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
        })
        .eq("id", signatureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signature_envelopes"] });
      toast({
        title: "Documento firmado",
        description: "Tu firma ha sido registrada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al firmar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    envelopes,
    loadingEnvelopes,
    getEnvelopeSignatures,
    createEnvelope: createEnvelopeMutation.mutateAsync,
    sendEnvelope: sendEnvelopeMutation.mutateAsync,
    signDocument: signDocumentMutation.mutateAsync,
  };
}