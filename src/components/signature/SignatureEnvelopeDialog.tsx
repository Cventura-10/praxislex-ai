import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDigitalSignature } from "@/hooks/useDigitalSignature";
import { Mail, User, X, Plus, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SignatureEnvelopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedActId: string;
  documentVersionId?: string;
}

interface Signer {
  email: string;
  name: string;
  role: string;
}

export function SignatureEnvelopeDialog({
  open,
  onOpenChange,
  generatedActId,
  documentVersionId,
}: SignatureEnvelopeDialogProps) {
  const { createEnvelope, sendEnvelope } = useDigitalSignature();
  const [signers, setSigners] = useState<Signer[]>([]);
  const [newSigner, setNewSigner] = useState<Signer>({ email: "", name: "", role: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSigner = () => {
    if (newSigner.email && newSigner.name) {
      setSigners([...signers, newSigner]);
      setNewSigner({ email: "", name: "", role: "" });
    }
  };

  const handleRemoveSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleSendForSignature = async () => {
    if (signers.length === 0) return;

    setLoading(true);
    try {
      const envelope = await createEnvelope({
        generated_act_id: generatedActId,
        document_version_id: documentVersionId,
        message,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await sendEnvelope({ envelopeId: envelope.id, signers });

      onOpenChange(false);
      setSigners([]);
      setMessage("");
    } catch (error) {
      console.error("Error al enviar para firma:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Documento para Firma
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Firmantes</Label>
            
            {signers.length > 0 && (
              <ScrollArea className="h-32 border rounded-lg p-4">
                <div className="space-y-2">
                  {signers.map((signer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{signer.name}</p>
                          <p className="text-sm text-muted-foreground">{signer.email}</p>
                        </div>
                        {signer.role && <Badge variant="outline">{signer.role}</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSigner(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={newSigner.name}
                    onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={newSigner.email}
                    onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rol (opcional)</Label>
                <Input
                  value={newSigner.role}
                  onChange={(e) => setNewSigner({ ...newSigner, role: e.target.value })}
                  placeholder="Vendedor, Comprador, etc."
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleAddSigner}
                  className="w-full"
                  disabled={!newSigner.email || !newSigner.name}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Firmante
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensaje para los firmantes (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Por favor revisen y firmen el documento adjunto..."
              rows={4}
            />
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Los firmantes recibirán un email con un enlace seguro para revisar y firmar el documento. El enlace expira en 30 días.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSendForSignature} disabled={signers.length === 0 || loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar para Firma"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}