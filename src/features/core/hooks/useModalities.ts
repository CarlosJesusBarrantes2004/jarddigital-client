import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-errors";

import { coreService } from "../services/coreService";

import type { Modality, ModalityPayload } from "../types";

export const useModalities = () => {
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModalities = useCallback(async () => {
    setLoading(true);

    try {
      const data = await coreService.getModalities();

      setModalities(data);
    } catch (error) {
      console.error("Error fetching modalities:", error);
      toast.error(
        "No se pudieron cargar los datos de configuración corporativa.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModalities();
  }, [fetchModalities]);

  const createModality = async (payload: ModalityPayload) => {
    try {
      await coreService.createModality(payload);
      await fetchModalities();
      toast.success("Modalidad creada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const updateModality = async (
    id: number,
    payload: Partial<ModalityPayload>,
  ) => {
    try {
      await coreService.updateModality(id, payload);
      await fetchModalities();
      toast.success("Modalidad actualizada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const deleteModality = async (id: number) => {
    try {
      await coreService.deleteModality(id);
      setModalities((prev) => prev.filter((m) => m.id !== id));
      toast.success("Modalidad desactivada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  return {
    modalities,
    loading,
    createModality,
    updateModality,
    deleteModality,
  };
};
