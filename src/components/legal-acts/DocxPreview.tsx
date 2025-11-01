import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocxPreviewProps {
  actData: any;
  templateSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocxPreview = ({ actData, templateSlug, open, onOpenChange }: DocxPreviewProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      
      const response = await supabase.functions.invoke('generate-legal-doc', {
        body: { ...actData, preview: true }
      });

      if (response.error) throw response.error;

      // Crear blob URL para preview
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      toast.success("Vista previa generada");
    } catch (error: any) {
      console.error('Error generando preview:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `preview_${actData.numero_acto || 'documento'}.docx`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vista Previa del Documento
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          {!previewUrl ? (
            <>
              <FileText className="h-24 w-24 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Genere una vista previa del documento antes de descargarlo
              </p>
              <Button onClick={generatePreview} disabled={isGenerating}>
                {isGenerating ? "Generando..." : "Generar Vista Previa"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 w-full border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="h-16 w-16 mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground max-w-md">
                    Vista previa lista. Los archivos DOCX no pueden mostrarse directamente en el navegador.
                    Descargue el archivo para revisarlo en Microsoft Word o aplicación compatible.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Preview
                </Button>
                <Button onClick={() => setPreviewUrl(null)} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Nueva Preview
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
