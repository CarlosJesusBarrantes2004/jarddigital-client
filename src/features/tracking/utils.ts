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

/** Add days to a Date, returning a new Date */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Add months with EOM rule (mirrors relativedelta behaviour) */
function addMonthsEOM(base: Date, months: number): Date {
  const result = new Date(base);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // If the day overflowed (e.g. Jan 31 + 1 month → Feb 28/29)
  // JS automatically rolls over, but we want EOM, not rollover to March
  if (result.getMonth() !== (((base.getMonth() + months) % 12) + 12) % 12) {
    result.setDate(0); // last day of the intended month
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

/**
 * Genera el ciclo de facturación y los 6 meses proyectados
 * a partir de la fecha real de instalación ("Día 0").
 */
export function generarFechasProyectadas(
  fechaInstalacion: Date,
): FechasProyectadas {
  const diaCiclo = calcularDiaCiclo(fechaInstalacion.getDate());

  const ciclo = new Date(fechaInstalacion);
  ciclo.setDate(diaCiclo);

  const meses: MesProyectado[] = [];

  // Mes 1
  const fechaSegM1 = addDays(ciclo, 10);
  const fechaValM1 = addDays(ciclo, 20);
  meses.push({
    mes_numero: 1,
    fecha_seguimiento: fechaSegM1,
    fecha_validacion_pago: fechaValM1,
  });

  // Meses 2–6
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

/** Format ISO date string to DD/MM/YYYY */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Format Date object to YYYY-MM-DD for API */
export function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Human-readable month name */
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
