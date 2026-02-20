import { useCallback, useEffect, useState } from "react";
import type { Branch, BranchModality, BranchPayload } from "../types";
import { coreService } from "../services/coreService";

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [modalities, setModalities] = useState<BranchModality[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const [branchesData, modalitiesData] = await Promise.all([
        coreService.getBranches(),
        coreService.getModalities(),
      ]);

      console.log(branchesData, modalitiesData);

      setBranches(branchesData);
      setModalities(modalitiesData);
    } catch (error) {
      console.error("Error fetching core data:", error);
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
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const updateBranch = async (id: number, payload: BranchPayload) => {
    try {
      await coreService.updateBranch(id, payload);
      await fetchInitialData();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const deleteBranch = async (id: number) => {
    try {
      await coreService.deleteBranch(id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (error) {
      console.error(error);
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
