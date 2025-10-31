import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Download, Eye, Lock, Unlock, Plus, Minus, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { DocumentViewer } from "@/components/DocumentViewer";
import type { LegalAct, LegalMatter, LegalCategory } from "@/lib/legalActsData";
import { useLawyers, type Lawyer } from "@/hooks/useLawyers";
import { useNotarios, type Notario } from "@/hooks/useNotarios";
import { useAlguaciles, type Alguacil } from "@/hooks/useAlguaciles";
import { usePeritos, type Perito } from "@/hooks/usePeritos";
import { useTasadores, type Tasador } from "@/hooks/useTasadores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { VoiceInput } from "@/components/VoiceInput";
import { formatearFechaJuridica, formatearEncabezadoFecha, completarJurisdiccion } from "@/lib/dateUtils";
import { 
  LawyerSelector, 
  NotarioSelector, 
  AlguacilSelector, 
  PeritoSelector, 
  TasadorSelector 
} from "./ProfessionalSelectors";
import { ClientSelector } from "./ClientSelector";

interface IntakeFormFlowProps {
  actInfo: {
    category: LegalCategory;
    matter: LegalMatter;
    act: LegalAct;
  };
}

// ================================================================
// SISTEMA DE CLASIFICACIÓN Y FILTRADO DE CAMPOS
// ================================================================

/**
 * Determina si un acto es de tipo judicial (procesal)
 */
const isJudicialActType = (actId: string): boolean => {
  const judicialTypes = [
    'demanda_civil', 'emplazamiento', 'conclusiones', 'acto_apelacion',
    'mandamiento_pago', 'embargo_ejecutivo', 'referimiento', 'desalojo',
    'querella_actor_civil', 'acto_acusacion', 'medidas_coercion',
    'demanda_laboral', 'citacion_laboral', 'contencioso_administrativo',
    'recurso_anulacion', 'amparo', 'particion_bienes', 'deslinde',
    'saneamiento_titulo', 'reivindicacion'
  ];
  return judicialTypes.includes(actId);
};

/**
 * Determina si un acto es de tipo extrajudicial (contractual/comunicativo)
 */
const isExtrajudicialActType = (actId: string): boolean => {
  const extrajudicialTypes = [
    'contrato_venta_inmueble', 'contrato_venta_mueble', 'contrato_venta', 'contrato_alquiler', 'poder_general', 'poder_especial',
    'testamento', 'declaracion_jurada', 'intimacion_pago', 'notificacion_desalojo',
    'carta_cobranza', 'contrato_trabajo', 'carta_despido', 'carta_renuncia',
    'acta_conciliacion', 'solicitud_admin', 'recurso_reconsideracion'
  ];
  return extrajudicialTypes.includes(actId);
};

// Campos para actos JUDICIALES (demandas, recursos, etc.)
const JUDICIAL_FIELDS = [
  { key: "demandante_nombre", label: "Demandante - Nombre Completo", type: "text", required: true },
  { key: "demandante_cedula", label: "Cédula/RNC", type: "text" },
  { key: "demandante_domicilio", label: "Domicilio", type: "textarea" },
  { key: "demandado_nombre", label: "Demandado - Nombre/Razón Social", type: "text", required: true },
  { key: "demandado_cedula", label: "Cédula/RNC", type: "text" },
  { key: "demandado_domicilio", label: "Domicilio", type: "textarea" },
  { key: "abogado_nombre", label: "Abogado - Nombre Completo", type: "text", required: true },
  { key: "abogado_matricula", label: "Matrícula", type: "text", required: true },
  { key: "abogado_cedula", label: "Cédula", type: "text", required: true },
  { key: "tribunal_nombre", label: "Tribunal/Juzgado", type: "text", required: true },
  { key: "tribunal_ubicacion", label: "Ubicación del Tribunal", type: "textarea" },
  { key: "objeto", label: "Objeto de la acción", type: "textarea", required: true },
  { key: "hechos", label: "Hechos (descripción cronológica)", type: "textarea", required: true },
  { key: "fundamentos", label: "Fundamentos de derecho", type: "textarea" },
  { key: "pretensiones", label: "Pretensiones/Dispositivos", type: "textarea", required: true },
  { key: "monto", label: "Cuantía (si aplica)", type: "text" },
  { key: "anexos", label: "Documentos anexos", type: "textarea" },
];

// Campos para actos EXTRAJUDICIALES (contratos, cartas, intimaciones)
// ⚠️ IMPORTANTE: NO usar términos judiciales (Demandante, Demandado, Tribunal)
const EXTRAJUDICIAL_FIELDS = [
  // Encabezado del acto
  { key: "lugar_ciudad", label: "Ciudad", type: "text", required: true },
  { key: "lugar_provincia", label: "Provincia", type: "text" },
  { key: "fecha_texto", label: "Fecha", type: "text", required: true },
  
  // Primera Parte (según tipo de acto: Vendedor, Arrendador, Poderdante, Intimante, etc.)
  { key: "primera_parte_nombre", label: "Primera Parte - Nombre Completo", type: "text", required: true },
  { key: "primera_parte_cedula", label: "Primera Parte - Cédula/RNC", type: "text", required: true },
  { key: "primera_parte_nacionalidad", label: "Primera Parte - Nacionalidad", type: "text" },
  { key: "primera_parte_estado_civil", label: "Primera Parte - Estado Civil", type: "text" },
  { key: "primera_parte_profesion", label: "Primera Parte - Profesión/Ocupación", type: "text" },
  { key: "primera_parte_domicilio", label: "Primera Parte - Domicilio", type: "textarea", required: true },
  
  // Segunda Parte (Comprador, Arrendatario, Apoderado, Intimado, etc.)
  { key: "segunda_parte_nombre", label: "Segunda Parte - Nombre Completo", type: "text", required: true },
  { key: "segunda_parte_cedula", label: "Segunda Parte - Cédula/RNC", type: "text", required: true },
  { key: "segunda_parte_nacionalidad", label: "Segunda Parte - Nacionalidad", type: "text" },
  { key: "segunda_parte_estado_civil", label: "Segunda Parte - Estado Civil", type: "text" },
  { key: "segunda_parte_profesion", label: "Segunda Parte - Profesión/Ocupación", type: "text" },
  { key: "segunda_parte_domicilio", label: "Segunda Parte - Domicilio", type: "textarea", required: true },
  
  // Abogado Redactor (opcional en extrajudiciales)
  { key: "abogado_nombre", label: "Abogado Redactor - Nombre Completo", type: "text" },
  { key: "abogado_matricula", label: "Matrícula CARD", type: "text" },
  { key: "abogado_cedula", label: "Cédula", type: "text" },
  
  // Objeto del acto y cláusulas
  { key: "objeto_acto", label: "Objeto del Acto (bien, servicio, poder, etc.)", type: "textarea", required: true },
  { key: "descripcion_detallada", label: "Descripción Detallada", type: "textarea", required: true },
  
  // CAMPOS ESPECÍFICOS PARA COMPRAVENTA INMOBILIARIA
  { key: "inmueble_matricula", label: "Matrícula del Inmueble", type: "text" },
  { key: "inmueble_descripcion", label: "Descripción Completa del Inmueble (unidad, ubicación, áreas)", type: "textarea" },
  { key: "inmueble_superficie", label: "Superficie del Inmueble (m²)", type: "text" },
  { key: "inmueble_porcentaje_participacion", label: "Porcentaje de Participación", type: "text" },
  { key: "certificado_titulo_fecha", label: "Fecha del Certificado de Título", type: "date" },
  { key: "registrador_titulo", label: "Registrador de Títulos que Expidió", type: "text" },
  
  // Precio y pagos
  { key: "precio_monto", label: "Precio/Monto (si aplica)", type: "text" },
  { key: "precio_letras", label: "Precio en Letras", type: "text" },
  { key: "forma_pago", label: "Forma de Pago", type: "textarea" },
  { key: "clausulas_especiales", label: "Cláusulas Especiales", type: "textarea" },
  { key: "plazo_vigencia", label: "Plazo de Vigencia", type: "text" },
  { key: "gastos_asume", label: "Gastos Asumidos Por", type: "text" },
  { key: "jurisdiccion", label: "Jurisdicción/Fuero", type: "text", required: true },
  
  // DATOS DEL NOTARIO (para coletilla notarial)
  { key: "notario_nombre", label: "Notario - Nombre Completo", type: "text" },
  { key: "notario_matricula", label: "Notario - Matrícula CDN", type: "text" },
  { key: "notario_cedula", label: "Notario - Cédula", type: "text" },
  { key: "notario_oficina", label: "Notario - Oficina Profesional", type: "textarea" },
  { key: "notario_jurisdiccion", label: "Notario - Jurisdicción (Números/Distrito)", type: "text" },
  { key: "fecha_texto", label: "Fecha en Texto (ej: veintiocho (28) días del mes de julio del año Dos Mil Veinticinco (2025))", type: "text" },
];

export function IntakeFormFlow({ actInfo }: IntakeFormFlowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lawyers, loading: loadingLawyers } = useLawyers();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados para profesionales seleccionados
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [selectedNotario, setSelectedNotario] = useState<Notario | null>(null);
  const [selectedAlguacil, setSelectedAlguacil] = useState<Alguacil | null>(null);
  const [selectedPerito, setSelectedPerito] = useState<Perito | null>(null);
  const [selectedTasador, setSelectedTasador] = useState<Tasador | null>(null);
  
  // Estados para clientes seleccionados
  const [selectedDemandante, setSelectedDemandante] = useState<string | null>(null);
  const [selectedDemandado, setSelectedDemandado] = useState<string | null>(null);
  const [selectedPrimeraParte, setSelectedPrimeraParte] = useState<string | null>(null);
  const [selectedSegundaParte, setSelectedSegundaParte] = useState<string | null>(null);
  
  // Nuevos estados para múltiples partes
  const [numVendedores, setNumVendedores] = useState(1);
  const [numCompradores, setNumCompradores] = useState(1);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  
  // Auto-generar fecha en formato jurídico al cargar
  useEffect(() => {
    const hoy = new Date();
    const fechaJuridica = formatearFechaJuridica(hoy);
    setFormData(prev => ({
      ...prev,
      fecha_texto: fechaJuridica
    }));
  }, []);
  
  // Auto-completar jurisdicción cuando cambia la ciudad
  useEffect(() => {
    if (formData.lugar_ciudad) {
      const jurisdiccion = completarJurisdiccion(formData.lugar_ciudad);
      setFormData(prev => ({
        ...prev,
        jurisdiccion
      }));
    }
  }, [formData.lugar_ciudad]);

  // Seleccionar campos según tipo de acto (CON VALIDACIÓN DE SEGURIDAD)
  const isJudicial = isJudicialActType(actInfo.act.id);
  const isExtrajudicial = isExtrajudicialActType(actInfo.act.id);
  
  // Log de seguridad
  if (!isJudicial && !isExtrajudicial) {
    console.warn(`⚠️ SEGURIDAD: Acto ${actInfo.act.id} no clasificado. Revisar catálogo.`);
  }
  
  const activeFields = isJudicial ? JUDICIAL_FIELDS : EXTRAJUDICIAL_FIELDS;

  // Agrupar campos en pasos (cada 5 campos)
  const fieldsPerStep = 5;
  const totalSteps = Math.ceil(activeFields.length / fieldsPerStep);
  const currentFields = activeFields.slice(
    currentStep * fieldsPerStep,
    (currentStep + 1) * fieldsPerStep
  );

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldsUpdate = (fields: Record<string, string>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const canProceedToNext = () => {
    return currentFields.every(
      (field) => !field.required || (formData[field.key] && formData[field.key].trim())
    );
  };

  const handleNext = () => {
    if (!canProceedToNext()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGenerate = async () => {
    if (!canProceedToNext()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // ⚠️ SEGURIDAD CRÍTICA: Validar que campos judiciales NO se usen en actos extrajudiciales
      const judicialFieldKeys = [
        'demandante_nombre', 'demandante_cedula', 'demandante_domicilio',
        'demandado_nombre', 'demandado_cedula', 'demandado_domicilio',
        'tribunal_nombre', 'tribunal_ubicacion', 'numero_acto', 'numero_expediente',
        'juzgado', 'hechos', 'pretensiones', 'fundamentos'
      ];
      
      if (isExtrajudicial) {
        const forbiddenFields = judicialFieldKeys.filter(key => formData[key] && formData[key].trim());
        if (forbiddenFields.length > 0) {
          throw new Error(`❌ ERROR DE VALIDACIÓN: Los campos judiciales "${forbiddenFields.join(', ')}" no pueden usarse en actos extrajudiciales. Este acto es de tipo "${actInfo.act.name}" (extrajudicial). Por favor revisa el formulario.`);
        }
      }

      // Generar documento con IA
      console.log("Enviando datos al generador:", {
        actType: actInfo.act.id,
        actName: actInfo.act.name,
        materia: actInfo.matter.name.toLowerCase(),
        formData
      });

      const { data, error } = await supabase.functions.invoke("generate-legal-doc", {
        body: {
          actType: actInfo.act.id,
          tipo_documento: actInfo.act.id,
          actName: actInfo.act.name,
          materia: actInfo.matter.name.toLowerCase(),
          category: actInfo.category.name,
          categoryType: actInfo.category.type,
          formData: formData,
        },
      });

      console.log("Response from edge function:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Error al comunicarse con el servicio de generación");
      }

      if (!data) {
        throw new Error("No se recibió respuesta del servicio");
      }

      // Extraer contenido del response (soporta múltiples formatos)
      let generatedContent = data?.contenido || data?.cuerpo || data?.document || data?.content || "";
      
      // Si el contenido viene envuelto en markdown code blocks, extraerlo
      if (generatedContent.startsWith('```') && generatedContent.endsWith('```')) {
        // Remover los code blocks de markdown
        generatedContent = generatedContent
          .replace(/^```[a-z]*\n?/, '') // Remover apertura (```text, ```html, etc.)
          .replace(/\n?```$/, '')       // Remover cierre
          .trim();
      }
      
      if (!generatedContent || generatedContent.length < 50) {
        console.error("Response data:", data);
        throw new Error("No se generó contenido del documento válido");
      }
      
      setGeneratedDocument(generatedContent);
      
      toast({
        title: "✓ Documento generado",
        description: "Revisa el documento y guárdalo en tu repositorio cuando estés listo.",
      });
    } catch (error: any) {
      console.error("Error generating document:", error);
      const errorMessage = error?.message || error?.error?.message || "No se pudo generar el documento.";
      toast({
        title: "Error al generar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToRepository = async () => {
    if (!generatedDocument) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // ⚠️ SEGURIDAD: Guardar solo campos correspondientes al tipo de acto
      let insertData;
      
      if (isJudicial) {
        insertData = {
          user_id: user.id,
          tipo_documento: actInfo.act.id,
          materia: actInfo.matter.name,
          titulo: `${actInfo.act.name} - ${formData.demandante_nombre || 'N/D'} vs ${formData.demandado_nombre || 'N/D'}`,
          contenido: generatedDocument,
          demandante_nombre: formData.demandante_nombre || null,
          demandado_nombre: formData.demandado_nombre || null,
          juzgado: formData.tribunal_nombre || null,
          numero_expediente: formData.numero_expediente || null,
          case_number: formData.case_number || null,
        };
      } else {
        // Extrajudicial - NO incluir campos judiciales
        insertData = {
          user_id: user.id,
          tipo_documento: actInfo.act.id,
          materia: actInfo.matter.name,
          titulo: `${actInfo.act.name} - ${formData.primera_parte_nombre || formData.segunda_parte_nombre || 'N/D'}`,
          contenido: generatedDocument,
        };
      }

      const { data: savedDoc, error: saveError } = await supabase
        .from("legal_documents")
        .insert(insertData)
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "✓ Guardado",
        description: "El documento ha sido guardado en tu repositorio.",
      });
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el documento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (generatedDocument) {
    return (
      <div className="space-y-6">
        {/* Vista previa del documento */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 text-primary" />
                  Vista Previa - {actInfo.act.name}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Documento generado exitosamente. Revisa el contenido antes de descargar.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="h-fit">Generado con IA</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-white dark:bg-gray-900 border-x">
              <DocumentViewer 
                content={generatedDocument}
                title={actInfo.act.name}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información del documento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalles del Documento</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            {isJudicial ? (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">Demandante</p>
                  <p className="font-medium">{formData.demandante_nombre || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Demandado</p>
                  <p className="font-medium">{formData.demandado_nombre || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tribunal</p>
                  <p className="font-medium">{formData.tribunal_nombre || "No especificado"}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground mb-1">Primera Parte</p>
                  <p className="font-medium">{formData.primera_parte_nombre || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Segunda Parte</p>
                  <p className="font-medium">{formData.segunda_parte_nombre || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Objeto del Acto</p>
                  <p className="font-medium">{formData.objeto_acto || "No especificado"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Acciones */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => setGeneratedDocument(null)}
          >
            ← Editar Datos
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveToRepository}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar en Repositorio"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedDocument);
                toast({
                  title: "✓ Copiado",
                  description: "Documento copiado al portapapeles.",
                });
              }}
            >
              Copiar Texto
            </Button>
            <Button onClick={async () => {
              try {
                const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');
                
                const doc = new Document({
                  sections: [{
                    properties: {},
                    children: [
                      new Paragraph({
                        text: actInfo.act.name,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                      }),
                      ...(isJudicial ? [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "DEMANDANTE: ",
                              bold: true,
                            }),
                            new TextRun(formData.demandante_nombre || "N/D"),
                          ],
                          spacing: { after: 200 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "DEMANDADO: ",
                              bold: true,
                            }),
                            new TextRun(formData.demandado_nombre || "N/D"),
                          ],
                          spacing: { after: 200 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "TRIBUNAL: ",
                              bold: true,
                            }),
                            new TextRun(formData.tribunal_nombre || "N/D"),
                          ],
                          spacing: { after: 400 },
                        }),
                      ] : [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "VENDEDOR: ",
                              bold: true,
                            }),
                            new TextRun(formData.vendedor_nombre || "N/D"),
                          ],
                          spacing: { after: 200 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "COMPRADOR: ",
                              bold: true,
                            }),
                            new TextRun(formData.comprador_nombre || "N/D"),
                          ],
                          spacing: { after: 200 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "PRECIO: ",
                              bold: true,
                            }),
                            new TextRun(formData.precio_monto || "N/D"),
                          ],
                          spacing: { after: 400 },
                        }),
                      ]),
                      ...generatedDocument.split('\n').map(line => 
                        new Paragraph({
                          text: line,
                          spacing: { after: 100 },
                        })
                      ),
                    ],
                  }],
                });

                const blob = await Packer.toBlob(doc);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const nombreParte = isJudicial 
                  ? formData.demandante_nombre 
                  : formData.vendedor_nombre || formData.comprador_nombre;
                const fileName = `${new Date().toISOString().split('T')[0]}_${actInfo.act.id}_${nombreParte?.replace(/\s+/g, '_') || 'documento'}.docx`;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);

                toast({
                  title: "✓ Descargado",
                  description: "Documento descargado en formato Word.",
                });
              } catch (error) {
                console.error("Error downloading:", error);
                toast({
                  title: "Error",
                  description: "No se pudo descargar el documento.",
                  variant: "destructive",
                });
              }
            }} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Word
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Paso {currentStep + 1} de {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Selector de Abogado */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Abogado Responsable (Opcional)</span>
            </CardTitle>
            <CardDescription>
              Selecciona un abogado para autocompletar sus datos, o déjalos vacíos para ingresarlos manualmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lawyers.length > 0 && (
              <LawyerSelector
                value={selectedLawyer?.id || null}
                onChange={setSelectedLawyer}
                onFieldUpdate={handleFieldsUpdate}
              />
            )}
            
            {selectedLawyer && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Datos Autocompletados</Label>
                <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                  <p className="text-sm"><strong>Nombre:</strong> {formData.abogado_nombre}</p>
                  <p className="text-sm"><strong>Cédula:</strong> {formData.abogado_cedula || 'No especificada'}</p>
                  <p className="text-sm"><strong>Email:</strong> {formData.abogado_email || 'No especificado'}</p>
                  <p className="text-sm"><strong>Teléfono:</strong> {formData.abogado_telefono || 'No especificado'}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Estos datos son editables en los pasos siguientes
                </p>
              </div>
            )}
            
            {lawyers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay abogados registrados. Los datos se ingresarán manualmente en los campos del formulario.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del {actInfo.act.name}</CardTitle>
          <CardDescription>
            Completa los siguientes campos para generar el documento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector de Demandante/Primera Parte (si el primer campo es de demandante) */}
          {currentStep === 0 && (isJudicial ? 
            currentFields.some(f => f.key === 'demandante_nombre') :
            currentFields.some(f => f.key === 'primera_parte_nombre')
          ) && (
            <ClientSelector
              label={isJudicial ? "Demandante" : "Primera Parte"}
              fieldPrefix={isJudicial ? "demandante" : "primera_parte"}
              value={isJudicial ? selectedDemandante : selectedPrimeraParte}
              onChange={isJudicial ? setSelectedDemandante : setSelectedPrimeraParte}
              onFieldUpdate={handleFieldsUpdate}
              required={true}
            />
          )}

          {/* Selector de Demandado/Segunda Parte (si aparece en campos actuales) */}
          {(isJudicial ? 
            currentFields.some(f => f.key === 'demandado_nombre') :
            currentFields.some(f => f.key === 'segunda_parte_nombre')
          ) && (
            <ClientSelector
              label={isJudicial ? "Demandado" : "Segunda Parte"}
              fieldPrefix={isJudicial ? "demandado" : "segunda_parte"}
              value={isJudicial ? selectedDemandado : selectedSegundaParte}
              onChange={isJudicial ? setSelectedDemandado : setSelectedSegundaParte}
              onFieldUpdate={handleFieldsUpdate}
              required={true}
            />
          )}

          {currentFields.map((field) => {
            const isLawyerField = field.key.startsWith('abogado_');
            
            // Ocultar campos de cliente que ya se autocompletaron
            const isClientField = (
              field.key.startsWith('demandante_') || 
              field.key.startsWith('demandado_') ||
              field.key.startsWith('primera_parte_') || 
              field.key.startsWith('segunda_parte_')
            );
            
            // Si el campo ya está autocompletado y tiene valor, mostrar solo como lectura
            if (isClientField && formData[field.key]) {
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="bg-muted/30"
                  />
                  <p className="text-xs text-muted-foreground">✓ Autocompletado desde cliente</p>
                </div>
              );
            }
            
            // Si es un campo de cliente sin valor, permitir entrada manual
            if (isClientField && !formData[field.key]) {
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.key}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      rows={4}
                      className="resize-none"
                      placeholder="Ingrese manualmente o seleccione cliente arriba"
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder="Ingrese manualmente o seleccione cliente arriba"
                    />
                  )}
                </div>
              );
            }
            
            return (
              <div key={field.key} className="space-y-2">
                {isLawyerField && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Unlock className="h-3 w-3" />
                    Campo opcional - editable manualmente
                  </div>
                )}
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button onClick={handleNext}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Documento
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
