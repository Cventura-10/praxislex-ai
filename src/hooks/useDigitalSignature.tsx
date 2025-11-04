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

  // Fetch signature envelopes
  const { data: envelopes = [], isLoading: loadingEnvelopes } = useQuery({
    queryKey: ['signature-envelopes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signature_envelopes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SignatureEnvelope[];
    },
  });

  // Get signatures for an envelope
  const getEnvelopeSignatures = async (envelopeId: string): Promise<DocumentSignature[]> => {
    const { data, error } = await supabase
      .from('document_signatures')
      .select('*')
      .eq('envelope_id', envelopeId);
    
    if (error) throw error;
    return data as DocumentSignature[];
  };

  // Create envelope mutation
  const createEnvelope = async (envelope: Partial<SignatureEnvelope>) => {
    // Ensure user_id is always set
    const envelopeWithUser = {
      ...envelope,
      user_id: envelope.user_id || (await supabase.auth.getUser()).data.user?.id,
    };
    
    const { data, error } = await supabase
      .from('signature_envelopes')
      .insert([envelopeWithUser])
      .select()
      .single();
    
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['signature-envelopes'] });
    return data;
  };

  // Send envelope mutation
  const sendEnvelope = async ({ envelopeId, signers }: { envelopeId: string; signers: any[] }) => {
    // Create signature records for each signer
    const signatures = signers.map(signer => ({
      envelope_id: envelopeId,
      signer_email: signer.email,
      signer_name: signer.name,
      signer_role: signer.role,
      status: 'pending' as const,
    }));

    const { error: sigError } = await supabase
      .from('document_signatures')
      .insert(signatures);
    
    if (sigError) throw sigError;

    // Update envelope status
    const { error: envError } = await supabase
      .from('signature_envelopes')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', envelopeId);
    
    if (envError) throw envError;
    await queryClient.invalidateQueries({ queryKey: ['signature-envelopes'] });
    
    toast({
      title: "Enviado para firma",
      description: "Los firmantes recibirán un correo electrónico",
    });
  };

  // Sign document mutation
  const signDocument = async ({ signatureId, signatureData }: { signatureId: string; signatureData: string }) => {
    const { error } = await supabase
      .from('document_signatures')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_data: signatureData,
      })
      .eq('id', signatureId);
    
    if (error) throw error;
    
    toast({
      title: "Documento firmado",
      description: "Su firma ha sido registrada",
    });
  };

  return {
    envelopes,
    loadingEnvelopes,
    getEnvelopeSignatures,
    createEnvelope,
    sendEnvelope,
    signDocument,
  };
}