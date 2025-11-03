import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convertir números a letras en español
function numeroALetras(numero: number): string {
  if (numero === 0) return 'CERO';
  
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (numero < 10) return unidades[numero];
  if (numero >= 10 && numero < 20) return especiales[numero - 10];
  if (numero >= 20 && numero < 100) {
    const unidad = numero % 10;
    return decenas[Math.floor(numero / 10)] + (unidad > 0 ? ' Y ' + unidades[unidad] : '');
  }
  if (numero >= 100 && numero < 1000) {
    const resto = numero % 100;
    const centenasText = numero === 100 ? 'CIEN' : centenas[Math.floor(numero / 100)];
    return centenasText + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  if (numero >= 1000 && numero < 1000000) {
    const miles = Math.floor(numero / 1000);
    const resto = numero % 1000;
    const milesText = miles === 1 ? 'MIL' : numeroALetras(miles) + ' MIL';
    return milesText + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  if (numero >= 1000000) {
    const millones = Math.floor(numero / 1000000);
    const resto = numero % 1000000;
    const millonesText = millones === 1 ? 'UN MILLÓN' : numeroALetras(millones) + ' MILLONES';
    return millonesText + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  return numero.toString();
}

// Generar número de acto automático
async function generateActNumber(supabase: any, tenantId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  const { data, error } = await supabase.rpc('increment_act_sequence', {
    p_tenant_id: tenantId,
    p_year: currentYear,
  });
  
  if (error) {
    console.error('Error generating act number:', error);
    throw new Error('No se pudo generar el número de acto');
  }
  
  const sequenceNumber = data || 1;
  return `ACT-${currentYear}-${sequenceNumber.toString().padStart(3, '0')}`;
}

// Formatear fecha en letras (español dominicano)
function formatFechaLarga(fecha: Date): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const año = fecha.getFullYear();
  
  return `${numeroALetras(dia).toLowerCase()} (${dia}) días del mes de ${mes} del año ${numeroALetras(año).toLowerCase()} (${año})`;
}

// Procesar plantilla con marcadores
async function processTemplate(template: string, data: any): Promise<string> {
  let processed = template;
  
  // Reemplazar todos los marcadores {campo}
  const regex = /\{([^}]+)\}/g;
  processed = processed.replace(regex, (match, key) => {
    // Soportar acceso a propiedades anidadas como {partes.0.nombre}
    const value = key.split('.').reduce((obj: any, prop: string) => {
      if (obj === null || obj === undefined) return '';
      return obj[prop];
    }, data);
    
    return value !== undefined && value !== null ? value : '';
  });
  
  return processed;
}

serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del payload
    const actData = await req.json();
    
    if (!actData.slug || !actData.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: slug y tenant_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating document for slug:', actData.slug);

    // Generar número de acto automático
    const actoNumero = await generateActNumber(supabase, actData.tenant_id);
    const fechaActual = new Date();

    // Preparar datos para la plantilla
    const templateData = {
      ...actData,
      acto_numero: actoNumero,
      fecha_corta: fechaActual.toLocaleDateString('es-DO'),
      fecha_larga: formatFechaLarga(fechaActual),
      // Convertir montos numéricos a letras
      precio_alquiler_letras: actData.precio_alquiler_numero 
        ? numeroALetras(actData.precio_alquiler_numero) + ' PESOS DOMINICANOS' 
        : '',
      deposito_garantia_letras: actData.deposito_garantia_numero 
        ? numeroALetras(actData.deposito_garantia_numero) + ' PESOS DOMINICANOS' 
        : '',
      monto_demanda_letras: actData.monto_demanda_numero 
        ? numeroALetras(actData.monto_demanda_numero) + ' PESOS DOMINICANOS' 
        : '',
      plazo_letras: actData.plazo_meses 
        ? `${numeroALetras(actData.plazo_meses)} (${actData.plazo_meses})` 
        : '',
    };

    // NOTA: Por ahora retornamos un documento simplificado
    // En producción, aquí se procesaría la plantilla DOCX con docxtemplater
    
    const documentText = `
ACTO LEGAL No. ${actoNumero}

Tipo: ${actData.slug}
Fecha: ${templateData.fecha_larga}
Ciudad: ${actData.ciudad_acto || 'Santo Domingo'}

Este documento ha sido generado exitosamente.
Los datos completos se almacenan en la base de datos.

Para implementación completa con plantillas DOCX, se requiere:
1. Subir plantillas .docx al bucket 'templates'
2. Integrar librería docxtemplater en Deno
3. Procesar y generar DOCX completo
`;

    // Guardar en base de datos
    const { error: insertError } = await supabase
      .from('legal_acts_new')
      .insert({
        tenant_id: actData.tenant_id,
        user_id: user.id,
        acto_numero: actoNumero,
        slug: actData.slug,
        document_url: null, // Por ahora null, se actualizará cuando se genere DOCX
        data: templateData,
        created_by: user.id,
      });

    if (insertError) {
      console.error('Error inserting legal act:', insertError);
      throw new Error('Error al guardar el acto en la base de datos');
    }

    console.log('Document generated successfully:', actoNumero);

    return new Response(
      JSON.stringify({
        success: true,
        actoNumero: actoNumero,
        documentText: documentText,
        message: 'Documento generado exitosamente',
        note: 'Versión simplificada - se requiere configuración de plantillas DOCX para versión completa',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-document function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al generar el documento', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
