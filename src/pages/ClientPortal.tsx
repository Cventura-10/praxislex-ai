import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { must } from "@/lib/supa";
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
import { LoadingFallback } from "@/components/LoadingFallback";
import { ClientMessaging, SharedDocuments, AccountSummary } from "@/components/client-portal/ClientPortalComponents";

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
  subtotal?: number;
  itbis?: number;
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
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  // React Query para obtener datos del portal
  const { data: portalData, isLoading, isError, error } = useQuery({
    queryKey: ['client-portal-data'],
    queryFn: async () => {
      console.log("[ClientPortal] Starting data fetch...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("[ClientPortal] No user authenticated");
        throw new Error('No autenticado. Por favor, inicie sesión.');
      }

      console.log("[ClientPortal] User authenticated:", user.id);

      // Buscar cliente vinculado
      const clientByAuthId = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      console.log("[ClientPortal] Client by auth_user_id:", clientByAuthId);
      
      let clientInfo = clientByAuthId.error ? null : clientByAuthId.data;

      // Eliminado fallback por user_id para evitar múltiples filas y 406
      // El portal del cliente se basa solo en auth_user_id
      

      // Si no existe, crear uno
      if (!clientInfo) {
        console.log("[ClientPortal] Creating new client record...");
        
        // Obtener tenant_id del usuario
        const { data: tenantData } = await supabase
          .rpc('get_user_tenant_id', { p_user_id: user.id });
        
        const newClient = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            auth_user_id: user.id,
            tenant_id: tenantData,
            nombre_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || "Cliente",
            email: user.email,
            accepted_terms: false,
          } as any)
          .select()
          .single();
        
        if (newClient.error) {
          console.error("[ClientPortal] Error creating client:", newClient.error);
          throw new Error(`Error al crear registro de cliente: ${newClient.error.message}`);
        }
        
        console.log("[ClientPortal] New client created:", newClient.data.id);
        clientInfo = newClient.data;
      }

      // Obtener resumen
      console.log("[ClientPortal] Fetching client summary...");
      const summaryResult = await supabase
        .rpc('get_client_summary', { p_client_id: clientInfo.id });
      
      if (summaryResult.error) {
        console.error("[ClientPortal] Error fetching summary:", summaryResult.error);
      }
      
      const summaryData = summaryResult.data;

      const summary = summaryData && summaryData.length > 0 ? {
        casosActivos: Number(summaryData[0].casos_activos) || 0,
        proximasAudiencias: Number(summaryData[0].proximas_audiencias) || 0,
        totalFacturado: Number(summaryData[0].total_facturado) || 0,
        totalPagado: Number(summaryData[0].total_pagado) || 0,
        saldoPendiente: Number(summaryData[0].saldo_pendiente) || 0,
      } : {
        casosActivos: 0,
        proximasAudiencias: 0,
        totalFacturado: 0,
        totalPagado: 0,
        saldoPendiente: 0,
      };

      // Query separate tables directly (more secure than using view)
      // Get cases
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .eq("client_id", clientInfo.id);

      // Get hearings for this client's cases
      const caseIds = casesData?.map(c => c.id) || [];
      const { data: hearingsData } = caseIds.length > 0 ? await supabase
        .from("hearings")
        .select("*")
        .in("case_id", caseIds) : { data: null };

      // Get invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientInfo.id);

      // Get documents
      const { data: docsData } = casesData && casesData.length > 0 ? await supabase
        .from("legal_documents")
        .select("*")
        .in("case_number", casesData.map(c => c.numero_expediente)) : { data: null };

      // Process data into Maps
      const uniqueCases = new Map<string, ClientCase>();
      (casesData || []).forEach(c => {
        uniqueCases.set(c.id, c as ClientCase);
      });
      
      const uniqueHearings = new Map<string, ClientHearing>();
      (hearingsData || []).forEach(h => {
        uniqueHearings.set(h.id, {
          id: h.id,
          caso: h.caso,
          fecha: h.fecha,
          hora: h.hora,
          juzgado: h.juzgado,
          tipo: h.tipo,
          ubicacion: h.ubicacion || '',
          estado: h.estado || 'programada'
        });
      });
      
      const uniqueInvoices = new Map<string, ClientInvoice>();
      (invoicesData || []).forEach(inv => {
        uniqueInvoices.set(inv.id, {
          id: inv.id,
          numero_factura: inv.numero_factura,
          concepto: inv.concepto,
          monto: inv.monto,
          subtotal: inv.subtotal,
          itbis: inv.itbis,
          fecha: inv.fecha,
          estado: inv.estado || 'pendiente'
        });
      });
      
      const uniqueDocs = new Map<string, ClientDocument>();
      (docsData || []).forEach(doc => {
        uniqueDocs.set(doc.id, {
          id: doc.id,
          titulo: doc.titulo,
          tipo_documento: doc.tipo_documento,
          materia: doc.materia,
          fecha_generacion: doc.fecha_generacion
        });
      });

      return {
        clientInfo,
        summary,
        cases: Array.from(uniqueCases.values()),
        hearings: Array.from(uniqueHearings.values()),
        invoices: Array.from(uniqueInvoices.values()),
        documents: Array.from(uniqueDocs.values()),
      };
    },
    throwOnError: true,
  });

  // Si hay carga, mostrar loading
  if (isLoading) {
    return <LoadingFallback />;
  }

  // Si hay error, React Query Error Boundary lo manejará
  if (isError) {
    throw error;
  }

  const { clientInfo, summary, cases, hearings, invoices, documents } = portalData;

  const handleAcceptTerms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clientInfo) return;

      const { error } = await supabase
        .from("clients")
        .update({
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq("id", clientInfo.id);

      if (error) throw error;

      setShowTermsDialog(false);
      toast({
        title: "Términos aceptados",
        description: "Bienvenido al portal del cliente",
      });
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
              Bienvenido, {clientInfo.nombre_completo}
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
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
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

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <ClientMessaging 
              clientId={clientInfo.id} 
              lawyerUserId={clientInfo.user_id}
            />
            <div className="space-y-6">
              <SharedDocuments clientId={clientInfo.id} />
              <AccountSummary 
                summary={{
                  totalFacturado: summary.totalFacturado,
                  totalPagado: summary.totalPagado,
                  saldoPendiente: summary.saldoPendiente
                }}
                invoices={invoices}
              />
            </div>
          </div>
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
