import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  FileText,
  Sparkles,
  Download,
  Copy,
  Loader2,
  Play,
  Square,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MATERIAS_JURIDICAS, TIPOS_DOCUMENTO } from "@/lib/constants";

const AILegalDrafting = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Formulario con datos completos de las partes
  const [formData, setFormData] = useState({
    tipo_documento: "demanda",
    materia: "civil",
    hechos: "",
    pretension: "",
    // Demandante
    demandante_nombre: "",
    demandante_nacionalidad: "dominicano",
    demandante_estado_civil: "",
    demandante_cedula: "",
    demandante_domicilio: "",
    // Abogado Apoderado
    abogado_nombre: "",
    abogado_cedula: "",
    abogado_matricula: "",
    abogado_direccion: "",
    abogado_telefono: "",
    abogado_email: "",
    firma_apoderada: "",
    firma_rnc: "",
    // Demandado
    demandado_nombre: "",
    demandado_domicilio: "",
    // Acto y tribunal
    acto_numero: "",
    acto_folios: "",
    acto_año: "",
    ciudad_actuacion: "",
    alguacil_designacion: "",
    juzgado: "",
    legislacion: "",
    jurisprudencia: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Grabación de audio
  const startRecording = async () => {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error('Entorno no soportado');
      }
      if (typeof MediaRecorder === 'undefined') {
        toast({
          title: 'Dictado no soportado',
          description: 'Tu navegador no soporta grabación de audio.',
          variant: 'destructive',
        });
        return;
      }

      const getBestMimeType = () => {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/mpeg'
        ];
        for (const t of candidates) {
          try { if ((MediaRecorder as any).isTypeSupported?.(t)) return t; } catch {}
        }
        return '';
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chosenType = getBestMimeType();
      if (!chosenType) {
        toast({
          title: 'Dictado no soportado',
          description: 'No se encontró un formato de audio compatible en este navegador.',
          variant: 'destructive',
        });
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: chosenType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || chosenType });
        await transcribeAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      toast({
        title: 'Grabando',
        description: 'Dicta la información del caso...',
      });
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      toast({
        title: 'Error',
        description: 'No se pudo acceder al micrófono',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convertir blob a base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio, mimeType: (audioBlob as any)?.type || 'audio/webm' },
          });

          if (error) {
            const msg = error.message || '';
            if (msg.includes('401')) {
              toast({
                title: "Configuración requerida",
                description: "La API de voz es inválida o no está configurada.",
                variant: "destructive",
              });
              return;
            }
            if (msg.includes('429')) {
              toast({
                title: "Límite de transcripción",
                description: "Has excedido el límite. Intenta más tarde.",
                variant: "destructive",
              });
              return;
            }
            throw error;
          }

          if (data?.error) {
            toast({
              title: "Error de voz",
              description: data.error,
              variant: "destructive",
            });
            return;
          }

          if (data?.text) {
            // Agregar texto transcrito al campo de hechos
            setFormData((prev) => ({
              ...prev,
              hechos: prev.hechos + (prev.hechos ? '\n\n' : '') + data.text,
            }));

            toast({
              title: "✓ Transcripción completa",
              description: `${data.text.length} caracteres agregados a los hechos`,
            });
          }
        } catch (err: any) {
          console.error('Error en transcripción:', err);
          toast({
            title: "Error",
            description: err?.message || "No se pudo transcribir el audio",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error('Error preparando transcripción:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el audio para transcripción",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  };

  // Generar documento con IA
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
            nombre: formData.firma_apoderada,
            rnc: formData.firma_rnc,
          },
          demandado: {
            nombre: formData.demandado_nombre,
            domicilio: formData.demandado_domicilio,
          },
          acto: {
            numero: formData.acto_numero,
            folios: formData.acto_folios,
            año: formData.acto_año,
          },
          ciudad_actuacion: formData.ciudad_actuacion,
          alguacil_designacion: formData.alguacil_designacion,
          juzgado: formData.juzgado,
          legislacion: formData.legislacion,
          jurisprudencia: formData.jurisprudencia,
        },
      });

      if (error) {
        // Manejo específico de errores
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: "Límite de solicitudes",
            description: "Has excedido el límite. Intenta en unos minutos.",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast({
            title: "Créditos agotados",
            description: "Por favor, recarga créditos en Configuración.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (data?.error) {
        toast({
          title: "Error de IA",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.documento) {
        setGeneratedDoc(data.documento);
        
        // Guardar documento en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === formData.tipo_documento)?.label || formData.tipo_documento;
          const materiaLabel = MATERIAS_JURIDICAS.find(m => m.value === formData.materia)?.label || formData.materia;
          
          await supabase.from("legal_documents").insert({
            user_id: user.id,
            tipo_documento: formData.tipo_documento,
            materia: formData.materia,
            titulo: `${tipoLabel} - ${formData.demandante_nombre || 'Sin demandante'} vs ${formData.demandado_nombre || 'Sin demandado'}`,
            contenido: data.documento,
            demandante_nombre: formData.demandante_nombre,
            demandado_nombre: formData.demandado_nombre,
            juzgado: formData.juzgado,
          });
        }
        
        toast({
          title: "✓ Documento generado",
          description: "Tu acción jurídica ha sido redactada y guardada",
        });
      }
    } catch (error: any) {
      console.error('Error generando documento:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el documento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDoc);
      toast({
        title: "✓ Copiado",
        description: "Documento copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async () => {
    try {
      // Importar docx dinámicamente
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');
      
      // Dividir el documento en párrafos
      const paragraphs = generatedDoc.split('\n').map(line => {
        const trimmed = line.trim();
        
        // Detectar títulos (líneas que terminan con : o están en mayúsculas)
        const isHeading = trimmed.endsWith(':') || (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100);
        
        if (trimmed.length === 0) {
          return new Paragraph({ text: '' });
        }
        
        return new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: isHeading,
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            after: 120,
          },
          heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        });
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: 12240, // Letter width in twips (8.5")
                height: 15840, // Letter height in twips (11")
              },
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      
      const tipoDoc = TIPOS_DOCUMENTO.find(t => t.value === formData.tipo_documento)?.label || formData.tipo_documento;
      const fecha = new Date().toLocaleDateString('es-DO').replace(/\//g, '-');
      element.download = `${tipoDoc}_${formData.materia}_${fecha}.docx`;
      
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: "✓ Descargado",
        description: "Documento Word guardado exitosamente",
      });
    } catch (error) {
      console.error('Error generando Word:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento Word",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Redacción Asistida por IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera documentos jurídicos profesionales con inteligencia artificial
          </p>
        </div>
        <Badge variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          IA Jurídica RD
        </Badge>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Formulario</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Tipo de Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tipo_documento">Tipo de Acción</Label>
                  <Select
                    value={formData.tipo_documento}
                    onValueChange={(value) =>
                      handleInputChange("tipo_documento", value)
                    }
                  >
                    <SelectTrigger id="tipo_documento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="materia">Materia</Label>
                  <Select
                    value={formData.materia}
                    onValueChange={(value) => handleInputChange("materia", value)}
                  >
                    <SelectTrigger id="materia">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAS_JURIDICAS.map((materia) => (
                        <SelectItem key={materia.value} value={materia.value}>
                          {materia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="juzgado">Juzgado</Label>
                  <Input
                    id="juzgado"
                    placeholder="Ej: Primera Instancia DN"
                    value={formData.juzgado}
                    onChange={(e) => handleInputChange("juzgado", e.target.value)}
                  />
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
                    <Label htmlFor="acto_numero">No. Acto</Label>
                    <Input
                      id="acto_numero"
                      placeholder="Número"
                      value={formData.acto_numero}
                      onChange={(e) => handleInputChange("acto_numero", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="acto_folios">Folios</Label>
                    <Input
                      id="acto_folios"
                      placeholder="Ej: 1-5"
                      value={formData.acto_folios}
                      onChange={(e) => handleInputChange("acto_folios", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="acto_año">Año</Label>
                    <Input
                      id="acto_año"
                      placeholder="2025"
                      value={formData.acto_año}
                      onChange={(e) => handleInputChange("acto_año", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ciudad_actuacion">Ciudad de la Actuación</Label>
                  <Input
                    id="ciudad_actuacion"
                    placeholder="Ej: Santo Domingo"
                    value={formData.ciudad_actuacion}
                    onChange={(e) => handleInputChange("ciudad_actuacion", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="alguacil_designacion">Designación del Alguacil</Label>
                  <Textarea
                    id="alguacil_designacion"
                    placeholder="Ej: Yo, Juan Pérez, Alguacil Ordinario de la Primera Sala..."
                    rows={2}
                    value={formData.alguacil_designacion}
                    onChange={(e) => handleInputChange("alguacil_designacion", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Demandante / Requeriente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="demandante_nombre">Nombre Completo</Label>
                  <Input
                    id="demandante_nombre"
                    placeholder="Ej: Dr. Carlos Manuel Ventura Mota"
                    value={formData.demandante_nombre}
                    onChange={(e) => handleInputChange("demandante_nombre", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="demandante_nacionalidad">Nacionalidad</Label>
                    <Input
                      id="demandante_nacionalidad"
                      placeholder="dominicano"
                      value={formData.demandante_nacionalidad}
                      onChange={(e) => handleInputChange("demandante_nacionalidad", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="demandante_estado_civil">Estado Civil</Label>
                    <Input
                      id="demandante_estado_civil"
                      placeholder="casado"
                      value={formData.demandante_estado_civil}
                      onChange={(e) => handleInputChange("demandante_estado_civil", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="demandante_cedula">Cédula</Label>
                  <Input
                    id="demandante_cedula"
                    placeholder="001-0090265-9"
                    value={formData.demandante_cedula}
                    onChange={(e) => handleInputChange("demandante_cedula", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="demandante_domicilio">Domicilio</Label>
                  <Textarea
                    id="demandante_domicilio"
                    placeholder="Ave. Lope de Vega No. 108, Apto. 203, Ens. Piantini..."
                    rows={2}
                    value={formData.demandante_domicilio}
                    onChange={(e) => handleInputChange("demandante_domicilio", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Firma Apoderada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="firma_apoderada">Nombre de la Firma</Label>
                  <Input
                    id="firma_apoderada"
                    placeholder="Firma Internacional de Abogados Ventura & Mota, S.A."
                    value={formData.firma_apoderada}
                    onChange={(e) => handleInputChange("firma_apoderada", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="firma_rnc">RNC</Label>
                  <Input
                    id="firma_rnc"
                    placeholder="000-00000-0"
                    value={formData.firma_rnc}
                    onChange={(e) => handleInputChange("firma_rnc", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Abogado Apoderado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="abogado_nombre">Nombre Completo</Label>
                  <Input
                    id="abogado_nombre"
                    placeholder="Dr. Carlos Manuel Ventura Mota"
                    value={formData.abogado_nombre}
                    onChange={(e) => handleInputChange("abogado_nombre", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="abogado_cedula">Cédula</Label>
                    <Input
                      id="abogado_cedula"
                      placeholder="001-0090265-9"
                      value={formData.abogado_cedula}
                      onChange={(e) => handleInputChange("abogado_cedula", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="abogado_matricula">Matrícula</Label>
                    <Input
                      id="abogado_matricula"
                      placeholder="7002-20-89"
                      value={formData.abogado_matricula}
                      onChange={(e) => handleInputChange("abogado_matricula", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="abogado_direccion">Dirección del Despacho</Label>
                  <Textarea
                    id="abogado_direccion"
                    placeholder="Ave. Lope de Vega No. 108, Apto. 203..."
                    rows={2}
                    value={formData.abogado_direccion}
                    onChange={(e) => handleInputChange("abogado_direccion", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="abogado_telefono">Teléfono</Label>
                    <Input
                      id="abogado_telefono"
                      placeholder="809-000-0000"
                      value={formData.abogado_telefono}
                      onChange={(e) => handleInputChange("abogado_telefono", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="abogado_email">Email</Label>
                    <Input
                      id="abogado_email"
                      type="email"
                      placeholder="abogado@firma.com"
                      value={formData.abogado_email}
                      onChange={(e) => handleInputChange("abogado_email", e.target.value)}
                    />
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
                  <Label htmlFor="demandado_nombre">Nombre Completo</Label>
                  <Input
                    id="demandado_nombre"
                    placeholder="Nombre del demandado"
                    value={formData.demandado_nombre}
                    onChange={(e) => handleInputChange("demandado_nombre", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="demandado_domicilio">Domicilio</Label>
                  <Textarea
                    id="demandado_domicilio"
                    placeholder="Dirección completa del demandado"
                    rows={2}
                    value={formData.demandado_domicilio}
                    onChange={(e) => handleInputChange("demandado_domicilio", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hechos del Caso</CardTitle>
              <div className="flex gap-2">
                {isTranscribing ? (
                  <Button size="sm" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transcribiendo...
                  </Button>
                ) : isRecording ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Detener
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startRecording}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Dictar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hechos">Descripción de los Hechos</Label>
                <Textarea
                  id="hechos"
                  placeholder="Describe detalladamente los hechos del caso..."
                  rows={6}
                  value={formData.hechos}
                  onChange={(e) => handleInputChange("hechos", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Puedes escribir o usar el botón "Dictar" para hablar
                </p>
              </div>

              <div>
                <Label htmlFor="pretension">Pretensión</Label>
                <Textarea
                  id="pretension"
                  placeholder="¿Qué solicitas al tribunal?"
                  rows={3}
                  value={formData.pretension}
                  onChange={(e) =>
                    handleInputChange("pretension", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Fundamentos Legales (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="legislacion">Legislación Aplicable</Label>
                <Textarea
                  id="legislacion"
                  placeholder="Ej: Artículos del Código Civil, Leyes específicas..."
                  rows={2}
                  value={formData.legislacion}
                  onChange={(e) =>
                    handleInputChange("legislacion", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="jurisprudencia">Jurisprudencia Relevante</Label>
                <Textarea
                  id="jurisprudencia"
                  placeholder="Ej: SCJ-3ra-2020-123..."
                  rows={2}
                  value={formData.jurisprudencia}
                  onChange={(e) =>
                    handleInputChange("jurisprudencia", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={generateDocument}
              disabled={isGenerating}
              className="gap-2"
              size="lg"
            >
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
        </TabsContent>

        <TabsContent value="preview">
          <Card className="shadow-medium min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documento Generado</CardTitle>
              {generatedDoc && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDocument}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedDoc ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                    {generatedDoc}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    No hay documento generado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Completa el formulario y genera tu acción jurídica
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AILegalDrafting;
