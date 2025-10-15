import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, FileSignature, Stamp, ScrollText } from "lucide-react";
import { useNotarialActs } from "@/hooks/useNotarialActs";
import { useTenant } from "@/hooks/useTenant";
import { getNotarialTemplatesByType, NOTARIAL_TEMPLATES_REGISTRY, NotarialActTemplate } from "@/lib/notarialTemplates";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NotarialActWizard } from "@/components/legal-acts/NotarialActWizard";

export default function NotarialActs() {
  const { acts, loading } = useNotarialActs();
  const { isPro, isEnterprise, isLoading: tenantLoading } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "autentico" | "firma_privada" | "declaracion_unilateral">("all");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotarialActTemplate | null>(null);

  const handleCreateAct = (template: NotarialActTemplate) => {
    setSelectedTemplate(template);
    setShowWizard(true);
  };

  const handleWizardSuccess = () => {
    setShowWizard(false);
    setSelectedTemplate(null);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setSelectedTemplate(null);
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isPro && !isEnterprise) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              El módulo de actos notariales requiere un plan Pro o Enterprise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/upgrade'}>
              Actualizar Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredActs = acts.filter(act => {
    const matchesSearch = act.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.acto_especifico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || act.tipo_acto === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'autentico':
        return <Stamp className="h-4 w-4" />;
      case 'firma_privada':
        return <FileSignature className="h-4 w-4" />;
      case 'declaracion_unilateral':
        return <ScrollText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'autentico':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'firma_privada':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'declaracion_unilateral':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'autentico':
        return 'Acto Auténtico';
      case 'firma_privada':
        return 'Firma Privada';
      case 'declaracion_unilateral':
        return 'Declaración Unilateral';
      default:
        return tipo;
    }
  };

  // Si está en modo wizard, mostrar el wizard
  if (showWizard && selectedTemplate) {
    return (
      <div className="container mx-auto py-6">
        <NotarialActWizard
          template={selectedTemplate}
          onCancel={handleWizardCancel}
          onSuccess={handleWizardSuccess}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actos Notariales</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de actos notariales según Ley No. 140-15
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actos Auténticos</CardTitle>
            <Stamp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {acts.filter(a => a.tipo_acto === 'autentico').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firmas Privadas</CardTitle>
            <FileSignature className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {acts.filter(a => a.tipo_acto === 'firma_privada').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declaraciones</CardTitle>
            <ScrollText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {acts.filter(a => a.tipo_acto === 'declaracion_unilateral').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar y Filtrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por título o tipo de acto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Tipo de Acto</Label>
              <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="autentico">Actos Auténticos</SelectItem>
                  <SelectItem value="firma_privada">Firma Privada</SelectItem>
                  <SelectItem value="declaracion_unilateral">Declaraciones Unilaterales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs con plantillas disponibles */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Actos Creados</TabsTrigger>
          <TabsTrigger value="templates">Plantillas Disponibles</TabsTrigger>
        </TabsList>

        {/* Lista de actos creados */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : filteredActs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron actos notariales</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType !== "all" 
                    ? "Intente con otros filtros de búsqueda"
                    : "Comience creando su primer acto notarial"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Acto Notarial
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredActs.map((act) => (
                <Card key={act.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{act.titulo}</CardTitle>
                          {act.firmado && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Firmado
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {act.numero_protocolo && `Protocolo: ${act.numero_protocolo} • `}
                          {format(new Date(act.fecha_instrumentacion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={getTypeBadgeColor(act.tipo_acto)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(act.tipo_acto)}
                          {getTypeLabel(act.tipo_acto)}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Acto Específico:</span>{" "}
                        <span className="text-muted-foreground">
                          {NOTARIAL_TEMPLATES_REGISTRY[act.acto_especifico]?.titulo || act.acto_especifico}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Ciudad:</span>{" "}
                        <span className="text-muted-foreground">{act.ciudad}</span>
                      </div>
                      {act.objeto && (
                        <div className="text-sm">
                          <span className="font-medium">Objeto:</span>{" "}
                          <span className="text-muted-foreground line-clamp-2">{act.objeto}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">Ver Detalles</Button>
                      <Button variant="outline" size="sm">Editar</Button>
                      {!act.firmado && (
                        <Button variant="outline" size="sm">Firmar</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Plantillas disponibles */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actos Auténticos</CardTitle>
              <CardDescription>
                Art. 5 Ley 140-15 - Instrumentados en presencia del notario, hacen plena fe
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {getNotarialTemplatesByType('autentico').map((template) => (
                <Card key={template.actId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Stamp className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.titulo}</CardTitle>
                        <CardDescription className="mt-1">{template.descripcion}</CardDescription>
                        {template.requiere_testigos && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Requiere Testigos Instrumentales
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleCreateAct(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear este acto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actos Bajo Firma Privada</CardTitle>
              <CardDescription>
                Art. 6 Ley 140-15 - Legalización de firmas en documentos privados
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {getNotarialTemplatesByType('firma_privada').map((template) => (
                <Card key={template.actId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <FileSignature className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.titulo}</CardTitle>
                        <CardDescription className="mt-1">{template.descripcion}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleCreateAct(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear este acto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Declaraciones Unilaterales</CardTitle>
              <CardDescription>
                Declaraciones de voluntad donde solo una parte interviene
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {getNotarialTemplatesByType('declaracion_unilateral').map((template) => (
                <Card key={template.actId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <ScrollText className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{template.titulo}</CardTitle>
                        <CardDescription className="mt-1">{template.descripcion}</CardDescription>
                        {template.requiere_testigos && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Requiere Testigos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleCreateAct(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear este acto
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
