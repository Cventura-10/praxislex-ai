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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Share2,
  File,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Documents = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const documents = [
    {
      id: "doc_01",
      nombre: "Demanda en cobro de pesos",
      tipo: "Demanda",
      caso: "Pérez vs. XYZ",
      formato: "DOCX",
      tamano: "245 KB",
      version: 3,
      modificado: "05 Oct 2025",
      autor: "María Arias",
      estado: "Firmado",
    },
    {
      id: "doc_02",
      nombre: "Pruebas documentales",
      tipo: "Anexo",
      caso: "Martínez vs. López",
      formato: "PDF",
      tamano: "1.2 MB",
      version: 1,
      modificado: "03 Oct 2025",
      autor: "José Ramírez",
      estado: "Pendiente firma",
    },
    {
      id: "doc_03",
      nombre: "Escrito de contestación",
      tipo: "Contestación",
      caso: "García vs. Empresa ABC",
      formato: "DOCX",
      tamano: "189 KB",
      version: 2,
      modificado: "28 Sep 2025",
      autor: "María Arias",
      estado: "En revisión",
    },
    {
      id: "doc_04",
      nombre: "Sentencia divorcio",
      tipo: "Sentencia",
      caso: "Rodríguez",
      formato: "PDF",
      tamano: "512 KB",
      version: 1,
      modificado: "25 Sep 2025",
      autor: "Tribunal",
      estado: "Firmado",
    },
    {
      id: "doc_05",
      nombre: "Alegatos finales",
      tipo: "Escrito",
      caso: "Importaciones SA",
      formato: "DOCX",
      tamano: "312 KB",
      version: 1,
      modificado: "20 Sep 2025",
      autor: "José Ramírez",
      estado: "Borrador",
    },
  ];

  const getFileIcon = (formato: string) => {
    return formato === "PDF" ? (
      <File className="h-5 w-5 text-destructive" />
    ) : (
      <FileText className="h-5 w-5 text-info" />
    );
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      Firmado: "default",
      "En revisión": "secondary",
      "Pendiente firma": "outline",
      Borrador: "secondary",
    };
    return (
      <Badge variant={variants[estado] || "default"}>{estado}</Badge>
    );
  };

  const handleViewDocument = (nombre: string) => {
    toast({
      title: "Ver documento",
      description: `Abriendo: ${nombre}`,
    });
  };

  const handleDownloadDocument = (nombre: string) => {
    toast({
      title: "Descargando",
      description: `Descargando: ${nombre}`,
    });
  };

  const handleShareDocument = (nombre: string) => {
    toast({
      title: "Compartir documento",
      description: `Compartiendo: ${nombre}`,
    });
  };

  const handleEditDocument = (nombre: string) => {
    toast({
      title: "Editar documento",
      description: `Editando: ${nombre}`,
    });
  };

  const handleDeleteDocument = (nombre: string) => {
    toast({
      title: "Eliminar documento",
      description: `¿Confirmar eliminación de: ${nombre}?`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Repositorio de documentos y plantillas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo documento
        </Button>
      </div>

      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">Filtros</Button>
            <Button variant="outline">Plantillas</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Caso</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Modificado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:bg-accent/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.formato)}
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tamano}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                      {doc.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{doc.caso}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.formato}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">v{doc.version}</TableCell>
                  <TableCell>{getStatusBadge(doc.estado)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{doc.modificado}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.autor}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDocument(doc.nombre)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDocument(doc.nombre)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShareDocument(doc.nombre)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDocument(doc.nombre)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.nombre)}
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
        <p>Mostrando 5 de 5 documentos</p>
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

export default Documents;
