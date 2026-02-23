import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-errors";

import { salesService } from "../services/salesService";

import type {
  BackofficePayload,
  CatalogItem,
  ProductItem,
  Sale,
  SalePayload,
} from "../types";

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [engravers, setEngravers] = useState<any[]>([]);
  const [sotStates, setSotStates] = useState<CatalogItem[]>([]);
  const [subStates, setSubStates] = useState<CatalogItem[]>([]);
  const [audioStates, setAudioStates] = useState<CatalogItem[]>([]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        salesData,
        productsData,
        engraversData,
        sotStatesData,
        subStatesData,
        audioStatesData,
      ] = await Promise.all([
        salesService.getSales(),
        salesService.getProducts(),
        salesService.getEngravers(),
        salesService.getSOTStates(),
        salesService.getSOTSubStates(),
        salesService.getAudioStates(),
      ]);

      setSales(salesData);
      setProducts(productsData);
      setEngravers(engraversData);
      setSotStates(sotStatesData);
      setSubStates(subStatesData);
      setAudioStates(audioStatesData);
    } catch (error) {
      console.error("Error cargando datos de ventas:", error);
      toast.error("Error de coneción al cargar el dashboard de ventas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const createSale = async (payload: SalePayload) => {
    try {
      await salesService.createSale(payload);
      await fetchInitialData();
      toast.success("Venta ingresada correctamente.");
      return true;
    } catch (error) {
      console.error("Error al crear venta:", error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const updateBackoffice = async (id: number, payload: BackofficePayload) => {
    try {
      await salesService.updateSaleByBackoffice(id, payload);
      await fetchInitialData();
      toast.success("Gestión operativa guardada.");
      return true;
    } catch (error) {
      console.error("Error Backoffice:", error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  return {
    sales,
    loading,
    products,
    engravers,
    sotStates,
    subStates,
    audioStates,
    createSale,
    updateBackoffice,
  };
};
