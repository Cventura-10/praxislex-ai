import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Share2,
  Trash2,
  ArrowLeft,
  Send,
  FileCheck,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TIPOS_DOCUMENTO, MATERIAS_JURIDICAS } from "@/lib/constants";

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Log document view to audit table
        await supabase.from("data_access_audit").insert({
          user_id: user.id,
          table_name: 'legal_documents',
          record_id: doc.id,
          action: 'view_document'
        });
      }
    } catch (error) {
      console.error("Error logging document view:", error);
    }
    
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Log document download to audit table
        await supabase.from("data_access_audit").insert({
          user_id: user.id,
          table_name: 'legal_documents',
          record_id: doc.id,
          action: 'download_document'
        });
      }

      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
      
      const paragraphs = doc.contenido.split('\n').map((line: string) => {
        const trimmed = line.trim();
        const isHeading = trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100);
        
        if (trimmed.length === 0) {
          return new Paragraph({ text: '' });
        }
        
        return new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: isHeading,
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        });
      });

      const wordDoc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: 12240,
                height: 15840,
              },
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(wordDoc);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${doc.titulo}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: "✓ Descargado",
        description: "Documento descargado exitosamente",
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  const handleExportForPJ = async (doc: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Log document export to audit table
        await supabase.from("data_access_audit").insert({
          user_id: user.id,
          table_name: 'legal_documents',
          record_id: doc.id,
          action: 'export_document_pj'
        });
      }

      const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx');
      
      // Formato especial para Poder Judicial Dominicano
      const header = new Paragraph({
        children: [
          new TextRun({
            text: "REPÚBLICA DOMINICANA",
            bold: true,
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      });

      const metadataTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Expediente No.:", bold: true })] })],
                width: { size: 30, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph(doc.numero_expediente || "____________")],
                width: { size: 70, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Materia:", bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph(MATERIAS_JURIDICAS.find(m => m.value === doc.materia)?.label || doc.materia)],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Tipo de Documento:", bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph(TIPOS_DOCUMENTO.find(t => t.value === doc.tipo_documento)?.label || doc.tipo_documento)],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Demandante:", bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph(doc.demandante_nombre || "N/D")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Demandado:", bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph(doc.demandado_nombre || "N/D")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Fecha de Generación:", bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph(new Date(doc.fecha_generacion).toLocaleDateString('es-DO'))],
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
        },
      });

      const separator = new Paragraph({
        text: "________________________________________",
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      });

      const contentParagraphs = doc.contenido.split('\n').map((line: string) => {
        const trimmed = line.trim();
        const isHeading = trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100);
        
        if (trimmed.length === 0) {
          return new Paragraph({ text: '' });
        }
        
        return new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: isHeading,
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        });
      });

      const wordDoc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: 12240,
                height: 15840,
              },
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            header,
            metadataTable,
            separator,
            ...contentParagraphs,
          ],
        }],
      });

      const blob = await Packer.toBlob(wordDoc);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `PJ_${doc.numero_expediente || 'SIN_EXP'}_${doc.titulo}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: "✓ Exportado para Poder Judicial",
        description: "Documento formateado para depósito digital en el portal del PJ",
      });
    } catch (error) {
      console.error("Error exporting for PJ:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el documento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm(`¿Confirmar eliminación de: ${doc.titulo}?`)) return;

    try {
      const { error } = await supabase
        .from("legal_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: "✓ Documento eliminado",
        description: "El documento ha sido eliminado",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.demandante_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.demandado_nombre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y visualiza tus documentos legales generados
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/redaccion-ia")}>
          <Plus className="h-4 w-4" />
          Generar Nuevo
        </Button>
      </div>

      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos por título, partes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="shadow-medium">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Cargando documentos...</p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card className="shadow-medium">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No hay documentos generados</p>
            <p className="text-sm text-muted-foreground mt-2">
              Usa la funcionalidad de Redacción IA para generar tu primer documento
            </p>
            <Button className="mt-4" onClick={() => navigate("/redaccion-ia")}>
              Generar Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-medium">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Partes</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-accent/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-info" />
                        <div>
                          <p className="font-medium">{doc.titulo}</p>
                          {doc.numero_expediente && (
                            <p className="text-xs text-muted-foreground">
                              Exp: {doc.numero_expediente}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo_documento)?.label || doc.tipo_documento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {MATERIAS_JURIDICAS.find(m => m.value === doc.materia)?.label || doc.materia}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {doc.demandante_nombre && (
                        <div>
                          <p className="font-medium">{doc.demandante_nombre}</p>
                          {doc.demandado_nombre && (
                            <p className="text-xs text-muted-foreground">vs. {doc.demandado_nombre}</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(doc.fecha_generacion).toLocaleDateString('es-DO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDocument(doc)}
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Descargar Word"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportForPJ(doc)}
                          title="Exportar para Poder Judicial"
                        >
                          <Send className="h-4 w-4 text-[#0E6B4E]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc)}
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
          </CardContent>
        </Card>
      )}

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-[#0E6B4E]" />
              {selectedDoc?.titulo}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc && (
                <div className="flex gap-4 text-xs mt-2">
                  <span>Tipo: {TIPOS_DOCUMENTO.find(t => t.value === selectedDoc.tipo_documento)?.label}</span>
                  <span>Materia: {MATERIAS_JURIDICAS.find(m => m.value === selectedDoc.materia)?.label}</span>
                  {selectedDoc.numero_expediente && <span>Exp: {selectedDoc.numero_expediente}</span>}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDoc && (
            <div className="space-y-4">
              <div id="document-preview" className="prose max-w-none max-h-[500px] overflow-y-auto border rounded-lg p-6 bg-slate-50 print:overflow-visible print:max-h-none print:shadow-none">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-justify">
                  {selectedDoc.contenido}
                </pre>
              </div>
              
              <div className="flex gap-2 justify-end print:hidden">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDoc)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar Word
                </Button>
                <Button
                  onClick={() => handleExportForPJ(selectedDoc)}
                  className="gap-2 bg-[#0E6B4E]"
                >
                  <Send className="h-4 w-4" />
                  Exportar para Poder Judicial
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Mostrando {filteredDocuments.length} de {documents.length} documentos</p>
      </div>
    </div>
  );
};

export default Documents;
