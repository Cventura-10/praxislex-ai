/**
 * Utilidades para formatear fechas en formato jurídico dominicano
 */

const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];

/**
 * Convierte un número de 0-99 a texto en español
 */
function numeroATexto(num: number): string {
  if (num === 0) return 'cero';
  if (num < 10) return unidades[num];
  if (num >= 10 && num < 20) return especiales[num - 10];
  if (num >= 20 && num < 100) {
    const dec = Math.floor(num / 10);
    const uni = num % 10;
    if (uni === 0) return decenas[dec];
    if (num >= 21 && num <= 29) return 'veinti' + unidades[uni];
    return decenas[dec] + ' y ' + unidades[uni];
  }
  return num.toString();
}

/**
 * Convierte un año a texto (ej: 2025 -> "dos mil veinticinco")
 */
function anioATexto(anio: number): string {
  if (anio === 2000) return 'dos mil';
  if (anio > 2000 && anio < 2100) {
    const mil = 'dos mil';
    const resto = anio - 2000;
    if (resto === 0) return mil;
    return `${mil} ${numeroATexto(resto)}`;
  }
  return anio.toString();
}

/**
 * Formatea una fecha en formato jurídico dominicano
 * Ejemplo: "trece (13) días del mes de octubre del año dos mil veinticinco (2025)"
 */
export function formatearFechaJuridica(fecha: Date): string {
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();
  
  const diaTexto = numeroATexto(dia);
  const anioTexto = anioATexto(anio);
  
  return `${diaTexto} (${dia}) días del mes de ${mes} del año ${anioTexto} (${anio})`;
}

/**
 * Formatea una fecha completa con ciudad y provincia
 * Ejemplo: "En la Ciudad de Santo Domingo, provincia de Distrito Nacional, República Dominicana, a los trece (13) días del mes de octubre del año dos mil veinticinco (2025)."
 */
export function formatearEncabezadoFecha(ciudad: string, provincia: string, fecha: Date): string {
  const fechaTexto = formatearFechaJuridica(fecha);
  return `En la Ciudad de ${ciudad}, provincia de ${provincia}, República Dominicana, a los ${fechaTexto}.`;
}

/**
 * Auto-completa jurisdicción basado en la ciudad
 */
export function completarJurisdiccion(ciudad: string): string {
  const ciudadLower = ciudad.toLowerCase().trim();
  
  const jurisdicciones: Record<string, string> = {
    'santo domingo': 'En la ciudad de Santo Domingo, Distrito Nacional, Capital de la República Dominicana',
    'santiago': 'En la ciudad de Santiago de los Caballeros, provincia Santiago',
    'la vega': 'En la ciudad de La Vega, provincia La Vega',
    'san cristóbal': 'En la ciudad de San Cristóbal, provincia San Cristóbal',
    'puerto plata': 'En la ciudad de Puerto Plata, provincia Puerto Plata',
    'la romana': 'En la ciudad de La Romana, provincia La Romana',
    'higüey': 'En la ciudad de Higüey, provincia La Altagracia',
    'barahona': 'En la ciudad de Barahona, provincia Barahona',
    'moca': 'En la ciudad de Moca, provincia Espaillat',
    'bonao': 'En la ciudad de Bonao, provincia Monseñor Nouel',
  };
  
  for (const [key, value] of Object.entries(jurisdicciones)) {
    if (ciudadLower.includes(key)) {
      return value;
    }
  }
  
  // Jurisdicción genérica
  return `En la ciudad de ${ciudad}`;
}
