// ============================================================
// TRACKING MODULE - CLIENT-SIDE UTILITIES
// Mirrors apps/tracking/utils-seguimiento.py
// ============================================================

/**
 * Tabla operativa: día de instalación → día del ciclo de facturación
 */
const TABLA_OPERATIVA: Record<number, number> = {
  1: 4,
  2: 4,
  3: 4,
  4: 6,
  5: 6,
  6: 9,
  7: 9,
  8: 9,
  9: 11,
  10: 11,
  11: 14,
  12: 14,
  13: 14,
  14: 16,
  15: 16,
  16: 19,
  17: 19,
  18: 19,
  19: 21,
  20: 21,
  21: 24,
  22: 24,
  23: 24,
  24: 26,
  25: 26,
  26: 29,
  27: 29,
  28: 29,
  29: 31,
  30: 31,
  31: 31,
};

export function calcularDiaCiclo(diaInstalacion: number): number {
  return TABLA_OPERATIVA[diaInstalacion] ?? diaInstalacion;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonthsEOM(base: Date, months: number): Date {
  const result = new Date(base);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== (((base.getMonth() + months) % 12) + 12) % 12) {
    result.setDate(0);
  }
  return result;
}

export interface MesProyectado {
  mes_numero: number;
  fecha_seguimiento: Date;
  fecha_validacion_pago: Date;
}

export interface FechasProyectadas {
  ciclo_facturacion: Date;
  meses_detalle: MesProyectado[];
}

export function generarFechasProyectadas(
  fechaInstalacion: Date,
): FechasProyectadas {
  const diaCiclo = calcularDiaCiclo(fechaInstalacion.getDate());

  const ciclo = new Date(fechaInstalacion);
  ciclo.setDate(diaCiclo);

  const meses: MesProyectado[] = [];

  const fechaSegM1 = addDays(ciclo, 10);
  const fechaValM1 = addDays(ciclo, 20);
  meses.push({
    mes_numero: 1,
    fecha_seguimiento: fechaSegM1,
    fecha_validacion_pago: fechaValM1,
  });

  for (let i = 2; i <= 6; i++) {
    const nuevaFechaVal = addMonthsEOM(fechaValM1, i - 1);
    const fechaValAnterior = meses[i - 2].fecha_validacion_pago;
    const nuevaFechaSeg = addDays(fechaValAnterior, 15);
    meses.push({
      mes_numero: i,
      fecha_seguimiento: nuevaFechaSeg,
      fecha_validacion_pago: nuevaFechaVal,
    });
  }

  return { ciclo_facturacion: ciclo, meses_detalle: meses };
}

/**
 * CORRECCIÓN QA: Format ISO date string to DD/MM/YYYY and handles amigable Time (AM/PM)
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";

  // Si incluye "T", es un DateTime. Extraemos la hora de forma amigable
  if (iso.includes("T")) {
    const dateObj = new Date(iso);
    if (!isNaN(dateObj.getTime())) {
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();

      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // el 0 debe ser 12

      const strTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
      return `${dd}/${mm}/${yyyy} ${strTime}`;
    }
  }

  // Fallback seguro si es solo un campo Date clásico (YYYY-MM-DD)
  const parts = iso.split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return iso;
}

export function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function nombreMes(num: number): string {
  return MESES_ES[num - 1] ?? `Mes ${num}`;
}

/**
 * CORRECCIÓN QA: Extractor ultra robusto para el nombre del Asesor.
 * Cubre casos de objetos anidados o aplanados enviados por DRF.
 */
export function getNombreAsesor(venta: any): string {
  if (!venta) return "—";
  return (
    venta.id_asesor?.nombre_completo ||
    venta.asesor_nombre_completo ||
    venta.asesor_nombre ||
    venta.nombre_asesor ||
    (typeof venta.id_asesor === "string" ? venta.id_asesor : "—")
  );
}

/**
 * CORRECCIÓN QA: Extractor ultra robusto para el Producto.
 * Cubre concatenaciones separadas, campos anidados o llaves aplanadas.
 */
export function getNombreProducto(venta: any): string {
  if (!venta) return "—";
  if (venta.id_producto?.nombre) return venta.id_producto.nombre;
  if (venta.id_producto?.nombre_paquete)
    return venta.id_producto.nombre_paquete;

  const compuesto =
    `${venta.producto_campana ?? ""} ${venta.producto_paquete ?? ""} ${venta.producto_solucion ?? ""}`.trim();
  if (compuesto) return compuesto;

  return (
    venta.producto_nombre ||
    (typeof venta.id_producto === "string" ? venta.id_producto : "—")
  );
}
