import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { caseSchema } from "@/lib/validation";
import { z } from "zod";
import { sanitizeErrorMessage } from "@/lib/errorHandling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, ArrowLeft } from "lucide-react";
import { MATERIAS_JURIDICAS, ETAPAS_PROCESALES, TIPOS_ACCION_LEGAL } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface Case {
  id: string;
  numero_expediente: string;
  titulo: string;
  materia: string;
  juzgado: string | null;
  etapa_procesal: string | null;
  responsable: string | null;
  estado: string | null;
  client_id: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    nombre_completo: string;
  };
}

const Cases = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("all");
  const [filterEtapa, setFilterEtapa] = useState("all");
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);

  const [newCase, setNewCase] = useState({
    numero_expediente: "", // Will be auto-generated if empty
    titulo: "",
    materia: "",
    juzgado: "",
    etapa_procesal: "",
    responsable: "",
    client_id: "",
    descripcion: "",
  });

  useEffect(() => {
    fetchCases();
    fetchClients();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          *,
          clients (
            nombre_completo
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleCreateCase = async () => {
    try {
      // Validate input data
      const caseData = {
        ...newCase,
        estado: "activo",
        client_id: newCase.client_id || null,
      };
      
      const validationResult = caseSchema.safeParse(caseData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const errorMessages = errors.map(err => `• ${err.path.join('.')}: ${err.message}`).join('\n');
        toast({
          title: "Formulario incompleto",
          description: errors.length > 1 
            ? `Por favor complete los siguientes campos:\n${errorMessages}`
            : errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Si numero_expediente está vacío, no lo enviamos para que el trigger lo genere
      const baseData: any = {
        ...validationResult.data,
        user_id: user.id,
      };

      if (!validationResult.data.numero_expediente) {
        delete baseData.numero_expediente;
      }

      const { error } = await supabase.from("cases").insert([baseData]);

      if (error) throw error;

      toast({
        title: "Caso creado",
        description: "El caso ha sido creado exitosamente",
      });

      setShowNewCaseDialog(false);
      setNewCase({
        numero_expediente: "",
        titulo: "",
        materia: "",
        juzgado: "",
        etapa_procesal: "",
        responsable: "",
        client_id: "",
        descripcion: "",
      });
      fetchCases();
    } catch (error: any) {
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleViewCase = (caseId: string, titulo: string) => {
    toast({
      title: "Ver caso",
      description: `Abriendo detalles de: ${titulo}`,
    });
  };

  const handleEditCase = (caseId: string, titulo: string) => {
    toast({
      title: "Editar caso",
      description: `Editando: ${titulo}`,
    });
  };

  const handleDeleteCase = async (caseId: string, titulo: string) => {
    try {
      const { error } = await supabase.from("cases").delete().eq("id", caseId);

      if (error) throw error;

      toast({
        title: "Caso eliminado",
        description: `${titulo} ha sido eliminado`,
      });

      fetchCases();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el caso",
        variant: "destructive",
      });
    }
  };

  const filteredCases = cases.filter((caso) => {
    const matchesSearch =
      searchQuery === "" ||
      caso.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caso.numero_expediente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (caso.clients?.nombre_completo || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMateria = filterMateria === "all" || caso.materia === filterMateria;
    const matchesEtapa = filterEtapa === "all" || caso.etapa_procesal === filterEtapa;

    return matchesSearch && matchesMateria && matchesEtapa;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Casos</h1>
            <p className="text-muted-foreground mt-1">Gestiona todos tus expedientes jurídicos</p>
          </div>
        </div>
        <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo caso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Caso</DialogTitle>
              <DialogDescription>Complete los datos del nuevo caso legal</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="numero_expediente">Número de Expediente (Opcional - Se genera automáticamente)</Label>
                <Input
                  id="numero_expediente"
                  value={newCase.numero_expediente}
                  onChange={(e) => setNewCase({ ...newCase, numero_expediente: e.target.value })}
                  placeholder="Dejar vacío para generar automáticamente"
                />
                <p className="text-xs text-muted-foreground">Si se deja vacío, se generará automáticamente con formato CASO-YYYY-NNNN</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo_accion">Tipo de Acción (Opcional)</Label>
                <Select value="" onValueChange={(value) => setNewCase({ ...newCase, titulo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar una acción predefinida..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TIPOS_ACCION_LEGAL.map((accion) => (
                      <SelectItem key={accion.value} value={accion.label}>
                        {accion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título del Caso * (o escriba uno personalizado)</Label>
                <Input
                  id="titulo"
                  value={newCase.titulo}
                  onChange={(e) => setNewCase({ ...newCase, titulo: e.target.value })}
                  placeholder="Ej: Demanda de Desalojo o seleccione una acción arriba"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client_id">Cliente</Label>
                <Select value={newCase.client_id} onValueChange={(value) => setNewCase({ ...newCase, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="materia">Materia *</Label>
                <Select value={newCase.materia} onValueChange={(value) => setNewCase({ ...newCase, materia: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAS_JURIDICAS.map((materia) => (
                      <SelectItem key={materia.value} value={materia.value}>
                        {materia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="juzgado">Juzgado</Label>
                <Input
                  id="juzgado"
                  value={newCase.juzgado}
                  onChange={(e) => setNewCase({ ...newCase, juzgado: e.target.value })}
                  placeholder="Ej: 1ra Cámara Civil"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="etapa_procesal">Etapa Procesal</Label>
                <Select value={newCase.etapa_procesal} onValueChange={(value) => setNewCase({ ...newCase, etapa_procesal: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPAS_PROCESALES.map((etapa) => (
                      <SelectItem key={etapa.value} value={etapa.value}>
                        {etapa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsable">Responsable</Label>
                <Input
                  id="responsable"
                  value={newCase.responsable}
                  onChange={(e) => setNewCase({ ...newCase, responsable: e.target.value })}
                  placeholder="Ej: Dra. María González"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={newCase.descripcion}
                  onChange={(e) => setNewCase({ ...newCase, descripcion: e.target.value })}
                  placeholder="Descripción del caso"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewCaseDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCase} disabled={!newCase.titulo || !newCase.materia}>
                Crear Caso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Filtros y búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger>
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {MATERIAS_JURIDICAS.map((materia) => (
                  <SelectItem key={materia.value} value={materia.value}>
                    {materia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa procesal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {ETAPAS_PROCESALES.slice(0, 6).map((etapa) => (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">Cargando casos...</div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay casos registrados. Crea tu primer caso haciendo clic en "Nuevo Caso"
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Juzgado</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caso) => (
                  <TableRow key={caso.id} className="hover:bg-accent/5">
                    <TableCell className="font-mono text-xs">{caso.numero_expediente}</TableCell>
                    <TableCell className="font-medium">{caso.titulo}</TableCell>
                    <TableCell>{caso.clients?.nombre_completo || "Sin cliente"}</TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                        {caso.materia}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{caso.juzgado || "N/A"}</TableCell>
                    <TableCell>
                      {caso.etapa_procesal ? <CaseStatusBadge status={caso.etapa_procesal as any} /> : <span className="text-muted-foreground text-sm">N/A</span>}
                    </TableCell>
                    <TableCell className="text-sm">{caso.responsable || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewCase(caso.id, caso.titulo)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditCase(caso.id, caso.titulo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCase(caso.id, caso.titulo)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Mostrando {filteredCases.length} de {cases.length} casos
        </p>
      </div>
    </div>
  );
};

export default Cases;
