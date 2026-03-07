// ── Entry point ──────────────────────────────────────────────────────────────
export { ProductosPage } from "./pages/ProductsPage";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  Producto,
  CreateProductoPayload,
  UpdateProductoPayload,
  PaginatedProductos,
  ProductoFiltros,
  TipoSolucion,
} from "./types/productos.types";
export { TIPOS_SOLUCION } from "./types/productos.types";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export {
  useProductos,
  useProducto,
  useCampanas,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
  useReactivateProducto,
  productosKeys,
} from "./hooks/useProductos";

// ── Service ───────────────────────────────────────────────────────────────────
export { productosService } from "./services/product.service";

// ── Components ────────────────────────────────────────────────────────────────
export { ProductoForm } from "./components/ProductForm";
export { ConfirmDialog } from "./components/Confirmdialog";
