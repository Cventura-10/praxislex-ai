import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocumentViewerProps {
  content: string;
  title: string;
  onDownload?: () => void;
  onSendToJudicial?: () => void;
  abogadoNombre?: string;
  abogadoMatricula?: string;
}

export const DocumentViewer = ({ 
  content, 
  title, 
  onDownload, 
  onSendToJudicial,
  abogadoNombre,
  abogadoMatricula 
}: DocumentViewerProps) => {
  const [formattedContent, setFormattedContent] = useState<JSX.Element[]>([]);

  useEffect(() => {
    if (content) {
      const lines = content.split('\n');
      const formatted = lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Detectar títulos principales (mayúsculas completas)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100) {
          return (
            <div key={index} className="font-bold text-base mt-4 mb-2 text-center">
              {trimmed}
            </div>
          );
        }
        
        // Detectar subtítulos (terminan con :)
        if (trimmed.endsWith(':')) {
          return (
            <div key={index} className="font-semibold text-sm mt-3 mb-1">
              {trimmed}
            </div>
          );
        }
        
        // Detectar numeración (1.1., 2.3., etc.)
        if (/^\d+\.\d+\./.test(trimmed)) {
          return (
            <div key={index} className="text-sm my-1 ml-4">
              {trimmed}
            </div>
          );
        }
        
        // Líneas vacías
        if (trimmed.length === 0) {
          return <div key={index} className="h-2"></div>;
        }
        
        // Texto normal justificado
        return (
          <div key={index} className="text-sm text-justify leading-relaxed my-1">
            {trimmed}
          </div>
        );
      });
      
      setFormattedContent(formatted);
    }
  }, [content]);

  return (
    <Card className="h-full shadow-medium">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {onDownload && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar Word
              </Button>
            )}
            {onSendToJudicial && (
              <Button 
                size="sm" 
                onClick={onSendToJudicial}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar a Portal Judicial
              </Button>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          Vista Previa - Formato Word Letter
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-8 bg-white" style={{ 
            width: '8.5in',
            minHeight: '11in',
            margin: '0 auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            fontFamily: 'Times New Roman, serif'
          }}>
            {formattedContent.length > 0 ? (
              <>
                {formattedContent}
                
                {/* Firma Digital del Abogado */}
                {abogadoNombre && (
                  <div className="mt-12 border-t pt-6">
                    <div className="text-center space-y-2">
                      <div className="font-bold text-sm">
                        {abogadoNombre}
                      </div>
                      {abogadoMatricula && (
                        <div className="text-sm text-muted-foreground">
                          Matrícula: {abogadoMatricula}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-4">
                        Documento generado digitalmente el {new Date().toLocaleDateString('es-DO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="inline-block px-4 py-2 border-2 border-primary/30 rounded mt-2">
                        <div className="text-xs font-mono text-primary">
                          FIRMA DIGITAL
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>El documento generado aparecerá aquí</p>
                <p className="text-sm mt-2">Formato Letter (8.5" x 11") - Justificado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
