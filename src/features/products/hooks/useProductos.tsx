import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productosService } from "../services/product.service";
import type {
  ProductoFiltros,
  CreateProductoPayload,
  UpdateProductoPayload,
} from "../types/productos.types";

// ── Query key factory ────────────────────────────────────────────────────────
export const productosKeys = {
  all: ["productos"] as const,
  lists: () => [...productosKeys.all, "list"] as const,
  list: (f: ProductoFiltros) => [...productosKeys.lists(), f] as const,
  detail: (id: number) => [...productosKeys.all, "detail", id] as const,
  campanas: () => [...productosKeys.all, "campanas"] as const,
};

// ── READ ─────────────────────────────────────────────────────────────────────

export function useProductos(filtros: ProductoFiltros = {}) {
  return useQuery({
    queryKey: productosKeys.list(filtros),
    queryFn: () => productosService.getAll(filtros),
    staleTime: 1000 * 30, // 30 s — los catálogos no cambian tan seguido
    placeholderData: (prev) => prev, // mantiene datos anteriores al paginar
  });
}

export function useProducto(id: number | null) {
  return useQuery({
    queryKey: productosKeys.detail(id!),
    queryFn: () => productosService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useCampanas() {
  return useQuery({
    queryKey: productosKeys.campanas(),
    queryFn: productosService.getCampanas,
    staleTime: 1000 * 120, // 2 min
  });
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductoPayload) =>
      productosService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productosKeys.lists() });
    },
  });
}

export function useUpdateProducto(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductoPayload) =>
      productosService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productosKeys.lists() });
      qc.invalidateQueries({ queryKey: productosKeys.detail(id) });
    },
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productosService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productosKeys.lists() });
    },
  });
}

export function useReactivateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productosService.reactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productosKeys.lists() });
    },
  });
}
