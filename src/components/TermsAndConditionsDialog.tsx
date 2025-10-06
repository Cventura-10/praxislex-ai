import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Lock, User } from "lucide-react";

interface TermsAndConditionsDialogProps {
  open: boolean;
  onAccept: () => void;
}

export const TermsAndConditionsDialog = ({ open, onAccept }: TermsAndConditionsDialogProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-primary" />
            Términos y Condiciones de Uso
          </DialogTitle>
          <DialogDescription>
            Por favor, lea cuidadosamente los siguientes términos antes de acceder al portal
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-6">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                1. Consentimiento para el Manejo de Información Personal
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Al aceptar estos términos, usted otorga su consentimiento explícito para que su abogado 
                y el bufete legal gestionen, almacenen y procesen su información personal conforme a lo 
                establecido en el contrato de cuota-litis que ha sido previamente firmado.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Esta información incluye, pero no se limita a: datos de identificación personal, información 
                de contacto, documentos legales relacionados con sus casos, y cualquier otra información 
                necesaria para la representación legal efectiva.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                2. Protección y Confidencialidad de Datos
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Su información personal está protegida bajo las siguientes medidas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso restringido únicamente a personal autorizado</li>
                <li>Cumplimiento con las leyes de protección de datos aplicables</li>
                <li>Auditorías regulares de seguridad y acceso</li>
                <li>Política estricta de confidencialidad profesional</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                3. Acuerdo de Cuota-Litis
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Este portal digital complementa el acuerdo de cuota-litis que usted ha firmado con su 
                abogado. Al aceptar estos términos, usted confirma que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Ha leído y comprendido completamente el contrato de cuota-litis</li>
                <li>Acepta los términos de honorarios y condiciones de pago establecidos</li>
                <li>Autoriza el procesamiento de información relacionada con su caso</li>
                <li>Comprende que el acceso al portal no modifica los términos del contrato firmado</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">4. Uso del Portal</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                El portal del cliente le permite:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Consultar el estado actualizado de sus casos legales</li>
                <li>Ver próximas audiencias y fechas importantes</li>
                <li>Revisar documentos legales relacionados con su representación</li>
                <li>Consultar estado de cuenta y facturas pendientes</li>
                <li>Comunicarse de manera segura con su equipo legal</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">5. Responsabilidades del Cliente</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Usted se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>No compartir su cuenta con terceros no autorizados</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>Revisar regularmente la información actualizada en el portal</li>
                <li>Proporcionar información precisa y actualizada cuando sea requerido</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">6. Derechos del Cliente</h3>
              <p className="text-muted-foreground leading-relaxed">
                Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus 
                datos personales en cualquier momento, conforme a la legislación aplicable. Para ejercer 
                estos derechos, puede contactar directamente con su abogado o el bufete legal.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">7. Modificaciones</h3>
              <p className="text-muted-foreground leading-relaxed">
                Estos términos pueden ser actualizados periódicamente. Se le notificará de cualquier 
                cambio significativo y se le solicitará su aceptación nuevamente si es necesario.
              </p>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-muted-foreground leading-relaxed italic">
                Última actualización: {new Date().toLocaleDateString("es-DO", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-col gap-4">
          <div className="flex items-start gap-3 w-full">
            <Checkbox
              id="terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm leading-relaxed cursor-pointer flex-1"
            >
              He leído, comprendido y acepto los términos y condiciones descritos anteriormente. 
              Confirmo mi consentimiento para el manejo de mi información personal conforme al 
              acuerdo de cuota-litis firmado con mi abogado.
            </label>
          </div>
          <Button
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full"
            size="lg"
          >
            Aceptar y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
