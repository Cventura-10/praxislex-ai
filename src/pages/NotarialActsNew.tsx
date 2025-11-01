import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Scale, 
  FileText, 
  Plus, 
  Search,
  Calendar,
  Users,
  Building2,
  Download,
  Eye,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNotarialActs } from "@/hooks/useNotarialActs";

export default function NotarialActsNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { acts, loading, deleteAct } = useNotarialActs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActId, setSelectedActId] = useState<string | null>(null);

  const handleCreateNew = () => {
    navigate("/legal-acts-generator");
  };

  const handleViewAct = (actId: string) => {
    toast({
      title: "Visualizar acto",
      description: `Abriendo acto ${actId}`,
    });
  };

  const handleDownloadAct = (actId: string) => {
    toast({
      title: "Descargar acto",
      description: `Descargando acto ${actId}`,
    });
  };

  const handleDeleteAct = (actId: string) => {
    setSelectedActId(actId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedActId) return;
    
    try {
      await deleteAct(selectedActId);
      setDeleteDialogOpen(false);
      setSelectedActId(null);
    } catch (error) {
      console.error("Error deleting act:", error);
    }
  };

  const filteredActos = acts.filter((acto) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      acto.numero_protocolo?.toLowerCase().includes(searchLower) ||
      acto.titulo.toLowerCase().includes(searchLower) ||
      acto.acto_especifico?.toLowerCase().includes(searchLower);

    const matchesTipo = filterTipo === "all" || acto.tipo_acto === filterTipo;
    const matchesEstado = 
      filterEstado === "all" || 
      (filterEstado === "firmado" && acto.firmado) ||
      (filterEstado === "borrador" && !acto.firmado);

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const totalActos = acts.length;
  const actosEst= acts.filter(a => a.firmado).length;
  const actosEnBorrador = acts.filter(a => !a.firmado).length;
  const actosEsteMes = acts.filter(a => {
    const now = new Date();
    const created = new Date(a.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Scale className="h-12 w-12 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Cargando actos notariales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            Actos Notariales
          </h2>
          <p className="text-muted-foreground">
            Gestión y generación de actos notariales en República Dominicana
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Acto Notarial
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="search" className="sr-only">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por número, título o notario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="filter-tipo" className="sr-only">Filtrar por tipo</Label>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger id="filter-tipo">
                <SelectValue placeholder="Tipo de acto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Compraventa">Compraventa</SelectItem>
                <SelectItem value="Arrendamiento">Arrendamiento</SelectItem>
                <SelectItem value="Donación">Donación</SelectItem>
                <SelectItem value="Hipoteca">Hipoteca</SelectItem>
                <SelectItem value="Constitución Sociedad">Constitución Sociedad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-estado" className="sr-only">Filtrar por estado</Label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger id="filter-estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="firmado">Firmados</SelectItem>
                <SelectItem value="borrador">Borradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Actos</p>
              <p className="text-2xl font-bold">{totalActos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Firmados</p>
              <p className="text-2xl font-bold text-green-600">
                {actosEsteMes}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Borradores</p>
              <p className="text-2xl font-bold text-amber-600">
                {actosEnBorrador}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {actosEsteMes}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de actos */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lista de Actos Notariales
          </h3>
        </div>

        {filteredActos.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay actos notariales</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterTipo !== "all" || filterEstado !== "all"
                ? "No se encontraron actos con los filtros aplicados"
                : "Comienza creando tu primer acto notarial"}
            </p>
            {!searchQuery && filterTipo === "all" && filterEstado === "all" && (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Acto Notarial
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActos.map((acto) => (
                  <TableRow key={acto.id} className="hover:bg-accent/5">
                    <TableCell className="font-mono text-sm">
                      {acto.numero_protocolo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{acto.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {acto.acto_especifico}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{acto.tipo_acto}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{acto.ciudad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(acto.fecha_instrumentacion), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {acto.firmado ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Firmado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Borrador</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAct(acto.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAct(acto.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAct(acto.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ¿Eliminar acto notarial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El acto notarial será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
