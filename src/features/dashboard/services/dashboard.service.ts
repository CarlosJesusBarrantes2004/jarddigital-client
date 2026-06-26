import { api } from "@/api/axios";
import type { MisMetricasAsesorResponse } from "../types/dashboard.types";

export const dashboardService = {
  getMisMetricas: async (anio?: number): Promise<MisMetricasAsesorResponse> => {
    const { data } = await api.get<MisMetricasAsesorResponse>(
      "/sales/mis-metricas/",
      { params: anio ? { anio } : {} },
    );
    return data;
  },
};
