// ── TYPES ──
export * from "./types/sales.types";

// ── SERVICES ──
export {
  salesService,
  catalogosService,
  ubigeoService,
} from "./services/sales.service";

// ── HOOKS ──
export {
  salesKeys,
  useVentas,
  useVenta,
  useEstadisticasAsesor,
  useCreateVenta,
  useUpdateVenta,
  useDeleteVenta,
  useEstadosSOT,
  useSubEstadosSOT,
  useEstadosAudio,
  useProductos,
  useGrabadores,
  useTiposDocumento,
  useDepartamentos,
  useProvincias,
  useDistritos,
  useDistritoById,
} from "./hooks/useSales";

// ── SCHEMAS ──
export {
  createVentaSchema,
  updateVentaBackofficeSchema,
  correccionVentaSchema,
  audioVentaSchema,
} from "./schemas/venta.schema";
export type {
  CreateVentaFormValues,
  UpdateVentaBackofficeValues,
  CorreccionVentaFormValues,
} from "./schemas/venta.schema";

// ── COMPONENTS ──
export { EstadoBadge, ColorBadge } from "./components/EstadoBadge";
export { UbigeoCascada } from "./components/UbigeoCascada";
export { VentaFormAsesor } from "./components/VentaFormAsesor";
export { VentaFormBackoffice } from "./components/VentaFormBackoffice";
export { DataTable } from "./components/VentasTable";

// ── PAGES ──
export { VentasAsesorPage } from "./pages/Ventasasesorpage";
export { VentasBackofficePage } from "./pages/Ventasbackofficepage";
