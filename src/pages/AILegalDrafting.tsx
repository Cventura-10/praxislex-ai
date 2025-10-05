import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Send, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MATERIAS_JURIDICAS, TIPOS_DOCUMENTO } from "@/lib/constants";
import { VoiceInput } from "@/components/VoiceInput";
import { DocumentViewer } from "@/components/DocumentViewer";
import { ScrollArea } from "@/components/ui/scroll-area";

const AILegalDrafting = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");

  // Formulario completo basado en el modelo de demanda
  const [formData, setFormData] = useState({
    // Tipo y materia
    tipo_documento: "demanda",
    materia: "civil",
    
    // Datos del Acto
    acto_numero: "",
    acto_folios: "",
    acto_año: new Date().getFullYear().toString(),
    ciudad_actuacion: "",
    fecha_actuacion: "",
    provincia: "",
    
    // Alguacil
    alguacil_nombre: "",
    alguacil_designacion: "",
    
    // Demandante
    demandante_nombre: "",
    demandante_nacionalidad: "dominicano",
    demandante_edad: "",
    demandante_estado_civil: "",
    demandante_cedula: "",
    demandante_domicilio: "",
    
    // Firma Apoderada
    firma_nombre: "",
    firma_rnc: "",
    firma_representante: "",
    firma_cedula_representante: "",
    firma_domicilio: "",
    
    // Abogado Apoderado
    abogado_nombre: "",
    abogado_cedula: "",
    abogado_matricula: "",
    abogado_direccion: "",
    abogado_telefono: "",
    abogado_email: "",
    
    // Demandado
    demandado_nombre: "",
    demandado_domicilio: "",
    demandado_cargo: "",
    
    // Tribunal
    juzgado: "",
    juzgado_ubicacion: "",
    expediente_judicial: "",
    expediente_gedex: "",
    
    // Contenido
    hechos: "",
    pretension: "",
    legislacion: "",
    jurisprudencia: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVoiceInput = (field: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev] + (prev[field as keyof typeof prev] ? ' ' : '') + text,
    }));
  };

  const generateDocument = async () => {
    if (!formData.hechos || !formData.pretension) {
      toast({
        title: "Información incompleta",
        description: "Por favor, completa los hechos y la pretensión",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-legal-doc', {
        body: {
          tipo_documento: formData.tipo_documento,
          materia: formData.materia,
          hechos: formData.hechos,
          pretension: formData.pretension,
          demandante: {
            nombre: formData.demandante_nombre,
            nacionalidad: formData.demandante_nacionalidad,
            edad: formData.demandante_edad,
            estado_civil: formData.demandante_estado_civil,
            cedula: formData.demandante_cedula,
            domicilio: formData.demandante_domicilio,
          },
          abogado: {
            nombre: formData.abogado_nombre,
            cedula: formData.abogado_cedula,
            matricula: formData.abogado_matricula,
            direccion: formData.abogado_direccion,
            telefono: formData.abogado_telefono,
            email: formData.abogado_email,
          },
          firma_apoderada: {
            nombre: formData.firma_nombre,
            rnc: formData.firma_rnc,
            representante: formData.firma_representante,
            cedula_representante: formData.firma_cedula_representante,
            domicilio: formData.firma_domicilio,
          },
          demandado: {
            nombre: formData.demandado_nombre,
            domicilio: formData.demandado_domicilio,
            cargo: formData.demandado_cargo,
          },
          acto: {
            numero: formData.acto_numero,
            folios: formData.acto_folios,
            año: formData.acto_año,
            fecha: formData.fecha_actuacion,
            ciudad: formData.ciudad_actuacion,
            tribunal: formData.juzgado,
            alguacil_nombre: formData.alguacil_nombre,
          },
          ciudad_actuacion: formData.ciudad_actuacion,
          alguacil_designacion: formData.alguacil_designacion,
          juzgado: formData.juzgado,
          numero_expediente: formData.expediente_judicial,
          legislacion: formData.legislacion,
          jurisprudencia: formData.jurisprudencia,
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: "Límite excedido",
            description: "Intenta en unos minutos.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes('402')) {
          toast({
            title: "Créditos agotados",
            description: "Recarga créditos en Configuración.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.documento) {
        setGeneratedDoc(data.documento);
        
        // Guardar en base de datos
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === formData.tipo_documento)?.label || formData.tipo_documento;
          
          await supabase.from("legal_documents").insert({
            user_id: user.id,
            tipo_documento: formData.tipo_documento,
            materia: formData.materia,
            titulo: `${tipoLabel} - ${formData.demandante_nombre || 'N/D'} vs ${formData.demandado_nombre || 'N/D'}`,
            contenido: data.documento,
            demandante_nombre: formData.demandante_nombre,
            demandado_nombre: formData.demandado_nombre,
            juzgado: formData.juzgado,
            numero_expediente: formData.expediente_judicial,
          });
        }
        
        toast({
          title: "✓ Documento generado",
          description: "Tu documento ha sido redactado y guardado",
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el documento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
      
      const paragraphs = generatedDoc.split('\n').map(line => {
        const trimmed = line.trim();
        const isHeading = trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100);
        
        if (!trimmed) return new Paragraph({ text: '' });
        
        return new Paragraph({
          children: [new TextRun({ text: trimmed, bold: isHeading, size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        });
      });

      // Agregar firma digital
      paragraphs.push(
        new Paragraph({ text: '', spacing: { before: 400 } }),
        new Paragraph({
          children: [new TextRun({ text: formData.abogado_nombre, bold: true, size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: `Matrícula: ${formData.abogado_matricula}`, size: 22 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: `Documento generado digitalmente el ${new Date().toLocaleString('es-DO')}`, size: 18, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.tipo_documento}_${formData.materia}_${new Date().toLocaleDateString('es-DO').replace(/\//g, '-')}.docx`;
      a.click();

      toast({
        title: "✓ Descargado",
        description: "Documento Word guardado exitosamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento Word",
        variant: "destructive",
      });
    }
  };

  const sendToJudicialPortal = () => {
    toast({
      title: "Próximamente",
      description: "La integración con el Portal Judicial estará disponible pronto",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Formulario - Lado Izquierdo */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-6 pr-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Redacción Jurídica IA</h1>
            <p className="text-muted-foreground mt-1">
              Genera documentos profesionales con IA
            </p>
          </div>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Tipo de Documento y Materia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Acción</Label>
                <Select value={formData.tipo_documento} onValueChange={(v) => handleInputChange("tipo_documento", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Materia</Label>
                <Select value={formData.materia} onValueChange={(v) => handleInputChange("materia", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAS_JURIDICAS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Datos del Acto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>No. Acto</Label>
                  <div className="flex gap-2">
                    <Input value={formData.acto_numero} onChange={(e) => handleInputChange("acto_numero", e.target.value)} />
                    <VoiceInput onTranscribed={(text) => handleVoiceInput("acto_numero", text)} />
                  </div>
                </div>
                <div>
                  <Label>Folios</Label>
                  <Input value={formData.acto_folios} onChange={(e) => handleInputChange("acto_folios", e.target.value)} />
                </div>
                <div>
                  <Label>Año</Label>
                  <Input value={formData.acto_año} onChange={(e) => handleInputChange("acto_año", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Ciudad de Actuación</Label>
                <div className="flex gap-2">
                  <Input placeholder="Santo Domingo" value={formData.ciudad_actuacion} onChange={(e) => handleInputChange("ciudad_actuacion", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("ciudad_actuacion", text)} />
                </div>
              </div>

              <div>
                <Label>Fecha Completa</Label>
                <div className="flex gap-2">
                  <Input placeholder="a los cinco (5) de octubre del año dos mil veinticinco (2025)" value={formData.fecha_actuacion} onChange={(e) => handleInputChange("fecha_actuacion", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("fecha_actuacion", text)} />
                </div>
              </div>

              <div>
                <Label>Alguacil (Nombre Completo)</Label>
                <div className="flex gap-2">
                  <Input value={formData.alguacil_nombre} onChange={(e) => handleInputChange("alguacil_nombre", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("alguacil_nombre", text)} />
                </div>
              </div>

              <div>
                <Label>Designación del Alguacil</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} value={formData.alguacil_designacion} onChange={(e) => handleInputChange("alguacil_designacion", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("alguacil_designacion", text)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Demandante / Requeriente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <div className="flex gap-2">
                  <Input value={formData.demandante_nombre} onChange={(e) => handleInputChange("demandante_nombre", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandante_nombre", text)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Nacionalidad</Label>
                  <Input value={formData.demandante_nacionalidad} onChange={(e) => handleInputChange("demandante_nacionalidad", e.target.value)} />
                </div>
                <div>
                  <Label>Edad</Label>
                  <Input value={formData.demandante_edad} onChange={(e) => handleInputChange("demandante_edad", e.target.value)} />
                </div>
                <div>
                  <Label>Estado Civil</Label>
                  <Input value={formData.demandante_estado_civil} onChange={(e) => handleInputChange("demandante_estado_civil", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Cédula</Label>
                <div className="flex gap-2">
                  <Input placeholder="001-0000000-0" value={formData.demandante_cedula} onChange={(e) => handleInputChange("demandante_cedula", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandante_cedula", text)} />
                </div>
              </div>

              <div>
                <Label>Domicilio Completo</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} value={formData.demandante_domicilio} onChange={(e) => handleInputChange("demandante_domicilio", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandante_domicilio", text)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Firma Apoderada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Razón Social</Label>
                <div className="flex gap-2">
                  <Input value={formData.firma_nombre} onChange={(e) => handleInputChange("firma_nombre", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("firma_nombre", text)} />
                </div>
              </div>

              <div>
                <Label>RNC</Label>
                <Input value={formData.firma_rnc} onChange={(e) => handleInputChange("firma_rnc", e.target.value)} />
              </div>

              <div>
                <Label>Representante Legal</Label>
                <div className="flex gap-2">
                  <Input value={formData.firma_representante} onChange={(e) => handleInputChange("firma_representante", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("firma_representante", text)} />
                </div>
              </div>

              <div>
                <Label>Cédula del Representante</Label>
                <Input value={formData.firma_cedula_representante} onChange={(e) => handleInputChange("firma_cedula_representante", e.target.value)} />
              </div>

              <div>
                <Label>Domicilio de la Firma</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} value={formData.firma_domicilio} onChange={(e) => handleInputChange("firma_domicilio", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("firma_domicilio", text)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Abogado Apoderado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <div className="flex gap-2">
                  <Input value={formData.abogado_nombre} onChange={(e) => handleInputChange("abogado_nombre", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("abogado_nombre", text)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cédula</Label>
                  <Input value={formData.abogado_cedula} onChange={(e) => handleInputChange("abogado_cedula", e.target.value)} />
                </div>
                <div>
                  <Label>Matrícula</Label>
                  <div className="flex gap-2">
                    <Input value={formData.abogado_matricula} onChange={(e) => handleInputChange("abogado_matricula", e.target.value)} />
                    <VoiceInput onTranscribed={(text) => handleVoiceInput("abogado_matricula", text)} />
                  </div>
                </div>
              </div>

              <div>
                <Label>Dirección del Despacho</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} value={formData.abogado_direccion} onChange={(e) => handleInputChange("abogado_direccion", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("abogado_direccion", text)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Teléfono</Label>
                  <Input value={formData.abogado_telefono} onChange={(e) => handleInputChange("abogado_telefono", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.abogado_email} onChange={(e) => handleInputChange("abogado_email", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Demandado / Parte Contraria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre Completo / Razón Social</Label>
                <div className="flex gap-2">
                  <Input value={formData.demandado_nombre} onChange={(e) => handleInputChange("demandado_nombre", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandado_nombre", text)} />
                </div>
              </div>

              <div>
                <Label>Domicilio</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} value={formData.demandado_domicilio} onChange={(e) => handleInputChange("demandado_domicilio", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandado_domicilio", text)} />
                </div>
              </div>

              <div>
                <Label>Cargo / Calidad</Label>
                <div className="flex gap-2">
                  <Input value={formData.demandado_cargo} onChange={(e) => handleInputChange("demandado_cargo", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandado_cargo", text)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Tribunal y Expediente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Juzgado</Label>
                <div className="flex gap-2">
                  <Input placeholder="Cámara Civil y Comercial del Juzgado de Primera Instancia..." value={formData.juzgado} onChange={(e) => handleInputChange("juzgado", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("juzgado", text)} />
                </div>
              </div>

              <div>
                <Label>Ubicación del Tribunal</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={2} placeholder="Primera Planta del Edificio del Palacio de Justicia..." value={formData.juzgado_ubicacion} onChange={(e) => handleInputChange("juzgado_ubicacion", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("juzgado_ubicacion", text)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expediente Judicial No.</Label>
                  <Input placeholder="________/" value={formData.expediente_judicial} onChange={(e) => handleInputChange("expediente_judicial", e.target.value)} />
                </div>
                <div>
                  <Label>Expediente GEDEX</Label>
                  <Input placeholder="________/" value={formData.expediente_gedex} onChange={(e) => handleInputChange("expediente_gedex", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Hechos y Pretensión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hechos del Caso (Relato Fáctico)</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={6} placeholder="Describe cronológicamente los hechos del caso..." value={formData.hechos} onChange={(e) => handleInputChange("hechos", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("hechos", text)} />
                </div>
              </div>

              <div>
                <Label>Pretensión (Dispositivos)</Label>
                <div className="flex gap-2 flex-1">
                  <Textarea rows={4} placeholder="¿Qué solicitas al tribunal?" value={formData.pretension} onChange={(e) => handleInputChange("pretension", e.target.value)} />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("pretension", text)} />
                </div>
              </div>

              <div>
                <Label>Legislación Adicional (Opcional)</Label>
                <Textarea rows={2} value={formData.legislacion} onChange={(e) => handleInputChange("legislacion", e.target.value)} />
              </div>

              <div>
                <Label>Jurisprudencia (Opcional)</Label>
                <Textarea rows={2} value={formData.jurisprudencia} onChange={(e) => handleInputChange("jurisprudencia", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={generateDocument} disabled={isGenerating} className="w-full gap-2" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generando documento...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generar con IA
              </>
            )}
          </Button>
        </div>
      </ScrollArea>

      {/* Visor Permanente - Lado Derecho */}
      <div className="sticky top-0">
        <DocumentViewer
          content={generatedDoc}
          title="Vista Previa del Documento"
          onDownload={downloadDocument}
          onSendToJudicial={sendToJudicialPortal}
          abogadoNombre={formData.abogado_nombre}
          abogadoMatricula={formData.abogado_matricula}
        />
      </div>
    </div>
  );
};

export default AILegalDrafting;
