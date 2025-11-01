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
  Filter,
  Calendar,
  Users,
  Building2,
  Download,
  Eye,
  Trash2
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function NotarialActsNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");

  // Datos de ejemplo (en producción vendrán de useNotarialActs)
  const actosNotariales = [
    {
      id: "1",
      numero_acto: "ACT-2025-001",
      tipo_acto: "Compraventa",
      acto_especifico: "Inmueble",
      titulo: "Compraventa de Casa en Piantini",
      ciudad: "Santo Domingo",
      notario_nombre: "Dr. Juan Pérez",
      fecha_actuacion: new Date("2025-01-15"),
      firmado: true,
      created_at: new Date("2025-01-10"),
    },
    {
      id: "2",
      numero_acto: "ACT-2025-002",
      tipo_acto: "Arrendamiento",
      acto_especifico: "Local Comercial",
      titulo: "Contrato de Alquiler - Plaza Naco",
      ciudad: "Santo Domingo",
      notario_nombre: "Dra. María González",
      fecha_actuacion: new Date("2025-01-20"),
      firmado: false,
      created_at: new Date("2025-01-18"),
    },
  ];

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
    toast({
      title: "Eliminar acto",
      description: `¿Está seguro de eliminar el acto ${actId}?`,
      variant: "destructive",
    });
  };

  const filteredActos = actosNotariales.filter((acto) => {
    const matchesSearch = 
      acto.numero_acto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acto.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acto.notario_nombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTipo = filterTipo === "all" || acto.tipo_acto === filterTipo;
    const matchesEstado = 
      filterEstado === "all" || 
      (filterEstado === "firmado" && acto.firmado) ||
      (filterEstado === "borrador" && !acto.firmado);

    return matchesSearch && matchesTipo && matchesEstado;
  });

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
              <p className="text-2xl font-bold">{actosNotariales.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Firmados</p>
              <p className="text-2xl font-bold text-green-600">
                {actosNotariales.filter(a => a.firmado).length}
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
                {actosNotariales.filter(a => !a.firmado).length}
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
                {actosNotariales.filter(a => {
                  const now = new Date();
                  return a.created_at.getMonth() === now.getMonth() &&
                         a.created_at.getFullYear() === now.getFullYear();
                }).length}
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
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Notario</TableHead>
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
                      {acto.numero_acto}
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
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{acto.notario_nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{acto.ciudad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(acto.fecha_actuacion, "dd MMM yyyy", { locale: es })}
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
    </div>
  );
}
