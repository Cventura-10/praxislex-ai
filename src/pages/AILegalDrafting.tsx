import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Sparkles, Loader2, Send, Download, ClipboardList, ArrowLeft, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MATERIAS_JURIDICAS, TIPOS_DOCUMENTO, TIPOS_ACCION_LEGAL } from "@/lib/constants";
import { generateLegalDocSchema } from "@/lib/validation";
import { VoiceInput } from "@/components/VoiceInput";
import { DocumentViewer } from "@/components/DocumentViewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useLawFirmProfile } from "@/hooks/useLawFirmProfile";

// =============================
// Tipos y esquemas Intake Forms
// =============================
type FieldType = "text" | "textarea" | "select" | "date" | "number" | "currency" | "checkbox";

type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  section?: string;
};

type Schema = {
  id: string;
  titulo: string;
  materia: string;
  accion: string;
  fields: Field[];
};

const SCHEMAS: Schema[] = [
  {
    id: "CIVIL_COBRO_PESOS",
    titulo: "Demanda en cobro de pesos",
    materia: "Civil",
    accion: "Demanda en cobro de pesos",
    fields: [
      { key: "demandante", label: "Demandante (nombre/RNC/cédula)", type: "text", required: true },
      { key: "demandado", label: "Demandado (nombre/RNC/cédula)", type: "text", required: true },
      { key: "abogadoNombre", label: "Abogado apoderado (nombre)", type: "text", required: true },
      { key: "abogadoColegio", label: "Matrícula/CARD", type: "text" },
      { key: "abogadoEstudio", label: "Estudio / Domicilio procesal", type: "text" },
      { key: "tribunal.nombre", label: "Tribunal competente", type: "text", required: true },
      { key: "tribunal.direccion", label: "Dirección del tribunal", type: "text" },
      { key: "objeto", label: "Objeto de la demanda (resumen)", type: "textarea", placeholder: "Cobro de RD$ X por incumplimiento/contrato…" },
      { key: "monto", label: "Cuantía reclamada (RD$)", type: "currency", required: true },
      { key: "hechos", label: "Hechos (cronológico)", type: "textarea", required: true, help: "Fechas, contratos, pagos, incumplimientos, comunicaciones, reconocimiento de deuda." },
      { key: "fundamentos", label: "Fundamentos de derecho y jurisprudencia", type: "textarea", help: "Cita artículos y 2+ sentencias con órgano, sala, número, fecha y URL." },
      { key: "pretensiones", label: "Pretensiones / Dispositivos", type: "textarea", placeholder: "Condenar al pago, intereses legales/comerciales, astreinte, costas…" },
      { key: "anexos", label: "Anexos / Pruebas", type: "textarea", help: "Contrato, recibos, estados de cuenta, certificaciones, comunicaciones." }
    ]
  },
  {
    id: "CONST_AMPARO",
    titulo: "Acción de amparo",
    materia: "Constitucional",
    accion: "Acción de amparo",
    fields: [
      { key: "demandante", label: "Accionante (nombre/cédula)", type: "text", required: true },
      { key: "demandado", label: "Accionado (órgano/funcionario/particular)", type: "text", required: true },
      { key: "abogadoNombre", label: "Abogado (nombre)", type: "text" },
      { key: "tribunal.nombre", label: "Juzgado apoderado (competente)", type: "text", required: true },
      { key: "derechosVulnerados", label: "Derechos fundamentales vulnerados", type: "textarea", required: true, help: "Enumera derechos y normas (Constitución, leyes orgánicas)." },
      { key: "hechos", label: "Hechos (detalle y urgencia)", type: "textarea", required: true },
      { key: "fundamentos", label: "Fundamentos (jurisprudencia constitucional)", type: "textarea", help: "Incluye 2+ citas vinculadas (TC/SCJ) con URL oficial." },
      { key: "pretensiones", label: "Pretensiones (ordenar, restituir, abstenerse)", type: "textarea", required: true },
      { key: "medidas", label: "Medida cautelar (si procede)", type: "textarea", placeholder: "Suspender efectos del acto impugnado…" },
      { key: "anexos", label: "Anexos (pruebas)", type: "textarea" }
    ]
  },
  {
    id: "CIVIL_REFERIMIENTO",
    titulo: "Referimiento (medida provisional)",
    materia: "Civil",
    accion: "Demanda en referimiento",
    fields: [
      { key: "demandante", label: "Solicitante (nombre/RNC/cédula)", type: "text", required: true },
      { key: "demandado", label: "Requerido (nombre/RNC/cédula)", type: "text", required: true },
      { key: "tribunal.nombre", label: "Juez de los referimientos competente", type: "text", required: true },
      { key: "urgencia", label: "Urgencia y peligro en la demora", type: "textarea", required: true },
      { key: "apariencia", label: "Apariencia de buen derecho (fumus boni iuris)", type: "textarea", required: true },
      { key: "medidas", label: "Medidas solicitadas (ordenanzas)", type: "textarea", required: true },
      { key: "fundamentos", label: "Fundamentos legales y jurisprudencia", type: "textarea", help: "Cita 2+ precedentes (SCJ) y base normativa (Ley 834-78)." },
      { key: "anexos", label: "Anexos / Soportes", type: "textarea" }
    ]
  },
  {
    id: "LAB_PRESTACIONES",
    titulo: "Prestaciones laborales",
    materia: "Laboral",
    accion: "Demanda en prestaciones laborales",
    fields: [
      { key: "demandante", label: "Trabajador (nombre/cédula)", type: "text", required: true },
      { key: "demandado", label: "Empleador (nombre/RNC)", type: "text", required: true },
      { key: "relacionLaboral", label: "Relación laboral (cargo, salario, fecha inicio/fin)", type: "textarea", required: true },
      { key: "motivoTerminacion", label: "Motivo de terminación (desahucio/despido/dimisión)", type: "select", options: ["Desahucio", "Despido", "Dimisión", "Otro"], required: true },
      { key: "monto", label: "Cuantía estimada (RD$)", type: "currency", required: true },
      { key: "hechos", label: "Hechos (cronología, pruebas)", type: "textarea", required: true },
      { key: "fundamentos", label: "Fundamentos (Código de Trabajo + jurisprudencia)", type: "textarea" },
      { key: "pretensiones", label: "Pretensiones (prestaciones, intereses, costas)", type: "textarea", required: true },
      { key: "anexos", label: "Anexos (contrato, nóminas, comunicaciones)", type: "textarea" }
    ]
  },
  {
    id: "INMO_DESLINDE",
    titulo: "Deslinde / Saneamiento",
    materia: "Inmobiliario — Jurisdicción de Tierras",
    accion: "Acción de deslinde / saneamiento",
    fields: [
      { key: "demandante", label: "Parte actora (nombre/RNC)", type: "text", required: true },
      { key: "demandado", label: "Parte demandada/colindantes", type: "textarea", required: true, help: "Identificar colindantes y parcelas afectadas." },
      { key: "inmueble", label: "Identificación inmueble (parcela, DC, matrícula)", type: "textarea", required: true },
      { key: "tribunal.nombre", label: "Tribunal de Tierras competente", type: "text", required: true },
      { key: "hechos", label: "Hechos y antecedentes registrales", type: "textarea", required: true },
      { key: "fundamentos", label: "Fundamentos (Ley 108-05 + jurisprudencia)", type: "textarea", required: true },
      { key: "pretensiones", label: "Pretensiones (deslinde/saneamiento, inscripción, medidas)", type: "textarea", required: true },
      { key: "anexos", label: "Anexos (planos, certificaciones RT, mensuras)", type: "textarea" }
    ]
  }
];

const FieldInput: React.FC<{ 
  field: Field; 
  value: any; 
  onChange: (v: any) => void;
}> = ({ field, value, onChange }) => {
  if (field.type === "textarea") {
    return (
      <Textarea
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={5}
        className="resize-none"
      />
    );
  }
  
  if (field.type === "select") {
    return (
      <Select value={String(value || "")} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona…" />
        </SelectTrigger>
        <SelectContent>
          {(field.options || []).map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  
  if (field.type === "checkbox") {
    return (
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={onChange}
      />
    );
  }
  
  return (
    <Input
      type={field.type === "currency" ? "number" : field.type}
      step={field.type === "number" || field.type === "currency" ? "any" : undefined}
      value={String(value || "")}
      onChange={(e) => onChange(
        field.type === "number" || field.type === "currency" 
          ? Number(e.target.value) 
          : e.target.value
      )}
      placeholder={field.placeholder}
    />
  );
};

const FieldRow: React.FC<{ 
  field: Field; 
  data: Record<string, any>; 
  setData: (k: string, v: any) => void;
}> = ({ field, data, setData }) => (
  <div className="space-y-2">
    <Label>
      {field.label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
    <FieldInput field={field} value={data[field.key]} onChange={(v) => setData(field.key, v)} />
    {field.help && (
      <p className="text-xs text-muted-foreground">{field.help}</p>
    )}
  </div>
);

const AILegalDrafting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: lawFirmProfile, loading: profileLoading } = useLawFirmProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [citations, setCitations] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [intakeMode, setIntakeMode] = useState<'manual' | 'structured'>('structured');
  
  // Estado para gestión de clientes
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Intake Forms state
  const [schemaId, setSchemaId] = useState<string>(SCHEMAS[0].id);
  const schema = useMemo(() => SCHEMAS.find(s => s.id === schemaId)!, [schemaId]);
  const [intakeData, setIntakeData] = useState<Record<string, any>>({ accion: schema.accion });

  // Formulario completo basado en el modelo de demanda
  const [formData, setFormData] = useState({
    // Tipo y materia
    tipo_documento: "demanda",
    materia: "civil",
    accion_legal: "",
    
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

  // Cargar lista de clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .order("nombre_completo");

        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error("Error cargando clientes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Auto-rellenar información de la firma legal cuando se carga el perfil
  useEffect(() => {
    if (lawFirmProfile && !profileLoading) {
      setFormData(prev => ({
        ...prev,
        firma_nombre: prev.firma_nombre || lawFirmProfile.nombre_firma || "",
        firma_rnc: prev.firma_rnc || lawFirmProfile.rnc || "",
        firma_domicilio: prev.firma_domicilio || lawFirmProfile.direccion || "",
        abogado_nombre: prev.abogado_nombre || lawFirmProfile.abogado_principal || "",
        abogado_matricula: prev.abogado_matricula || lawFirmProfile.matricula_card || "",
        abogado_direccion: prev.abogado_direccion || lawFirmProfile.direccion || "",
        abogado_telefono: prev.abogado_telefono || lawFirmProfile.telefono || "",
        abogado_email: prev.abogado_email || lawFirmProfile.email || "",
        ciudad_actuacion: prev.ciudad_actuacion || lawFirmProfile.ciudad || "",
        provincia: prev.provincia || lawFirmProfile.provincia || "",
      }));
    }
  }, [lawFirmProfile, profileLoading]);

  // Auto-rellenar información del cliente cuando se selecciona
  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (selectedClient) {
        // Determinar si es persona física (cédula) o jurídica (RNC)
        const isPersonaFisica = selectedClient.cedula_rnc?.includes('-') || 
                                (selectedClient.cedula_rnc?.length === 11 && !selectedClient.cedula_rnc.includes('-'));
        
        setFormData(prev => ({
          ...prev,
          demandante_nombre: selectedClient.nombre_completo || "",
          demandante_cedula: isPersonaFisica ? selectedClient.cedula_rnc || "" : "",
          demandante_domicilio: selectedClient.direccion || "",
          // Si es empresa/persona jurídica, llenamos también firma_rnc si no está lleno
          ...((!isPersonaFisica && selectedClient.cedula_rnc) ? {
            firma_rnc: prev.firma_rnc || selectedClient.cedula_rnc
          } : {})
        }));

        toast({
          title: "✓ Cliente cargado",
          description: `Datos de ${selectedClient.nombre_completo} aplicados al formulario`,
        });
      }
    }
  }, [selectedClientId, clients, toast]);

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
    // Comprehensive validation con mensajes más específicos
    const payload = {
      tipo_documento: formData.tipo_documento,
      materia: formData.materia,
      hechos: formData.hechos.trim(),
      pretension: formData.pretension.trim(),
      demandante_nombre: formData.demandante_nombre.trim(),
      abogado_nombre: formData.abogado_nombre.trim(),
      demandado_nombre: formData.demandado_nombre.trim(),
      juzgado: formData.juzgado.trim(),
    };

    const validationResult = generateLegalDocSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      const errorMessages = errors.map(err => `• ${err.path.join('.')}: ${err.message}`).join('\n');
      toast({
        title: "Formulario incompleto",
        description: errors.length > 1 
          ? `Por favor complete los siguientes campos:\n${errorMessages}`
          : errors[0].message,
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

      if (data?.documento || data?.cuerpo) {
        const docContent = data.documento || data.cuerpo;
        setGeneratedDoc(docContent);
        setCitations(data.citations || []);
        
        // Verificar política de citas
        if (!data.citations || data.citations.length < 2) {
          toast({
            title: "⚠ Citas insuficientes",
            description: "Se requieren al menos 2 citas verificables para exportar. Sugerimos revisar jurisprudencia.",
            variant: "destructive",
          });
        }
        
        // Guardar en base de datos
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const tipoLabel = TIPOS_DOCUMENTO.find(t => t.value === formData.tipo_documento)?.label || formData.tipo_documento;
          
          await supabase.from("legal_documents").insert({
            user_id: user.id,
            tipo_documento: formData.tipo_documento,
            materia: formData.materia,
            titulo: `${tipoLabel} - ${formData.demandante_nombre || 'N/D'} vs ${formData.demandado_nombre || 'N/D'}`,
            contenido: docContent,
            demandante_nombre: formData.demandante_nombre,
            demandado_nombre: formData.demandado_nombre,
            juzgado: formData.juzgado,
            numero_expediente: formData.expediente_judicial,
          });
        }
        
        toast({
          title: "✓ Documento generado",
          description: `Documento generado con ${data.citations?.length || 0} citas`,
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

  const searchJurisprudence = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('jurisprudence-search', {
        body: { 
          materia: formData.materia, 
          keywords: formData.hechos.substring(0, 100),
          limit: 5 
        }
      });

      if (error) throw error;

      toast({
        title: "✓ Jurisprudencia encontrada",
        description: `Se encontraron ${data?.length || 0} referencias`,
      });

      // Agregar las citas encontradas
      if (data && data.length > 0) {
        setCitations(prev => [...prev, ...data]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo buscar jurisprudencia",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async () => {
    if (citations.length < 2) {
      toast({
        title: "⚠ Exportación bloqueada",
        description: "Se requieren al menos 2 citas verificables para exportar",
        variant: "destructive",
      });
      return;
    }

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

      // Agregar citas al documento
      if (citations.length > 0) {
        paragraphs.push(
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: 'REFERENCIAS Y CITAS', bold: true, size: 26 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '', spacing: { after: 200 } })
        );

        citations.forEach((cit, idx) => {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `${idx + 1}. ${cit.organo} - ${cit.sala}`, bold: true, size: 22 })],
              spacing: { before: 120 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `   ${cit.num} (${cit.fecha})`, size: 22 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `   ${cit.url}`, size: 20, italics: true })],
              spacing: { after: 120 },
            })
          );
        });
      }

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

  const setIntakeField = (k: string, v: any) => setIntakeData((s) => ({ ...s, [k]: v }));

  const generateFromIntake = async () => {
    setIsGenerating(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('generate-legal-doc', {
        body: {
          tipo_documento: schema.titulo,
          materia: schema.materia.split('—')[0].trim(),
          hechos: intakeData.hechos || "",
          pretension: intakeData.pretensiones || "",
          demandante: { nombre: intakeData.demandante },
          abogado: {
            nombre: intakeData.abogadoNombre,
            matricula: intakeData.abogadoColegio,
            direccion: intakeData.abogadoEstudio
          },
          demandado: { nombre: intakeData.demandado },
          juzgado: intakeData["tribunal.nombre"]
        }
      });

      if (error) throw error;
      
      setGeneratedDoc(response.documento);
      setCitations(response.citations || []);
      
      if (!response.citations || response.citations.length < 2) {
        toast({
          title: "⚠ Citas insuficientes",
          description: "Se requieren al menos 2 citas verificables para exportar.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "✓ Documento generado",
        description: `Documento generado con ${response.citations?.length || 0} citas`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar con IA",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Formulario - Lado Izquierdo */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-6 pr-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Redacción Jurídica IA</h1>
              <p className="text-muted-foreground mt-1">
                Genera documentos profesionales con IA
              </p>
            </div>
          </div>

          <Tabs value={intakeMode} onValueChange={(v) => setIntakeMode(v as 'manual' | 'structured')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="structured" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Formularios Intake
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Formulario Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6 mt-6">
              {/* Formulario manual original */}

          {/* Selector de Cliente */}
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Seleccionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Cliente (opcional - auto-completa datos del demandante)</Label>
                  <Select 
                    value={selectedClientId} 
                    onValueChange={setSelectedClientId}
                    disabled={loadingClients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Seleccionar cliente existente..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguno (ingresar manualmente)</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nombre_completo} - {client.cedula_rnc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los datos del cliente seleccionado se aplicarán automáticamente al campo "Demandante"
                  </p>
                </div>
                {clients.length === 0 && !loadingClients && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    No tienes clientes registrados. Puedes agregar clientes desde el módulo de Clientes.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Tipo de Documento, Acción Legal y Materia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Documento</Label>
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
                <Label>Acción Legal (Opcional)</Label>
                <Select value={formData.accion_legal} onValueChange={(v) => handleInputChange("accion_legal", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar acción específica..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin acción específica</SelectItem>
                    {TIPOS_ACCION_LEGAL.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
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
                <Label>Cédula o RNC</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="001-0000000-0 o 000-00000-0 (RNC)" 
                    value={formData.demandante_cedula} 
                    onChange={(e) => handleInputChange("demandante_cedula", e.target.value)} 
                  />
                  <VoiceInput onTranscribed={(text) => handleVoiceInput("demandante_cedula", text)} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ingrese cédula para persona física o RNC para persona jurídica
                </p>
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

          <div className="flex gap-2">
            <Button onClick={searchJurisprudence} variant="outline" className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              Sugerir Jurisprudencia
            </Button>
            <Button onClick={generateDocument} disabled={isGenerating} className="flex-1 gap-2" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generar con IA
                </>
              )}
            </Button>
          </div>

          {/* Chat Conversacional */}
          {chatMessages.length > 0 && (
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Chat - Intake Guiado</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] mb-4">
                  <div className="space-y-2">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`p-2 rounded ${msg.role === 'assistant' ? 'bg-muted' : 'bg-primary/10'}`}>
                        <span className="text-xs font-semibold">{msg.role === 'assistant' ? 'IA' : 'Tú'}:</span>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Pregunta a la IA..."
                    onKeyPress={(e) => e.key === 'Enter' && chatInput && setChatMessages(prev => [...prev, {role: 'user', content: chatInput}])}
                  />
                  <Button size="icon" onClick={() => {
                    if (chatInput) {
                      setChatMessages(prev => [...prev, {role: 'user', content: chatInput}]);
                      setChatInput("");
                    }
                  }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mostrar citas actuales */}
          {citations.length > 0 && (
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Citas Verificables ({citations.length})</span>
                  {citations.length < 2 && (
                    <Badge variant="destructive">Mínimo 2 requeridas</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {citations.map((cit, idx) => (
                    <div key={idx} className="p-2 border rounded text-xs">
                      <div className="font-semibold">{cit.organo} - {cit.sala}</div>
                      <div className="text-muted-foreground">{cit.num} ({cit.fecha})</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
            </TabsContent>

            <TabsContent value="structured" className="space-y-6 mt-6">
              {/* Formularios de Intake estructurados */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Acto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={schemaId} 
                    onValueChange={(value) => {
                      setSchemaId(value);
                      setIntakeData({ accion: SCHEMAS.find(s => s.id === value)?.accion });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEMAS.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.titulo} — {s.materia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información del Acto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {schema.fields.map((f) => (
                      <div 
                        key={f.key} 
                        className={f.type === "textarea" ? "sm:col-span-2" : ""}
                      >
                        <FieldRow field={f} data={intakeData} setData={setIntakeField} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button 
                      onClick={generateFromIntake} 
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Sparkles className="h-4 w-4" />
                      Redactar con IA
                    </Button>
                    <Button 
                      onClick={searchJurisprudence} 
                      variant="outline"
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Sugerir Jurisprudencia
                    </Button>
                    <Button 
                      onClick={() => setIntakeData({ accion: schema.accion })} 
                      variant="outline"
                    >
                      Limpiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mostrar citas actuales */}
              {citations.length > 0 && (
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Citas Verificables ({citations.length})</span>
                      {citations.length < 2 && (
                        <Badge variant="destructive">Mínimo 2 requeridas</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {citations.map((cit, idx) => (
                        <div key={idx} className="p-2 border rounded text-xs">
                          <div className="font-semibold">{cit.organo} - {cit.sala}</div>
                          <div className="text-muted-foreground">{cit.num} ({cit.fecha})</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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
          citations={citations}
        />
      </div>
    </div>
  );
};

export default AILegalDrafting;
