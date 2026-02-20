import { useState, useEffect, useCallback } from "react";
import { coreService } from "../services/coreService";
import type { Modality } from "../types";

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModalities();
  }, [fetchModalities]);

  const createModality = async (payload: {
    nombre: string;
    activo: boolean;
  }) => {
    try {
      await coreService.createModality(payload);
      await fetchModalities();
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateModality = async (
    id: number,
    payload: { nombre: string; activo: boolean },
  ) => {
    try {
      await coreService.updateModality(id, payload);
      await fetchModalities();
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteModality = async (id: number) => {
    try {
      await coreService.deleteModality(id);
      setModalities((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (error) {
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
