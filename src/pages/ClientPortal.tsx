import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UserCircle,
  Briefcase,
  FileText,
  CreditCard,
  MessageSquare,
  Upload,
  Download,
  CheckCircle2,
} from "lucide-react";

const ClientPortal = () => {
  const clientInfo = {
    nombre: "Juan Pérez",
    cedula: "001-1234567-8",
    email: "juanp@example.com",
    telefono: "+1 809 555 0101",
  };

  const cases = [
    {
      id: "cas_01",
      titulo: "Cobro de pesos",
      materia: "Civil",
      etapa: "Demanda presentada",
      progreso: 35,
      ultimaActualizacion: "Hace 2 días",
    },
    {
      id: "cas_02",
      titulo: "Reclamación laboral",
      materia: "Laboral",
      etapa: "Fase de conciliación",
      progreso: 60,
      ultimaActualizacion: "Hace 5 días",
    },
  ];

  const documents = [
    {
      id: "doc_01",
      nombre: "Demanda en cobro de pesos",
      tipo: "Legal",
      fecha: "05 Oct 2025",
      firmado: true,
    },
    {
      id: "doc_02",
      nombre: "Contrato de servicios legales",
      tipo: "Administrativo",
      fecha: "01 Sep 2025",
      firmado: true,
    },
    {
      id: "doc_03",
      nombre: "Pruebas documentales",
      tipo: "Anexo",
      fecha: "28 Sep 2025",
      firmado: false,
    },
  ];

  const payments = [
    {
      id: "pay_01",
      concepto: "Honorarios caso civil",
      monto: "RD$ 25,000",
      fecha: "01 Oct 2025",
      estado: "Pagado",
    },
    {
      id: "pay_02",
      concepto: "Honorarios iniciales",
      monto: "RD$ 15,000",
      fecha: "01 Sep 2025",
      estado: "Pagado",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal del Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Vista del cliente para {clientInfo.nombre}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Enviar mensaje
        </Button>
      </div>

      <Card className="shadow-medium border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Información del cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre completo</p>
              <p className="font-medium">{clientInfo.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cédula</p>
              <p className="font-medium font-mono">{clientInfo.cedula}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{clientInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{clientInfo.telefono}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Mis casos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cases.map((caso) => (
              <div
                key={caso.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{caso.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Materia: {caso.materia}
                    </p>
                  </div>
                  <Badge variant="outline">{caso.etapa}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso del caso</span>
                    <span className="font-medium">{caso.progreso}%</span>
                  </div>
                  <Progress value={caso.progreso} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Última actualización: {caso.ultimaActualizacion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.tipo} • {doc.fecha}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.firmado && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Subir documento
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium text-sm">{payment.concepto}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.fecha}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{payment.monto}</p>
                    <Badge variant="default" className="text-xs mt-1">
                      {payment.estado}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Realizar pago
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPortal;
