// ── Entry point ──────────────────────────────────────────────────────────────
export { SalesPage } from "./pages/SalesPage";
export { AsesorPage } from "./pages/Ventasasesorpage";
export { BackofficePage } from "./pages/Ventasbackofficepage";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  Venta,
  VentaFiltros,
  EstadisticasAsesor,
  CreateVentaPayload,
  UpdateVentaAsesorPayload,
  UpdateVentaBackofficePayload,
  EstadoSOT,
  SubEstadoSOT,
  EstadoAudio,
  Producto,
  GrabadorAudio,
  AudioVenta,
  PaginatedResponse,
  ETIQUETAS_AUDIO_DNI,
} from "./types/sales.types";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export {
  useVentas,
  useVenta,
  useEstadisticasAsesor,
  useCreateVenta,
  useUpdateVentaAsesor,
  useUpdateVentaBackoffice,
  useEstadosSOT,
  useSubEstadosSOT,
  useEstadosAudio,
  useProductos,
  useGrabadores,
  useTiposDocumento,
  useDepartamentos,
  useProvincias,
  useDistritos,
  salesKeys,
} from "./hooks/useSales";

// ── Services ──────────────────────────────────────────────────────────────────
export {
  salesService,
  catalogosService,
  ubigeoService,
  uploadAudioToCloudinary,
} from "./services/sales.service";

// ── Components ────────────────────────────────────────────────────────────────
export { VentaFormAsesor } from "./components/VentaFormAsesor";
export { VentaFormBackoffice } from "./components/VentaFormBackoffice";
export { DataTable } from "./components/VentasTable";
export { EstadoBadge } from "./components/EstadoBadge";
