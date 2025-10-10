import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  Eye,
  Download,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { InvoiceViewer } from "@/components/InvoiceViewer";
import { useLawFirmProfile } from "@/hooks/useLawFirmProfile";
import { TermsAndConditionsDialog } from "@/components/TermsAndConditionsDialog";

interface ClientCase {
  id: string;
  numero_expediente: string;
  titulo: string;
  materia: string;
  juzgado: string | null;
  etapa_procesal: string | null;
  estado: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientHearing {
  id: string;
  caso: string;
  fecha: string;
  hora: string;
  juzgado: string;
  tipo: string;
  ubicacion: string | null;
  estado: string;
}

interface ClientInvoice {
  id: string;
  numero_factura: string;
  concepto: string;
  monto: number;
  fecha: string;
  estado: string;
  clients?: {
    nombre_completo: string;
  };
}

interface ClientDocument {
  id: string;
  tipo_documento: string;
  titulo: string;
  materia: string;
  fecha_generacion: string;
}


const ClientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: lawFirmProfile } = useLawFirmProfile();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [summary, setSummary] = useState({
    casosActivos: 0,
    proximasAudiencias: 0,
    totalFacturado: 0,
    totalPagado: 0,
    saldoPendiente: 0,
  });
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [hearings, setHearings] = useState<ClientHearing[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "No autenticado",
          description: "Por favor, inicie sesión para ver sus casos",
          variant: "destructive",
        });
        return;
      }

      // Primero buscar si ya existe un cliente vinculado a este usuario autenticado
      let { data: clientInfo, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      // Si no existe por auth_user_id, buscar por user_id (auto-creado)
      if (!clientInfo && !clientError) {
        const { data: ownClient } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (ownClient) {
          clientInfo = ownClient;
        }
      }

      // Si no existe ningún registro, crear uno automáticamente
      if (!clientInfo && !clientError) {
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            auth_user_id: user.id,
            nombre_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || "Cliente",
            email: user.email,
            accepted_terms: false,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating client:", createError);
          toast({
            title: "Error al crear perfil",
            description: "No fue posible crear su perfil de cliente. Intente nuevamente o contacte soporte.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        clientInfo = newClient;
        toast({
          title: "¡Bienvenido!",
          description: "Se ha creado su perfil de cliente. Ya puede acceder al portal.",
        });
      }

      // Si hay un error real de base de datos (no solo "no encontrado")
      if (clientError) {
        console.error("Error fetching client:", clientError);
        toast({
          title: "Error de acceso",
          description: "No fue posible validar su perfil. Intente nuevamente o contacte soporte.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setClientData(clientInfo);

      // Verificar si el cliente ha aceptado los términos
      if (!clientInfo.accepted_terms) {
        setShowTermsDialog(true);
      }

      // Obtener resumen usando la función del servidor
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_client_summary', { p_client_id: clientInfo.id });

      if (!summaryError && summaryData && summaryData.length > 0) {
        const s = summaryData[0];
        setSummary({
          casosActivos: Number(s.casos_activos) || 0,
          proximasAudiencias: Number(s.proximas_audiencias) || 0,
          totalFacturado: Number(s.total_facturado) || 0,
          totalPagado: Number(s.total_pagado) || 0,
          saldoPendiente: Number(s.saldo_pendiente) || 0,
        });
      }

      // Obtener datos detallados desde la vista
      const { data: portalData, error: portalError } = await supabase
        .from("client_portal_view")
        .select("*")
        .eq("client_id", clientInfo.id);

      if (portalError) {
        console.error("Error fetching portal data:", portalError);
      }

      if (portalData && portalData.length > 0) {
        // Extraer casos únicos
        const uniqueCases = new Map();
        portalData.forEach(row => {
          if (row.case_id && !uniqueCases.has(row.case_id)) {
            uniqueCases.set(row.case_id, {
              id: row.case_id,
              numero_expediente: row.numero_expediente,
              titulo: row.case_titulo,
              materia: row.case_materia,
              juzgado: row.case_juzgado,
              etapa_procesal: row.etapa_procesal,
              estado: row.case_estado,
              descripcion: row.case_descripcion,
              created_at: clientInfo.created_at,
              updated_at: clientInfo.updated_at,
            });
          }
        });
        setCases(Array.from(uniqueCases.values()));

        // Extraer audiencias únicas
        const uniqueHearings = new Map();
        portalData.forEach(row => {
          if (row.audiencia_id && !uniqueHearings.has(row.audiencia_id)) {
            uniqueHearings.set(row.audiencia_id, {
              id: row.audiencia_id,
              caso: row.audiencia_caso_nombre || row.case_titulo || '',
              fecha: row.audiencia_fecha,
              hora: row.audiencia_hora,
              juzgado: row.audiencia_juzgado,
              tipo: row.audiencia_tipo,
              ubicacion: row.audiencia_ubicacion,
              estado: row.audiencia_estado,
            });
          }
        });
        setHearings(Array.from(uniqueHearings.values()));

        // Extraer facturas únicas
        const uniqueInvoices = new Map();
        portalData.forEach(row => {
          if (row.invoice_id && !uniqueInvoices.has(row.invoice_id)) {
            uniqueInvoices.set(row.invoice_id, {
              id: row.invoice_id,
              numero_factura: row.numero_factura,
              concepto: row.invoice_concepto,
              monto: row.invoice_monto,
              fecha: row.invoice_fecha,
              estado: row.invoice_estado,
              clients: { nombre_completo: clientInfo.nombre_completo },
            });
          }
        });
        setInvoices(Array.from(uniqueInvoices.values()));

        // Extraer documentos únicos
        const uniqueDocs = new Map();
        portalData.forEach(row => {
          if (row.document_id && !uniqueDocs.has(row.document_id)) {
            uniqueDocs.set(row.document_id, {
              id: row.document_id,
              tipo_documento: row.tipo_documento,
              titulo: row.document_titulo,
              materia: row.document_materia,
              fecha_generacion: row.document_fecha,
            });
          }
        });
        setDocuments(Array.from(uniqueDocs.values()));
      }

    } catch (error: any) {
      console.error("Error fetching client data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clientData) return;

      const { error } = await supabase
        .from("clients")
        .update({
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq("id", clientData.id);

      if (error) throw error;

      setShowTermsDialog(false);
      toast({
        title: "Términos aceptados",
        description: "Bienvenido al portal del cliente",
      });
      
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron aceptar los términos",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { variant: "outline" as const, label: "Pendiente" },
      parcial: { variant: "secondary" as const, label: "Pago Parcial" },
      pagado: { variant: "default" as const, label: "Pagado" },
      vencido: { variant: "destructive" as const, label: "Vencido" },
      cancelado: { variant: "outline" as const, label: "Cancelado" },
    };
    const config = variants[estado as keyof typeof variants] || variants.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(*)")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;

      setSelectedInvoice(data);
      setShowInvoiceViewer(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar la factura",
        variant: "destructive",
      });
    }
  };

  const totalPendiente = summary.saldoPendiente;
  const totalPagado = summary.totalPagado;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso no disponible</h2>
            <p className="text-muted-foreground">
              No se encontró información de cliente asociada a su cuenta.
              Por favor, contacte con su abogado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <TermsAndConditionsDialog 
        open={showTermsDialog} 
        onAccept={handleAcceptTerms}
      />
      
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portal del Cliente</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido, {clientData.nombre_completo}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Casos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.casosActivos}</div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Audiencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.proximasAudiencias}</div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendiente)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPagado)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Mis Casos</TabsTrigger>
          <TabsTrigger value="hearings">Audiencias</TabsTrigger>
          <TabsTrigger value="invoices">Facturación</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Mis Casos</CardTitle>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tiene casos registrados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Juzgado</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((caso) => (
                      <TableRow key={caso.id}>
                        <TableCell className="font-mono text-xs">{caso.numero_expediente}</TableCell>
                        <TableCell className="font-medium">{caso.titulo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{caso.materia}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{caso.juzgado || "N/A"}</TableCell>
                        <TableCell>
                          {caso.etapa_procesal ? (
                            <CaseStatusBadge status={caso.etapa_procesal as any} />
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={caso.estado === "activo" ? "default" : "secondary"}>
                            {caso.estado || "N/A"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hearings Tab */}
        <TabsContent value="hearings" className="space-y-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Audiencias Programadas</CardTitle>
            </CardHeader>
            <CardContent>
              {hearings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay audiencias programadas
                </div>
              ) : (
                <div className="space-y-4">
                  {hearings.map((hearing) => (
                    <div
                      key={hearing.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium">{hearing.caso}</p>
                          <p className="text-sm text-muted-foreground mt-1">{hearing.juzgado}</p>
                        </div>
                        <Badge variant={hearing.estado === "confirmada" ? "default" : "secondary"}>
                          {hearing.estado === "confirmada" ? "Confirmada" : "Pendiente"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-primary">
                            {formatDate(hearing.fecha)} • {hearing.hora}
                          </span>
                        </div>
                        <div className="text-sm">
                          <Badge variant="outline">{hearing.tipo}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Estado de Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay facturas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono font-medium text-sm">{invoice.numero_factura}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(invoice.fecha)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {invoice.concepto}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.monto)}
                        </TableCell>
                        <TableCell>{getEstadoBadge(invoice.estado)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Documentos Legales</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay documentos disponibles
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.titulo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.tipo_documento}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{doc.materia}</TableCell>
                        <TableCell className="text-sm">{formatDate(doc.fecha_generacion)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Viewer */}
      {selectedInvoice && (
        <InvoiceViewer
          open={showInvoiceViewer}
          onClose={() => {
            setShowInvoiceViewer(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          lawFirm={lawFirmProfile}
        />
      )}
      </div>
    </>
  );
};

export default ClientPortal;
