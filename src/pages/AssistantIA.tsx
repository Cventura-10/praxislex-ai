import { ChatIA } from "@/components/ai/ChatIA";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AssistantIA() {
  const navigate = useNavigate();

  const handleAction = (intent: string, result: any) => {
    console.log("Acción ejecutada:", intent, result);
    
    // Redirigir según el tipo de acción
    switch (intent) {
      case "create_case":
        toast.success("Redirigiendo a casos...");
        setTimeout(() => navigate("/casos"), 1500);
        break;
      case "create_hearing":
        toast.success("Redirigiendo a audiencias...");
        setTimeout(() => navigate("/audiencias"), 1500);
        break;
      case "create_invoice":
        toast.success("Redirigiendo a facturación...");
        setTimeout(() => navigate("/facturacion"), 1500);
        break;
      case "create_document":
        toast.success("Redirigiendo a documentos...");
        setTimeout(() => navigate("/documentos"), 1500);
        break;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Asistente IA</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tu asistente inteligente para PraxisLex. Puedo ayudarte a crear casos, registrar audiencias,
          generar facturas y mucho más. Solo pídelo en lenguaje natural.
        </p>
      </div>

      <div className="mb-6">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Ejemplos de lo que puedo hacer:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• "Crea un nuevo caso de divorcio para el cliente María Rodríguez"</li>
            <li>• "Registra una audiencia para mañana a las 10:00 am en el tribunal civil"</li>
            <li>• "Genera una factura de RD$5,000 al cliente Juan Pérez"</li>
            <li>• "Registra un gasto de RD$1,200 en papelería"</li>
            <li>• "Crea un documento de poder notarial"</li>
          </ul>
        </Card>
      </div>

      <ChatIA 
        context="Usuario en página principal del asistente IA"
        onAction={handleAction}
      />
    </div>
  );
}
