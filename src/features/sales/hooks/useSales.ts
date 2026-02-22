import { useState, useEffect, useCallback } from "react";
import { salesService } from "../services/salesService";
import type { Venta, VentaPayload, BackofficePayload } from "../types";
import { toast } from "sonner";

export const useSales = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para catálogos
  const [productos, setProductos] = useState<any[]>([]);
  const [grabadores, setGrabadores] = useState<any[]>([]);
  const [estadosSOT, setEstadosSOT] = useState<any[]>([]);
  const [subEstados, setSubEstados] = useState<any[]>([]);
  const [estadosAudio, setEstadosAudio] = useState<any[]>([]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Optimizamos cargando todo en paralelo
      const [vData, pData, gData, eSotData, subData, eAudioData] =
        await Promise.all([
          salesService.getVentas(),
          salesService.getProductos(),
          salesService.getGrabadores(),
          salesService.getEstadosSOT(),
          salesService.getSubEstadosSOT(),
          salesService.getEstadosAudio(),
        ]);

      setVentas(vData);
      setProductos(pData);
      setGrabadores(gData);
      setEstadosSOT(eSotData);
      setSubEstados(subData);
      setEstadosAudio(eAudioData);
    } catch (error) {
      console.error("Error cargando datos de ventas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const createVenta = async (payload: VentaPayload) => {
    try {
      await salesService.createVenta(payload);
      await fetchInitialData(); // Recarga la tabla
      return true;
    } catch (error) {
      console.error(
        "⛔ ERROR DE DJANGO:",
        error.response?.data || error.message,
      );

      // Opcional: Mostrarle una alerta rápida a ti (o al usuario) para no tener que abrir la consola
      if (error.response?.data) {
        alert("Error del Backend: " + JSON.stringify(error.response.data));
      }

      return false;
    }
  };

  const updateBackoffice = async (id: number, payload: BackofficePayload) => {
    try {
      await salesService.updateVentaBackoffice(id, payload);
      toast.success("Venta actualizada exitosamente"); // <-- Usamos Toast
      await fetchInitialData();
      return true;
    } catch (error: any) {
      console.error("⛔ Error Backoffice:", error.response?.data);

      // Magia para extraer el primer mensaje de error del JSON de Django
      if (error.response?.data) {
        const errorData = error.response.data;
        // Obtenemos la primera llave del error (ej. 'fecha_real_inst' o 'id_estado_sot')
        const firstErrorKey = Object.keys(errorData)[0];
        const errorMessage = errorData[firstErrorKey];
        toast.error(`${firstErrorKey}: ${errorMessage}`);
      } else {
        toast.error("Error al actualizar la venta");
      }
      return false;
    }
  };

  return {
    ventas,
    loading,
    productos,
    grabadores,
    estadosSOT,
    subEstados,
    estadosAudio,
    createVenta,
    updateBackoffice,
  };
};
