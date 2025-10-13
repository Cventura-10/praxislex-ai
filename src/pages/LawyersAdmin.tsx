import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, ArrowLeft, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLawyers, Lawyer } from "@/hooks/useLawyers";

const LawyersAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lawyers, loading, fetchLawyers, createLawyer } = useLawyers();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [newLawyer, setNewLawyer] = useState({
    nombre: "",
    cedula: "",
    email: "",
    telefono: "",
    rol: "abogado" as const,
    estado: "activo" as const,
  });

  const handleCreateLawyer = async () => {
    try {
      await createLawyer(newLawyer);
      
      toast({
        title: "Abogado creado",
        description: "El abogado ha sido agregado exitosamente",
      });

      setShowNewDialog(false);
      setNewLawyer({
        nombre: "",
        cedula: "",
        email: "",
        telefono: "",
        rol: "abogado",
        estado: "activo",
      });
      
      fetchLawyers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el abogado",
        variant: "destructive",
      });
    }
  };

  const handleViewLawyer = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administración de Abogados</h1>
            <p className="text-muted-foreground mt-1">Gestiona el equipo legal de tu firma</p>
          </div>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo abogado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Abogado</DialogTitle>
              <DialogDescription>Complete los datos del abogado</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={newLawyer.nombre}
                  onChange={(e) => setNewLawyer({ ...newLawyer, nombre: e.target.value })}
                  placeholder="Ej: Dra. María González"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={newLawyer.cedula}
                  onChange={(e) => setNewLawyer({ ...newLawyer, cedula: e.target.value })}
                  placeholder="001-1234567-8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLawyer.email}
                  onChange={(e) => setNewLawyer({ ...newLawyer, email: e.target.value })}
                  placeholder="abogado@firma.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={newLawyer.telefono}
                  onChange={(e) => setNewLawyer({ ...newLawyer, telefono: e.target.value })}
                  placeholder="+1 809 555 0101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rol">Rol</Label>
                <Select value={newLawyer.rol} onValueChange={(value: any) => setNewLawyer({ ...newLawyer, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socio">Socio</SelectItem>
                    <SelectItem value="abogado">Abogado</SelectItem>
                    <SelectItem value="asociado">Asociado</SelectItem>
                    <SelectItem value="pasante">Pasante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLawyer} disabled={!newLawyer.nombre}>
                Crear Abogado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Equipo Legal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando abogados...</div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay abogados registrados. Agregue el primer miembro del equipo.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((lawyer) => (
                  <TableRow key={lawyer.id}>
                    <TableCell className="font-medium">{lawyer.nombre}</TableCell>
                    <TableCell>{lawyer.cedula || "N/A"}</TableCell>
                    <TableCell>{lawyer.email || "N/A"}</TableCell>
                    <TableCell>{lawyer.telefono || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {lawyer.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lawyer.estado === "activo" ? "default" : "secondary"}>
                        {lawyer.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewLawyer(lawyer)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Lawyer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Abogado</DialogTitle>
            <DialogDescription>Información completa del miembro del equipo</DialogDescription>
          </DialogHeader>
          {selectedLawyer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Nombre Completo</Label>
                  <p className="font-medium">{selectedLawyer.nombre}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Rol</Label>
                  <Badge variant="outline" className="capitalize w-fit">
                    {selectedLawyer.rol}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Cédula</Label>
                  <p className="font-medium">{selectedLawyer.cedula || "No especificada"}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={selectedLawyer.estado === "activo" ? "default" : "secondary"} className="w-fit">
                    {selectedLawyer.estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedLawyer.email || "No especificado"}</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{selectedLawyer.telefono || "No especificado"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-xs">Fecha de Creación</Label>
                  <p className="text-sm">{new Date(selectedLawyer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-xs">Última Actualización</Label>
                  <p className="text-sm">{new Date(selectedLawyer.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setShowViewDialog(false);
              navigate('/casos');
            }}>
              Asignar a Caso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyersAdmin;
