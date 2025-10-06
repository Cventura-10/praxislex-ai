import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Loader2 } from "lucide-react";

/**
 * PraxisLex — Formularios de Intake (5 actos clave, RD)
 * Actos cubiertos (rol ABOGADOS):
 *  1) Civil — Demanda en cobro de pesos
 *  2) Constitucional — Acción de amparo
 *  3) Civil — Referimiento (medida provisional)
 *  4) Laboral — Prestaciones laborales
 *  5) Inmobiliario — Deslinde / Saneamiento (jurisdicción de tierras)
 */

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

const TPL_DEMANDA_BASE = `
[PRESENTACIÓN]
Demandante: {{demandante}}
Demandado: {{demandado}}
Abogado apoderado: {{abogado.nombre}} ({{abogado.colegio}}) — Estudio: {{abogado.estudio}}

[EMPLAZAMIENTO Y TRIBUNAL]
Tribunal: {{tribunal.nombre}} — Dirección: {{tribunal.direccion}}
Cítese y emplácese al demandado dentro del plazo legal.

[OBJETO]
{{accion}} — {{objeto}}

[RELATO FÁCTICO]
{{hechos}}

[FUNDAMENTOS]
{{fundamentos}}

[PRETENSIONES]
{{pretensiones}}

[MEDIDAS PROVISIONALES]
{{medidas}}

[ANEXOS]
{{anexos}}
`;

function assembleDoc(intake: Record<string, any>, extra: Record<string, any> = {}): string {
  const get = (k: string, d: string = "") => (k in intake ? String(intake[k]) : d);
  const abogado = {
    nombre: get("abogado.nombre", "[Nombre abogado]") || get("abogadoNombre", "[Nombre abogado]"),
    colegio: get("abogado.colegio", "[Matrícula/CARD]") || get("abogadoColegio", "[Matrícula/CARD]"),
    estudio: get("abogado.estudio", "[Estudio]") || get("abogadoEstudio", "[Estudio]")
  };
  const tribunal = {
    nombre: get("tribunal.nombre", "[Tribunal]"),
    direccion: get("tribunal.direccion", "[Dirección]")
  };
  return TPL_DEMANDA_BASE
    .replace("{{demandante}}", get("demandante", "[Demandante]"))
    .replace("{{demandado}}", get("demandado", "[Demandado]"))
    .replace("{{abogado.nombre}}", abogado.nombre)
    .replace("{{abogado.colegio}}", abogado.colegio)
    .replace("{{abogado.estudio}}", abogado.estudio)
    .replace("{{tribunal.nombre}}", tribunal.nombre)
    .replace("{{tribunal.direccion}}", tribunal.direccion)
    .replace("{{accion}}", get("accion", extra.accion || "[Acción]"))
    .replace("{{objeto}}", get("objeto", extra.objeto || "[Objeto]"))
    .replace("{{hechos}}", get("hechos", "[Hechos]"))
    .replace("{{fundamentos}}", get("fundamentos", "[Fundamentos jurisprudencia/artículos]"))
    .replace("{{pretensiones}}", get("pretensiones", "[Pretensiones / Dispositivo]"))
    .replace("{{medidas}}", get("medidas", "[Medidas solicitadas]"))
    .replace("{{anexos}}", get("anexos", "[Anexos/Pruebas]"));
}

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

const IntakeForms: React.FC = () => {
  const [schemaId, setSchemaId] = useState<string>(SCHEMAS[0].id);
  const schema = useMemo(() => SCHEMAS.find(s => s.id === schemaId)!, [schemaId]);
  const [data, setData] = useState<Record<string, any>>({ accion: schema.accion });
  const [preview, setPreview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const setField = (k: string, v: any) => setData((s) => ({ ...s, [k]: v }));

  const generar = () => {
    const doc = assembleDoc({ ...data, accion: schema.accion }, { 
      objeto: data.objeto || schema.titulo, 
      accion: schema.accion 
    });
    setPreview(doc);
    toast.success("Borrador generado exitosamente");
  };

  const generarConIA = async () => {
    setIsGenerating(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('generate-legal-doc', {
        body: {
          tipo_documento: schema.titulo,
          materia: schema.materia.split('—')[0].trim(),
          hechos: data.hechos || "",
          pretension: data.pretensiones || "",
          demandante: { nombre: data.demandante },
          abogado: {
            nombre: data.abogadoNombre,
            matricula: data.abogadoColegio,
            direccion: data.abogadoEstudio
          },
          demandado: { nombre: data.demandado },
          juzgado: data["tribunal.nombre"]
        }
      });

      if (error) throw error;
      
      setPreview(response.documento);
      toast.success("Documento generado con IA exitosamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al generar con IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportar = async (format: 'docx' | 'pdf') => {
    if (!preview) {
      toast.error("Genera un borrador primero");
      return;
    }

    setIsExporting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('documents-generate', {
        body: {
          format,
          body: preview,
          intake: { ...data, materia: schema.materia },
          citations: []
        }
      });

      if (error) throw error;

      toast.success(`Documento ${format.toUpperCase()} generado`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al exportar documento");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="bg-primary/10 text-primary">
          <FileText className="mr-1 h-3 w-3" />
          Formularios de Intake
        </Badge>
        <h1 className="text-4xl font-bold">Formularios de Intake — 5 actos clave</h1>
        <p className="text-muted-foreground max-w-3xl">
          Recopila información estandarizada y genera el borrador base. Política "citar‑primero" aplicará en el backend al exportar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Acto</CardTitle>
              <CardDescription>Selecciona el tipo de documento a generar</CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={schemaId} 
                onValueChange={(value) => {
                  setSchemaId(value);
                  setData({ accion: SCHEMAS.find(s => s.id === value)?.accion });
                  setPreview("");
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
              <CardDescription>Completa los campos requeridos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {schema.fields.map((f) => (
                  <div 
                    key={f.key} 
                    className={f.type === "textarea" ? "sm:col-span-2" : ""}
                  >
                    <FieldRow field={f} data={data} setData={setField} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={generar}>
                  Generar borrador
                </Button>
                <Button 
                  onClick={generarConIA} 
                  variant="secondary"
                  disabled={isGenerating}
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Redactar con IA
                </Button>
                <Button 
                  onClick={() => setData({ accion: schema.accion })} 
                  variant="outline"
                >
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Borrador del documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[520px] overflow-auto rounded-lg border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {preview || "Completa el formulario y presiona 'Generar borrador'."}
                </pre>
              </div>
              {preview && (
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={() => exportar('docx')} 
                    size="sm"
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    DOCX
                  </Button>
                  <Button 
                    onClick={() => exportar('pdf')} 
                    size="sm" 
                    variant="outline"
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Exportación DOCX/PDF se realiza en el backend con tu plantilla oficial.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntakeForms;
