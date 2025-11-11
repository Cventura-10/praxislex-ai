import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PizZip from "https://esm.sh/pizzip@3.1.7";
import Docxtemplater from "https://esm.sh/docxtemplater@3.42.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sanitizeError, corsHeaders } from '../_shared/errorSanitizer.ts';

// Cache para plantillas (optimización de rendimiento)
const templateCache = new Map<string, Uint8Array>();

// Zod schemas para validación completa del payload
const personaSchema = z.object({
  cliente_id: z.string().uuid().optional(),
  nombre_completo: z.string().min(1).max(200).optional(),
  razon_social: z.string().min(1).max(200).optional(),
  cedula_rnc: z.string().min(1).max(50),
  tipo_persona: z.enum(['fisica', 'juridica']).optional(),
  genero: z.enum(['m', 'f', 'M', 'F', '']).optional(),
  nacionalidad: z.string().min(1).max(100).optional(),
  estado_civil: z.string().max(50).optional(),
  profesion: z.string().max(100).optional(),
  ocupacion: z.string().max(100).optional(),
  direccion: z.string().max(500).optional(),
  sector_nombre: z.string().max(100).optional(),
  municipio_nombre: z.string().max(100).optional(),
  provincia_nombre: z.string().max(100).optional(),
}).refine(
  (data) => data.nombre_completo || data.razon_social,
  { message: "Debe proporcionar nombre_completo o razon_social" }
);

const notarioSchema = z.object({
  nombre_completo: z.string().min(1).max(200),
  exequatur: z.string().min(1).max(50),
  matricula: z.string().max(50).optional(),
  cedula_mask: z.string().max(50).optional(),
  oficina: z.string().max(200).optional(),
  jurisdiccion: z.string().max(200).optional(),
});

const contratoSchema = z.object({
  inmueble_descripcion: z.string().min(1).max(2000),
  uso: z.string().max(100).optional(),
  canon_monto: z.number().positive().or(z.string().transform(Number)),
  plazo_meses: z.number().int().positive().or(z.string().transform(Number)),
});

const legalDocPayloadSchema = z.object({
  primera_parte: personaSchema,
  segunda_parte: personaSchema,
  notario: notarioSchema,
  contrato: contratoSchema,
  numero_acto: z.string().max(100).optional(),
  numero_acta: z.string().max(100).optional(),
  numero_folios: z.number().int().positive().optional(),
  ciudad: z.string().max(100).optional(),
  fecha: z.string().or(z.date()).optional(),
  template_slug: z.string().max(100).optional(),
});

// Conversor de números a letras en español dominicano
function numeroALetras(n: number): string {
  const unidades = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"];
  const diez = ["diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve"];
  const decs = ["","diez","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
  const cents = ["","cien","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
  
  function toWords(x: number): string {
    if (x < 10) return unidades[x];
    if (x < 20) return diez[x - 10];
    if (x < 100) {
      const dec = Math.floor(x / 10);
      const uni = x % 10;
      return (decs[dec] + (uni ? ` y ${unidades[uni]}` : "")).trim();
    }
    if (x < 1000) {
      const cent = Math.floor(x / 100);
      const resto = x % 100;
      return (x === 100 ? "cien" : `${cents[cent]}${resto ? " " + toWords(resto) : ""}`).trim();
    }
    if (x < 1000000) {
      const miles = Math.floor(x / 1000);
      const resto = x % 1000;
      const pref = (miles === 1 ? "mil" : `${toWords(miles)} mil`);
      return (pref + (resto ? ` ${toWords(resto)}` : "")).trim();
    }
    return `${x}`;
  }
  
  const entero = Math.floor(n);
  const cent = Math.round((n - entero) * 100);
  const entStr = toWords(entero);
  const centStr = cent ? ` con ${cent} centavos` : "";
  return `${entStr} pesos${centStr}`.replace(/\s+/g, " ");
}

// Normalizar persona (física o jurídica)
function normalizaPersona(p: any) {
  const genero = (p.genero || "").toLowerCase();
  const esJuridica = p.tipo_persona === "juridica";
  const etiqueta = esJuridica
    ? (p.es_propietario ? "EL PROPIETARIO" : "EL INQUILINO")
    : (p.es_propietario
        ? (genero === "f" ? "LA PROPIETARIA" : "EL PROPIETARIO")
        : (genero === "f" ? "LA INQUILINA" : "EL INQUILINO"));
  
  return {
    ...p,
    etiqueta,
    domicilio_linea: [
      p.direccion,
      p.sector_nombre,
      p.municipio_nombre,
      p.provincia_nombre,
      "República Dominicana"
    ].filter(Boolean).join(", "),
  };
}

// Formato de fecha larga en español
function fechaLarga(d: string | Date): string {
  const fecha = new Date(d);
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

// Normalizar payload completo para plantilla
function normalizaPayload(raw: any) {
  const primera = normalizaPersona({
    ...raw.primera_parte,
    es_propietario: true,
  });
  const segunda = normalizaPersona({
    ...raw.segunda_parte,
    es_propietario: false,
  });

  const monto = Number(raw?.contrato?.canon_monto ?? 0);
  const plazo = Number(raw?.contrato?.plazo_meses ?? 0);

  return {
    NUMERO_ACTO: raw?.numero_acto || "ACT-PENDIENTE",
    NUMERO_ACTA: raw?.numero_acta || "",
    NUMERO_FOLIOS: raw?.numero_folios || 1,

    CIUDAD: raw?.ciudad || "Santo Domingo",
    MUNICIPIO_NOMBRE: raw?.primera_parte?.municipio_nombre || raw?.segunda_parte?.municipio_nombre || "",
    PROVINCIA_NOMBRE: raw?.primera_parte?.provincia_nombre || raw?.segunda_parte?.provincia_nombre || "",

    // Primera parte
    P1_NOMBRE: primera.nombre_completo || "",
    P1_CEDULA_RNC: primera.cedula_rnc || "",
    P1_NACIONALIDAD: primera.nacionalidad || "dominicana",
    P1_ESTADO_CIVIL: (primera.estado_civil || "").toLowerCase(),
    P1_PROFESION: primera.profesion || primera.ocupacion || "",
    P1_DOMICILIO: primera.domicilio_linea,
    P1_ETIQUETA: primera.etiqueta,

    // Segunda parte
    P2_NOMBRE: segunda.nombre_completo || segunda.razon_social || "",
    P2_CEDULA_RNC: segunda.cedula_rnc || "",
    P2_NACIONALIDAD: segunda.nacionalidad || "dominicana",
    P2_ESTADO_CIVIL: (segunda.estado_civil || "").toLowerCase(),
    P2_PROFESION: segunda.profesion || segunda.ocupacion || "",
    P2_DOMICILIO: segunda.domicilio_linea,
    P2_ETIQUETA: segunda.etiqueta,

    // Notario
    NOTARIO_NOMBRE: raw?.notario?.nombre_completo || "",
    NOTARIO_EXEQUATUR: raw?.notario?.exequatur || raw?.notario?.matricula || "",
    NOTARIO_CEDULA_MASK: raw?.notario?.cedula_mask || "",
    NOTARIO_OFICINA: raw?.notario?.oficina || "",
    NOTARIO_JURISDICCION: raw?.notario?.jurisdiccion || "",

    // Contrato
    INMUEBLE_DESCRIPCION: raw?.contrato?.inmueble_descripcion || "",
    USO_INMUEBLE: (raw?.contrato?.uso || "residencial").toUpperCase(),
    CANON_NUM: monto.toFixed(2),
    CANON_LETRAS: numeroALetras(monto),
    PLAZO_MESES: plazo,
    PLAZO_LETRAS: numeroALetras(plazo).replace("pesos", "meses"),
    FECHA_LARGA: fechaLarga(raw?.fecha || new Date()),
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Iniciando generación de documento DOCX");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rawPayload = await req.json();
    console.log("📦 Payload recibido");

    // Validar payload con Zod
    const validationResult = legalDocPayloadSchema.safeParse(rawPayload);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        campo: err.path.join('.'),
        error: err.message
      }));
      
      console.error("❌ Validación fallida:", errors);
      
      return new Response(
        JSON.stringify({ 
          error: "Datos de entrada inválidos. Verifique los campos requeridos.",
          detalles: errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validationResult.data;
    console.log("✅ Payload validado correctamente");

    // Determinar plantilla (soporte para múltiples plantillas)
    const templateName = payload.template_slug 
      ? `${payload.template_slug}.docx` 
      : "contrato_alquiler.docx";

    console.log(`📄 Usando plantilla: ${templateName}`);

    // Intentar obtener plantilla de caché
    let content = templateCache.get(templateName);

    if (!content) {
      // Descargar plantilla DOCX del Storage
      console.log(`📥 Descargando plantilla ${templateName}...`);
      const { data, error } = await supabase
        .storage
        .from("templates")
        .download(templateName);
      
      if (error) {
        console.error("❌ Error descargando plantilla:", error);
        throw new Error(`Template not found: ${templateName}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      content = new Uint8Array(arrayBuffer);
      
      // Guardar en caché
      templateCache.set(templateName, content);
      console.log(`✅ Plantilla descargada y cacheada: ${content.length} bytes`);
    } else {
      console.log("⚡ Usando plantilla desde caché");
    }

    // Normalizar datos
    const tplData = normalizaPayload(payload);
    console.log("🔄 Datos normalizados:", JSON.stringify(tplData, null, 2));

    // Procesar plantilla con docxtemplater
    console.log("⚙️ Procesando plantilla...");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => "" // Manejar nulls de forma segura
    });
    
    doc.setData(tplData);
    doc.render();
    
    const generatedBuffer = doc.getZip().generate({ 
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 } // Máxima compresión
    });
    console.log(`✅ Documento generado: ${generatedBuffer.byteLength} bytes`);

    // Retornar DOCX binario
    const filename = `${payload.numero_acto || 'documento'}_${Date.now()}.docx`;
    console.log(`📄 Enviando archivo: ${filename}`);
    
    return new Response(generatedBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": generatedBuffer.byteLength.toString()
      }
    });
    
  } catch (e: any) {
    // Log full error details server-side for debugging
    return new Response(
      JSON.stringify({ 
        error: sanitizeError(e, 'generate-legal-doc')
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
