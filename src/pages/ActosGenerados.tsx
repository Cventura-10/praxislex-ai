import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Download,
  Eye,
  Trash2,
  ArrowLeft
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
import { useGeneratedActs } from "@/hooks/useGeneratedActs";

export default function ActosGenerados() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { acts, loading, deleteAct } = useGeneratedActs();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActId, setSelectedActId] = useState<string | null>(null);

  const handleCreateNew = () => {
    navigate("/generador-actos");
  };

  const handleViewAct = async (actId: string) => {
    const act = acts.find(a => a.id === actId);
    if (!act) return;

    // Buscar la última versión del documento
    const { data: versions } = await supabase
      .from('document_versions')
      .select('*')
      .eq('generated_act_id', actId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versions && versions.length > 0) {
      const latestVersion = versions[0];
      const { data } = supabase.storage
        .from('generated_documents')
        .getPublicUrl(latestVersion.storage_path);
      
      window.open(data.publicUrl, '_blank');
    } else {
      toast({
        title: "No hay versiones",
        description: "Este acto no tiene documentos generados aún",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAct = async (actId: string) => {
    const act = acts.find(a => a.id === actId);
    if (!act) return;

    // Buscar la última versión del documento
    const { data: versions, error: versionError } = await supabase
      .from('document_versions')
      .select('*')
      .eq('generated_act_id', actId)
      .order('version_number', { ascending: false })
      .limit(1);

    if (versionError || !versions || versions.length === 0) {
      toast({
        title: "No hay versiones",
        description: "Este acto no tiene documentos generados para descargar",
        variant: "destructive",
      });
      return;
    }

    const latestVersion = versions[0];
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('generated_documents')
      .download(latestVersion.storage_path);

    if (downloadError || !fileData) {
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
      return;
    }

    const url = window.URL.createObjectURL(fileData);
    const a = document.createElement('a');
    a.href = url;
    a.download = latestVersion.file_name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Descarga completada",
      description: `${latestVersion.file_name} descargado exitosamente`,
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

  const filteredActos = useMemo(() => {
    return acts.filter((acto) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        acto.numero_acto?.toLowerCase().includes(searchLower) ||
        acto.titulo.toLowerCase().includes(searchLower) ||
        acto.tipo_acto.toLowerCase().includes(searchLower) ||
        (acto.clients?.nombre_completo || "").toLowerCase().includes(searchLower);

      const matchesMateria = filterMateria === "all" || acto.materia === filterMateria;
      const matchesEstado = 
        filterEstado === "all" || 
        (filterEstado === "firmado" && acto.firmado) ||
        (filterEstado === "borrador" && !acto.firmado);

      return matchesSearch && matchesMateria && matchesEstado;
    });
  }, [acts, searchQuery, filterMateria, filterEstado]);

  const stats = useMemo(() => ({
    totalActos: acts.length,
    actosFirmados: acts.filter(a => a.firmado).length,
    actosEnBorrador: acts.filter(a => !a.firmado).length,
    actosEsteMes: acts.filter(a => {
      const now = new Date();
      const created = new Date(a.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  }), [acts]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Scale className="h-12 w-12 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Cargando actos generados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              Actos Generados
            </h2>
            <p className="text-muted-foreground">
              Gestión de todos los actos jurídicos generados
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Acto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Actos</p>
              <p className="text-2xl font-bold text-primary">
                {stats.totalActos}
              </p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Firmados</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.actosFirmados}
              </p>
            </div>
            <Scale className="h-8 w-8 text-green-600/50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Borrador</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.actosEnBorrador}
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-600/50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.actosEsteMes}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título, tipo o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterMateria} onValueChange={setFilterMateria}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
              <SelectItem value="civil">Civil</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="laboral">Laboral</SelectItem>
              <SelectItem value="penal">Penal</SelectItem>
              <SelectItem value="administrativo">Administrativo</SelectItem>
              <SelectItem value="notarial">Notarial</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="firmado">Firmados</SelectItem>
              <SelectItem value="borrador">En Borrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabla de actos */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lista de Actos Generados
          </h3>
        </div>

        {filteredActos.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterMateria !== "all" || filterEstado !== "all"
                ? "No se encontraron actos con los filtros aplicados"
                : "No hay actos generados aún"}
            </p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer acto
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActos.map((acto) => (
                <TableRow key={acto.id}>
                  <TableCell className="font-mono text-sm">
                    {acto.numero_acto || acto.numero_acta || "Sin número"}
                  </TableCell>
                  <TableCell className="font-medium">{acto.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acto.tipo_acto}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{acto.materia}</Badge>
                  </TableCell>
                  <TableCell>
                    {acto.clients?.nombre_completo || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(acto.fecha_actuacion), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={acto.firmado ? "default" : "secondary"}>
                      {acto.firmado ? "Firmado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewAct(acto.id)}
                        title="Ver acto"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadAct(acto.id)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAct(acto.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El acto será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
