import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, Briefcase, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const clients = [
    {
      id: "cli_01",
      nombre: "Juan Pérez",
      cedula: "001-1234567-8",
      email: "juanp@example.com",
      telefono: "+1 809 555 0101",
      casosActivos: 2,
      ultimaActividad: "Hace 2 días",
    },
    {
      id: "cli_02",
      nombre: "Ana Martínez",
      cedula: "001-2345678-9",
      email: "ana.martinez@example.com",
      telefono: "+1 809 555 0202",
      casosActivos: 1,
      ultimaActividad: "Hace 5 días",
    },
    {
      id: "cli_03",
      nombre: "Carlos García",
      cedula: "001-3456789-0",
      email: "cgarcia@example.com",
      telefono: "+1 809 555 0303",
      casosActivos: 1,
      ultimaActividad: "Hace 1 semana",
    },
    {
      id: "cli_04",
      nombre: "Laura Rodríguez",
      cedula: "001-4567890-1",
      email: "laura.r@example.com",
      telefono: "+1 809 555 0404",
      casosActivos: 1,
      ultimaActividad: "Hace 3 días",
    },
    {
      id: "cli_05",
      nombre: "Bufete López & Asociados",
      cedula: "RNC: 131-12345-6",
      email: "contacto@lopezasoc.do",
      telefono: "+1 809 555 0505",
      casosActivos: 1,
      ultimaActividad: "Hace 2 semanas",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleViewClient = (nombre: string) => {
    toast({
      title: "Ver perfil",
      description: `Abriendo perfil de: ${nombre}`,
    });
  };

  const handleEditClient = (nombre: string) => {
    toast({
      title: "Editar cliente",
      description: `Editando: ${nombre}`,
    });
  };

  const handleDeleteClient = (nombre: string) => {
    toast({
      title: "Eliminar cliente",
      description: `¿Confirmar eliminación de: ${nombre}?`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Administra tu cartera de clientes
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
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
            <Button variant="outline">Filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Cédula/RNC</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Casos activos</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-accent/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(client.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{client.nombre}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {client.cedula}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.telefono}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Briefcase className="h-3 w-3" />
                      {client.casosActivos}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.ultimaActividad}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewClient(client.nombre)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClient(client.nombre)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.nombre)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Mostrando 5 de 5 clientes</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Clients;
