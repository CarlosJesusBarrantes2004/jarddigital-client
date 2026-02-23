import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-errors";

import { coreService } from "../services/coreService";

import type { Branch, Modality, BranchPayload } from "../types";

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const [branchesData, modalitiesData] = await Promise.all([
        coreService.getBranches(),
        coreService.getModalities(),
      ]);

      setBranches(branchesData);
      setModalities(modalitiesData);
    } catch (error) {
      console.error("Error fetching core data:", error);
      toast.error(
        "No se pudieron cargar los datos de configuración corporativa.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const createBranch = async (payload: BranchPayload) => {
    try {
      await coreService.createBranch(payload);
      await fetchInitialData();
      toast.success("Sucursal creada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const updateBranch = async (id: number, payload: BranchPayload) => {
    try {
      await coreService.updateBranch(id, payload);
      await fetchInitialData();
      toast.success("Sucursal actualizada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const deleteBranch = async (id: number) => {
    try {
      await coreService.deleteBranch(id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("Sucursal desactivada exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  return {
    branches,
    modalities,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
  };
};
