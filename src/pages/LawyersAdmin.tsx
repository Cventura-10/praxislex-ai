import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Eye, ArrowLeft, UserCheck, FileText, Gavel, FlaskConical, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLawyers, Lawyer } from "@/hooks/useLawyers";
import { useNotarios, Notario } from "@/hooks/useNotarios";
import { useAlguaciles, Alguacil } from "@/hooks/useAlguaciles";
import { usePeritos, Perito } from "@/hooks/usePeritos";
import { useTasadores, Tasador } from "@/hooks/useTasadores";

const LawyersAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { lawyers, loading: loadingLawyers, createLawyer } = useLawyers();
  const { notarios, loading: loadingNotarios, createNotario } = useNotarios();
  const { alguaciles, loading: loadingAlguaciles, createAlguacil } = useAlguaciles();
  const { peritos, loading: loadingPeritos, createPerito } = usePeritos();
  const { tasadores, loading: loadingTasadores, createTasador } = useTasadores();
  
  const [activeTab, setActiveTab] = useState("abogados");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    email: "",
    telefono: "",
    rol: "abogado",
    estado: "activo",
    especialidad: "",
    matricula: "",
    jurisdiccion: "",
    institucion: "",
    direccion: "",
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      cedula: "",
      email: "",
      telefono: "",
      rol: "abogado",
      estado: "activo",
      especialidad: "",
      matricula: "",
      jurisdiccion: "",
      institucion: "",
      direccion: "",
    });
  };

  const handleCreate = async () => {
    try {
      switch (activeTab) {
        case "abogados":
          await createLawyer({
            nombre: formData.nombre,
            cedula: formData.cedula,
            email: formData.email,
            telefono: formData.telefono,
            rol: formData.rol,
            estado: formData.estado,
          });
          break;
        case "notarios":
          await createNotario({
            nombre: formData.nombre,
            cedula_encrypted: formData.cedula,
            email: formData.email,
            telefono: formData.telefono,
            matricula_cdn: formData.matricula,
            jurisdiccion: formData.jurisdiccion,
            oficina_direccion: formData.direccion,
            estado: formData.estado,
          });
          break;
        case "alguaciles":
          await createAlguacil({
            nombre: formData.nombre,
            cedula_encrypted: formData.cedula,
            email: formData.email,
            telefono: formData.telefono,
            matricula: formData.matricula,
            jurisdiccion: formData.jurisdiccion,
            direccion_notificaciones: formData.direccion,
            estado: formData.estado,
          });
          break;
        case "peritos":
          await createPerito({
            nombre: formData.nombre,
            cedula_encrypted: formData.cedula,
            email: formData.email,
            telefono: formData.telefono,
            especialidad: formData.especialidad,
            matricula: formData.matricula,
            jurisdiccion: formData.jurisdiccion,
            institucion: formData.institucion,
            direccion: formData.direccion,
            estado: formData.estado,
          });
          break;
        case "tasadores":
          await createTasador({
            nombre: formData.nombre,
            cedula_encrypted: formData.cedula,
            email: formData.email,
            telefono: formData.telefono,
            especialidad: formData.especialidad,
            matricula: formData.matricula,
            jurisdiccion: formData.jurisdiccion,
            direccion: formData.direccion,
            estado: formData.estado,
          });
          break;
      }
      
      toast({
        title: "Profesional creado",
        description: "El profesional ha sido agregado exitosamente",
      });

      setShowNewDialog(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el profesional",
        variant: "destructive",
      });
    }
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const getTabConfig = () => {
    switch (activeTab) {
      case "abogados":
        return {
          title: "Abogados",
          data: lawyers,
          loading: loadingLawyers,
          icon: UserCheck,
          buttonText: "Nuevo Abogado",
        };
      case "notarios":
        return {
          title: "Notarios",
          data: notarios,
          loading: loadingNotarios,
          icon: FileText,
          buttonText: "Nuevo Notario",
        };
      case "alguaciles":
        return {
          title: "Alguaciles",
          data: alguaciles,
          loading: loadingAlguaciles,
          icon: Gavel,
          buttonText: "Nuevo Alguacil",
        };
      case "peritos":
        return {
          title: "Peritos",
          data: peritos,
          loading: loadingPeritos,
          icon: FlaskConical,
          buttonText: "Nuevo Perito",
        };
      case "tasadores":
        return {
          title: "Tasadores",
          data: tasadores,
          loading: loadingTasadores,
          icon: Home,
          buttonText: "Nuevo Tasador",
        };
      default:
        return {
          title: "Abogados",
          data: lawyers,
          loading: loadingLawyers,
          icon: UserCheck,
          buttonText: "Nuevo Abogado",
        };
    }
  };

  const config = getTabConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Profesionales</h1>
            <p className="text-muted-foreground mt-1">Administra abogados, notarios, alguaciles, peritos y tasadores</p>
          </div>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {config.buttonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar {config.title.slice(0, -1)}</DialogTitle>
              <DialogDescription>Complete los datos del profesional</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Dra. María González"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  placeholder="001-1234567-8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="profesional@firma.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+1 809 555 0101"
                />
              </div>
              
              {activeTab === "abogados" && (
                <div className="grid gap-2">
                  <Label htmlFor="rol">Rol</Label>
                  <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
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
              )}

              {(activeTab === "notarios" || activeTab === "alguaciles" || activeTab === "peritos" || activeTab === "tasadores") && (
                <div className="grid gap-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Número de matrícula"
                  />
                </div>
              )}

              {(activeTab === "peritos" || activeTab === "tasadores") && (
                <div className="grid gap-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Valuación de propiedades"
                  />
                </div>
              )}

              {(activeTab === "notarios" || activeTab === "alguaciles" || activeTab === "peritos" || activeTab === "tasadores") && (
                <div className="grid gap-2">
                  <Label htmlFor="jurisdiccion">Jurisdicción de Actuación</Label>
                  <Input
                    id="jurisdiccion"
                    value={formData.jurisdiccion}
                    onChange={(e) => setFormData({ ...formData, jurisdiccion: e.target.value })}
                    placeholder="Ej: Santo Domingo, Distrito Nacional"
                  />
                </div>
              )}

              {activeTab === "alguaciles" && (
                <div className="grid gap-2">
                  <Label htmlFor="tribunal">Tribunal Asignado</Label>
                  <Input
                    id="tribunal"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ej: Primera Sala Civil y Comercial"
                  />
                </div>
              )}

              {activeTab === "peritos" && (
                <div className="grid gap-2">
                  <Label htmlFor="institucion">Institución</Label>
                  <Input
                    id="institucion"
                    value={formData.institucion}
                    onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                    placeholder="Institución de certificación"
                  />
                </div>
              )}

              {(activeTab === "notarios" || activeTab === "alguaciles" || activeTab === "peritos" || activeTab === "tasadores") && (
                <div className="grid gap-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección del profesional"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowNewDialog(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.nombre || (activeTab === "alguaciles" && !formData.jurisdiccion)}>
                Crear {config.title.slice(0, -1)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="abogados" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Abogados
          </TabsTrigger>
          <TabsTrigger value="notarios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notarios
          </TabsTrigger>
          <TabsTrigger value="alguaciles" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Alguaciles
          </TabsTrigger>
          <TabsTrigger value="peritos" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Peritos
          </TabsTrigger>
          <TabsTrigger value="tasadores" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Tasadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {config.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {config.loading ? (
                <div className="text-center py-8">Cargando {config.title.toLowerCase()}...</div>
              ) : config.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay {config.title.toLowerCase()} registrados. Agregue el primer profesional.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      {activeTab === "abogados" && <TableHead>Rol</TableHead>}
                      {(activeTab === "peritos" || activeTab === "tasadores") && <TableHead>Especialidad</TableHead>}
                      {(activeTab === "notarios" || activeTab === "alguaciles" || activeTab === "peritos" || activeTab === "tasadores") && <TableHead>Jurisdicción</TableHead>}
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.data.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>{item.email || "N/A"}</TableCell>
                        <TableCell>{item.telefono || "N/A"}</TableCell>
                        {activeTab === "abogados" && (
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.rol}
                            </Badge>
                          </TableCell>
                        )}
                        {(activeTab === "peritos" || activeTab === "tasadores") && (
                          <TableCell>{item.especialidad || "N/A"}</TableCell>
                        )}
                        {(activeTab === "notarios" || activeTab === "alguaciles" || activeTab === "peritos" || activeTab === "tasadores") && (
                          <TableCell>{item.jurisdiccion || "N/A"}</TableCell>
                        )}
                        <TableCell>
                          <Badge variant={item.estado === "activo" ? "default" : "secondary"}>
                            {item.estado === "activo" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(item)}
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
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Profesional</DialogTitle>
            <DialogDescription>Información completa</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Nombre Completo</Label>
                  <p className="font-medium">{selectedItem.nombre}</p>
                </div>
                {selectedItem.rol && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Rol</Label>
                    <Badge variant="outline" className="capitalize w-fit">
                      {selectedItem.rol}
                    </Badge>
                  </div>
                )}
                {selectedItem.especialidad && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">Especialidad</Label>
                    <p className="font-medium">{selectedItem.especialidad}</p>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedItem.email || "No especificado"}</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{selectedItem.telefono || "No especificado"}</p>
              </div>
              {selectedItem.matricula && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Matrícula</Label>
                  <p className="font-medium">{selectedItem.matricula}</p>
                </div>
              )}
              {selectedItem.jurisdiccion && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Jurisdicción de Actuación</Label>
                  <p className="font-medium">{selectedItem.jurisdiccion}</p>
                </div>
              )}
              {selectedItem.institucion && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Institución</Label>
                  <p className="font-medium">{selectedItem.institucion}</p>
                </div>
              )}
              {selectedItem.direccion && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{selectedItem.direccion}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Estado</Label>
                <Badge variant={selectedItem.estado === "activo" ? "default" : "secondary"} className="w-fit">
                  {selectedItem.estado === "activo" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyersAdmin;
