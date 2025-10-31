import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignatureEnvelope, Signer, SignerRole } from "@/hooks/useDigitalSignature";
import { FileSignature, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SignatureEnvelopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actoSlug: string;
  documentUrl?: string;
  onSave: (envelope: SignatureEnvelope) => void;
}

export function SignatureEnvelopeDialog({
  open,
  onOpenChange,
  actoSlug,
  documentUrl,
  onSave,
}: SignatureEnvelopeDialogProps) {
  const [firmantes, setFirmantes] = useState<Signer[]>([
    {
      persona_id: "",
      rol_firma: "arrendador",
      orden: 1,
      email: "",
      verificacion: { otp: "email" },
    },
  ]);

  const addFirmante = () => {
    setFirmantes([
      ...firmantes,
      {
        persona_id: "",
        rol_firma: "arrendatario",
        orden: firmantes.length + 1,
        email: "",
        verificacion: { otp: "email" },
      },
    ]);
  };

  const removeFirmante = (index: number) => {
    setFirmantes(firmantes.filter((_, i) => i !== index));
  };

  const updateFirmante = (index: number, updates: Partial<Signer>) => {
    const updated = [...firmantes];
    updated[index] = { ...updated[index], ...updates };
    setFirmantes(updated);
  };

  const handleSave = () => {
    const envelope: SignatureEnvelope = {
      acto_slug: actoSlug,
      documento_origen: documentUrl || "render_md->pdf",
      documento_url: documentUrl,
      firmantes,
      placeholders_firmas: [
        {
          nombre: "{bloque_firmas}",
          pagina: "auto",
          tipo: "firma",
          required: true,
        },
      ],
      politicas: {
        fidelidad_template: "STRICT",
        hash_pdf: "sha256",
        timestamp: "RFC3161",
        pades: "B-LT",
        audit_trail_embed: true,
      },
      estado: "borrador",
    };

    onSave(envelope);
    onOpenChange(false);
  };

  const isValid = firmantes.every((f) => f.persona_id && f.email && f.rol_firma);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Crear Sobre de Firma Digital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Documento</div>
            <div className="text-sm text-muted-foreground">{actoSlug}</div>
            <Badge variant="outline" className="mt-2">
              Modo: Fidelidad Estricta (STRICT)
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Firmantes</Label>
              <Button variant="outline" size="sm" onClick={addFirmante}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Firmante
              </Button>
            </div>

            {firmantes.map((firmante, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Firmante #{index + 1}</span>
                  {firmantes.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeFirmante(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Rol en el Documento</Label>
                    <Select
                      value={firmante.rol_firma}
                      onValueChange={(value) =>
                        updateFirmante(index, { rol_firma: value as SignerRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arrendador">Arrendador</SelectItem>
                        <SelectItem value="arrendatario">Arrendatario</SelectItem>
                        <SelectItem value="fiador">Fiador</SelectItem>
                        <SelectItem value="abogado">Abogado</SelectItem>
                        <SelectItem value="notario">Notario</SelectItem>
                        <SelectItem value="testigo">Testigo</SelectItem>
                        <SelectItem value="comprador">Comprador</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="poderdante">Poderdante</SelectItem>
                        <SelectItem value="poderhabiente">Poderhabiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ID/Cédula/RNC</Label>
                    <Input
                      value={firmante.persona_id}
                      onChange={(e) => updateFirmante(index, { persona_id: e.target.value })}
                      placeholder="000-0000000-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={firmante.email}
                      onChange={(e) => updateFirmante(index, { email: e.target.value })}
                      placeholder="firmante@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp (opcional)</Label>
                    <Input
                      value={firmante.whatsapp || ""}
                      onChange={(e) => updateFirmante(index, { whatsapp: e.target.value })}
                      placeholder="+1 809 000 0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Verificación OTP</Label>
                  <Select
                    value={firmante.verificacion.otp || "email"}
                    onValueChange={(value) =>
                      updateFirmante(index, {
                        verificacion: { ...firmante.verificacion, otp: value as "sms" | "email" | "wa" },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="wa">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <div className="font-medium mb-1">✓ Cumplimiento Ley 126-02 RD</div>
            <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Verificación de identidad (OTP + datos del sistema)</li>
              <li>Hash SHA-256 para integridad del documento</li>
              <li>Sellado de tiempo RFC 3161</li>
              <li>Trazabilidad completa (audit trail)</li>
              <li>Formato PAdES B-LT con validación a largo plazo</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Crear Sobre de Firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
