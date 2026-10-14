import writeXlsxFile, { type SheetData } from "write-excel-file/browser";

import type { Producto } from "../types/productos.types";

const HEADER_COLOR = "#075985";
const BORDER_COLOR = "#CBD5E1";
const COLUMN_COUNT = 11;

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function numericCell(value: string | null) {
  if (value === null || value === "") return null;
  return {
    value: Number(value),
    type: Number,
    format: '"S/ "#,##0.00',
    borderColor: BORDER_COLOR,
    bottomBorderStyle: "thin",
  } as const;
}

function textCell(value: string | number) {
  return {
    value,
    borderColor: BORDER_COLOR,
    bottomBorderStyle: "thin" as const,
    alignVertical: "center" as const,
  };
}

function dateCell(value: string | null) {
  const date = parseDate(value);
  if (!date) return textCell("Sin vencimiento");
  return {
    value: date,
    type: Date,
    format: "dd/mm/yyyy",
    borderColor: BORDER_COLOR,
    bottomBorderStyle: "thin" as const,
    alignVertical: "center" as const,
  };
}

export async function exportProductsExcel(
  productos: Producto[],
  estado: "Activos" | "Inactivos",
) {
  const header = [
    "ID",
    "Paquete",
    "Campaña",
    "Tipo de solución",
    "Alto valor",
    "Costo fijo",
    "Comisión call",
    "Comisión campo",
    "Inicio de vigencia",
    "Fin de vigencia",
    "Estado",
  ].map((value) => ({
    value,
    fontWeight: "bold" as const,
    textColor: "#FFFFFF",
    backgroundColor: HEADER_COLOR,
    alignVertical: "center" as const,
    wrap: true,
    height: 28,
  }));

  const rows: SheetData = productos.map((producto) => [
    textCell(producto.id),
    textCell(producto.nombre_paquete),
    textCell(producto.nombre_campana),
    textCell(producto.tipo_solucion),
    textCell(producto.es_alto_valor ? "Sí" : "No"),
    numericCell(producto.costo_fijo_plan),
    numericCell(producto.comision_base_call),
    numericCell(producto.comision_base_campo),
    dateCell(producto.fecha_inicio_vigencia),
    dateCell(producto.fecha_fin_vigencia),
    textCell(producto.activo ? "Activo" : "Inactivo"),
  ]);

  const sheetData: SheetData = [
    [
      {
        value: "Catálogo de productos",
        columnSpan: COLUMN_COUNT,
        fontSize: 18,
        fontWeight: "bold",
        textColor: "#0F172A",
        height: 32,
        alignVertical: "center",
      },
      ...Array(COLUMN_COUNT - 1).fill(null),
    ],
    [
      {
        value: `${estado} · ${productos.length} registro${productos.length === 1 ? "" : "s"}`,
        columnSpan: COLUMN_COUNT,
        textColor: "#64748B",
        height: 24,
      },
      ...Array(COLUMN_COUNT - 1).fill(null),
    ],
    Array(COLUMN_COUNT).fill(null),
    header,
    ...rows,
  ];

  const today = new Date().toISOString().slice(0, 10);
  const stateName = estado.toLowerCase();

  await writeXlsxFile(sheetData, {
    sheet: "Productos",
    columns: [
      { width: 9 },
      { width: 28 },
      { width: 30 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 17 },
      { width: 19 },
      { width: 19 },
      { width: 13 },
    ],
    stickyRowsCount: 4,
    showGridLines: false,
  }).toFile(`productos-${stateName}-${today}.xlsx`);
}
