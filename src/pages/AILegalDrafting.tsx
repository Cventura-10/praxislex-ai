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

  // Formulario
  const [formData, setFormData] = useState({
    tipo_documento: "demanda",
    materia: "civil",
    hechos: "",
    pretension: "",
    demandante: "",
    demandado: "",
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      toast({
        title: "Grabando",
        description: "Dicta la información del caso...",
      });
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
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
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data?.text) {
          // Agregar texto transcrito al campo de hechos
          setFormData((prev) => ({
            ...prev,
            hechos: prev.hechos + (prev.hechos ? '\n\n' : '') + data.text,
          }));

          toast({
            title: "Transcripción completa",
            description: "El texto ha sido agregado a los hechos",
          });
        }
      };
    } catch (error) {
      console.error('Error en transcripción:', error);
      toast({
        title: "Error",
        description: "No se pudo transcribir el audio",
        variant: "destructive",
      });
    } finally {
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
          partes: {
            demandante: formData.demandante,
            demandado: formData.demandado,
          },
          juzgado: formData.juzgado,
          legislacion: formData.legislacion,
          jurisprudencia: formData.jurisprudencia,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.documento) {
        setGeneratedDoc(data.documento);
        toast({
          title: "Documento generado",
          description: "Tu acción jurídica ha sido redactada con IA",
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast({
      title: "Copiado",
      description: "Documento copiado al portapapeles",
    });
  };

  const downloadDocument = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDoc], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${formData.tipo_documento}_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Descargado",
      description: "Documento guardado exitosamente",
    });
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
                <CardTitle>Partes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="demandante">Demandante / Actor</Label>
                  <Input
                    id="demandante"
                    placeholder="Nombre del demandante"
                    value={formData.demandante}
                    onChange={(e) =>
                      handleInputChange("demandante", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="demandado">Demandado / Parte Contraria</Label>
                  <Input
                    id="demandado"
                    placeholder="Nombre del demandado"
                    value={formData.demandado}
                    onChange={(e) =>
                      handleInputChange("demandado", e.target.value)
                    }
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
