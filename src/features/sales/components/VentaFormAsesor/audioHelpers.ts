/**
 * features/sales/components/VentaFormAsesor/audioHelpers.ts
 *
 * Función que devuelve el valor real del cliente para cada posición de audio.
 * Se muestra debajo de la etiqueta en AudioUploadField para guiar al asesor.
 */

interface DatosClienteParaAudio {
  cliente_nombre?: string;
  cliente_numero_doc?: string;
  cliente_papa?: string;
  cliente_mama?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  cliente_fecha_nacimiento?: string;
  numero_instalacion?: string;
  representante_legal_nombre?: string;
  representante_legal_dni?: string;
  direccion_detalle?: string;
  // Ubigeo de nacimiento (nombres, opcionales)
  dep_nac_nombre?: string;
  prov_nac_nombre?: string;
  dist_nac_nombre?: string;
  // Ubigeo de instalación (nombres, opcionales)
  dep_inst_nombre?: string;
  prov_inst_nombre?: string;
  dist_inst_nombre?: string;
}

/**
 * Dado el índice del audio (0-13) y los datos del cliente,
 * devuelve el texto que se muestra debajo de la etiqueta.
 *
 * Orden establecido por la empresa:
 *
 * Para DNI (12 audios):
 *  0  → nombre del cliente
 *  1  → número de documento
 *  2  → dep/prov/dist nacimiento + fecha nacimiento
 *  3  → dirección de instalación
 *  4  → "PAPA Y MAMA"
 *  5  → teléfono de contacto
 *  6  → correo electrónico
 *  7  → "NO"
 *  8  → "SI"
 *  9  → "SI ACEPTO"
 * 10  → "SI AUTORIZO"
 * 11  → "SI ACEPTO"
 *
 * Para RUC (14 audios) — igual + 2 extra:
 * 12  → RUC del representante legal (representante_legal_dni)
 * 13  → razón social / nombre del representante legal
 */
export function getValorClienteParaAudio(
  index: number,
  esRUC: boolean,
  datos: DatosClienteParaAudio,
): string | null {
  const nombre = datos.cliente_nombre?.toUpperCase().trim() ?? "";
  const doc = datos.cliente_numero_doc?.trim() ?? "";
  const papa = datos.cliente_papa?.toUpperCase().trim() ?? "";
  const mama = datos.cliente_mama?.toUpperCase().trim() ?? "";
  const telefono = datos.cliente_telefono?.trim() ?? "";
  const email = datos.cliente_email?.toLowerCase().trim() ?? "";
  const dir = datos.direccion_detalle?.toUpperCase().trim() ?? "";

  // Fecha de nacimiento formateada como DD/MM/YYYY
  const fNac = datos.cliente_fecha_nacimiento
    ? (() => {
        const parts = datos.cliente_fecha_nacimiento.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return datos.cliente_fecha_nacimiento;
      })()
    : "";

  // Ubigeo de nacimiento
  const depNac = datos.dep_nac_nombre?.toUpperCase().trim() ?? "";
  const provNac = datos.prov_nac_nombre?.toUpperCase().trim() ?? "";
  const distNac = datos.dist_nac_nombre?.toUpperCase().trim() ?? "";

  let nacimiento: string | null = null;
  if (depNac && provNac && distNac) {
    nacimiento = `${depNac} / ${provNac} / ${distNac}`;
    if (fNac) nacimiento += ` - ${fNac}`;
  } else if (fNac) {
    nacimiento = fNac;
  }

  // Dirección completa de instalación
  const depInst = datos.dep_inst_nombre?.toUpperCase().trim() ?? "";
  const provInst = datos.prov_inst_nombre?.toUpperCase().trim() ?? "";
  const distInst = datos.dist_inst_nombre?.toUpperCase().trim() ?? "";

  let direccion: string | null = null;
  if (dir) {
    const ubigeoInst = [distInst, provInst, depInst].filter(Boolean).join(" ");
    direccion = ubigeoInst ? `${dir} - ${ubigeoInst}` : dir;
  }

  const padres = papa && mama ? `${papa} Y ${mama}` : papa || mama || null;

  switch (index) {
    case 0:
      return nombre || null;
    case 1:
      return doc || null;
    case 2:
      return nacimiento;
    case 3:
      return direccion;
    case 4:
      return padres;
    case 5:
      return telefono || null;
    case 6:
      return email || null;
    case 7:
      return "NO";
    case 8:
      return "SI";
    case 9:
      return "SI ACEPTO";
    case 10:
      return "SI AUTORIZO";
    case 11:
      return "SI ACEPTO";
    // Solo para RUC:
    case 12:
      if (!esRUC) return null;
      return datos.representante_legal_dni?.trim() || null;
    case 13:
      if (!esRUC) return null;
      return datos.representante_legal_nombre?.toUpperCase().trim() || null;
    default:
      return null;
  }
}
