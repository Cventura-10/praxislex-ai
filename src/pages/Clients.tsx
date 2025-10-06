import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientSchema } from "@/lib/validation";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, Briefcase, Eye, Edit, Trash2, EyeOff, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { maskEmail, maskPhone, maskCedula } from "@/lib/dataMasking";

interface Client {
  id: string;
  nombre_completo: string;
  cedula_rnc: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  created_at: string;
  updated_at: string;
}

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showViewClientDialog, setShowViewClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [revealedClients, setRevealedClients] = useState<Set<string>>(new Set());

  const [newClient, setNewClient] = useState({
    nombre_completo: "",
    cedula_rnc: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  const [editClient, setEditClient] = useState({
    nombre_completo: "",
    cedula_rnc: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      // Validate input data
      const clientData = {
        nombre_completo: newClient.nombre_completo,
        cedula_rnc: newClient.cedula_rnc,
        email: newClient.email || undefined,
        telefono: newClient.telefono || undefined,
        direccion: newClient.direccion || undefined,
      };

      const validationResult = clientSchema.safeParse(clientData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const errorMessages = errors.map(err => `• ${err.message}`).join('\n');
        toast({
          title: "Datos inválidos",
          description: errors.length > 1 
            ? `Por favor corrija los siguientes errores:\n${errorMessages}`
            : errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Insertar cliente
      const { data: newClientData, error: clientError } = await supabase
        .from("clients")
        .insert([
          {
            ...validationResult.data,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (clientError) throw clientError;

      // Crear relación usuario-cliente
      if (newClientData) {
        const { error: relationError } = await supabase
          .from("user_clients")
          .insert([
            {
              user_id: user.id,
              client_id: newClientData.id,
              rol: 'principal',
            },
          ]);

        if (relationError) {
          console.error("Error creating user-client relation:", relationError);
        }
      }

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente y asociado a su cuenta",
      });

      setShowNewClientDialog(false);
      setNewClient({
        nombre_completo: "",
        cedula_rnc: "",
        email: "",
        telefono: "",
        direccion: "",
      });
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewClientDialog(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditClient({
      nombre_completo: client.nombre_completo,
      cedula_rnc: client.cedula_rnc,
      email: client.email || "",
      telefono: client.telefono || "",
      direccion: client.direccion || "",
    });
    setShowEditClientDialog(true);
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;

    try {
      const clientData = {
        nombre_completo: editClient.nombre_completo,
        cedula_rnc: editClient.cedula_rnc,
        email: editClient.email || undefined,
        telefono: editClient.telefono || undefined,
        direccion: editClient.direccion || undefined,
      };

      const validationResult = clientSchema.safeParse(clientData);
      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const errorMessages = errors.map(err => `• ${err.message}`).join('\n');
        toast({
          title: "Datos inválidos",
          description: errors.length > 1 
            ? `Por favor corrija los siguientes errores:\n${errorMessages}`
            : errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("clients")
        .update(validationResult.data)
        .eq("id", selectedClient.id);

      if (error) throw error;

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados exitosamente",
      });

      setShowEditClientDialog(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleRevealClient = async (clientId: string) => {
    try {
      // Use secure RPC to reveal PII with server-side audit logging
      const { data, error } = await supabase.rpc('reveal_client_pii', {
        p_client_id: clientId
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No se pudo acceder a los datos del cliente");
      }

      setRevealedClients(prev => new Set(prev).add(clientId));

      toast({
        title: "Datos revelados",
        description: "Los datos sensibles ahora son visibles. Esta acción ha sido registrada en auditoría.",
      });
    } catch (error: any) {
      console.error("Error revealing client data:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron revelar los datos",
        variant: "destructive",
      });
    }
  };

  const handleSendInvitation = async (clientId: string, clientEmail: string, nombre: string) => {
    try {
      if (!clientEmail) {
        toast({
          title: "Error",
          description: "El cliente no tiene email registrado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke("send-client-invitation", {
        body: { clientId },
      });

      if (error) throw error;

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado la invitación al portal a ${nombre}`,
      });

      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la invitación",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (clientId: string, nombre: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Cliente eliminado",
        description: `${nombre} ha sido eliminado`,
      });

      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      searchQuery === "" ||
      client.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cedula_rnc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-1">Administra tu cartera de clientes</p>
          </div>
        </div>
        <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>Complete los datos del nuevo cliente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  id="nombre_completo"
                  value={newClient.nombre_completo}
                  onChange={(e) => setNewClient({ ...newClient, nombre_completo: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cedula_rnc">Cédula/RNC *</Label>
                <Input
                  id="cedula_rnc"
                  value={newClient.cedula_rnc}
                  onChange={(e) => setNewClient({ ...newClient, cedula_rnc: e.target.value })}
                  placeholder="Ej: 001-1234567-8"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="cliente@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  placeholder="+1 809 555 0101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient} disabled={!newClient.nombre_completo || !newClient.cedula_rnc}>
                Crear Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">Cargando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay clientes registrados. Crea tu primer cliente haciendo clic en "Nuevo cliente"
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cédula/RNC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-accent/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(client.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.nombre_completo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {revealedClients.has(client.id) ? client.cedula_rnc : maskCedula(client.cedula_rnc)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {revealedClients.has(client.id) ? client.email : maskEmail(client.email)}
                          </div>
                        )}
                        {client.telefono && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {revealedClients.has(client.id) ? client.telefono : maskPhone(client.telefono)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!revealedClients.has(client.id) && (
                          <Button variant="ghost" size="icon" onClick={() => handleRevealClient(client.id)} title="Revelar datos enmascarados">
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewClient(client)}
                          title="Ver cliente"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClient(client)}
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSendInvitation(client.id, client.email || '', client.nombre_completo)}
                          title="Enviar invitación al portal"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id, client.nombre_completo)}>
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
          Mostrando {filteredClients.length} de {clients.length} clientes
        </p>
      </div>

      {/* View Client Dialog */}
      <Dialog open={showViewClientDialog} onOpenChange={setShowViewClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>Información completa del cliente</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(selectedClient.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedClient.nombre_completo}</h3>
                  <p className="text-sm text-muted-foreground">Cliente desde {new Date(selectedClient.created_at).toLocaleDateString('es-DO')}</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label className="text-muted-foreground">Cédula/RNC</Label>
                  <p className="font-mono text-sm mt-1">{selectedClient.cedula_rnc}</p>
                </div>
                
                {selectedClient.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedClient.email}</p>
                    </div>
                  </div>
                )}
                
                {selectedClient.telefono && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedClient.telefono}</p>
                    </div>
                  </div>
                )}
                
                {selectedClient.direccion && (
                  <div>
                    <Label className="text-muted-foreground">Dirección</Label>
                    <p className="text-sm mt-1">{selectedClient.direccion}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground">Última actualización</Label>
                  <p className="text-sm mt-1">{new Date(selectedClient.updated_at).toLocaleString('es-DO')}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setShowViewClientDialog(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifica los datos del cliente</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_nombre_completo">Nombre Completo *</Label>
              <Input
                id="edit_nombre_completo"
                value={editClient.nombre_completo}
                onChange={(e) => setEditClient({ ...editClient, nombre_completo: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_cedula_rnc">Cédula/RNC *</Label>
              <Input
                id="edit_cedula_rnc"
                value={editClient.cedula_rnc}
                onChange={(e) => setEditClient({ ...editClient, cedula_rnc: e.target.value })}
                placeholder="Ej: 001-1234567-8"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editClient.email}
                onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                placeholder="cliente@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_telefono">Teléfono</Label>
              <Input
                id="edit_telefono"
                value={editClient.telefono}
                onChange={(e) => setEditClient({ ...editClient, telefono: e.target.value })}
                placeholder="+1 809 555 0101"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_direccion">Dirección</Label>
              <Input
                id="edit_direccion"
                value={editClient.direccion}
                onChange={(e) => setEditClient({ ...editClient, direccion: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditClientDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={!editClient.nombre_completo || !editClient.cedula_rnc}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
