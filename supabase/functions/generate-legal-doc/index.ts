import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PizZip from "https://esm.sh/pizzip@3.1.7";
import Docxtemplater from "https://esm.sh/docxtemplater@3.42.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache para plantillas (optimización de rendimiento)
const templateCache = new Map<string, Uint8Array>();

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

    const payload = await req.json();
    console.log("📦 Payload recibido:", JSON.stringify(payload, null, 2));

    // Validaciones fail-fast
    const reqKeys = [
      "primera_parte.cliente_id",
      "segunda_parte.cliente_id",
      "notario.nombre_completo",
      "notario.exequatur",
      "contrato.canon_monto",
      "contrato.plazo_meses"
    ];
    
    for (const k of reqKeys) {
      const v = k.split(".").reduce((acc: any, key) => acc?.[key], payload);
      if (v === undefined || v === null || v === "") {
        console.error(`❌ Falta dato requerido: ${k}`);
        return new Response(
          JSON.stringify({ error: `Falta dato requerido: ${k}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
    console.error("💥 Error generando DOCX:", {
      message: e?.message || 'Unknown error',
      stack: e?.stack,
      type: e?.constructor?.name,
      code: e?.code
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Error al generar el documento. Contacte soporte si el problema persiste."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
