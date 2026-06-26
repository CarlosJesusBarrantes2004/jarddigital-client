import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardService } from "../services/dashboard.service";

export const useMisMetricas = (anio?: number) => {
  return useQuery({
    queryKey: ["dashboard", "mis-metricas", anio],
    queryFn: () => dashboardService.getMisMetricas(anio),
    staleTime: 1000 * 60 * 2,
    meta: {
      onError: (error: unknown) => {
        console.error("[dashboard] mis-metricas:", error);
        toast.error("No se pudo cargar tu panel de métricas.");
      },
    },
  });
};
