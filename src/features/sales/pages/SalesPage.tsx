import { useAuth } from "@/features/auth/context/useAuth";
import { VentasAsesorPage } from "./Ventasasesorpage";
import { VentasBackofficePage } from "./Ventasbackofficepage";

/**
 * Punto de entrada único para /sales
 * ASESOR      → VentasAsesorPage   (mis ventas + estadísticas + crear/editar en corrección)
 * BACKOFFICE  → VentasBackofficePage (gestión de ventas)
 * SUPERVISOR  → VentasBackofficePage (solo lectura de sus sedes)
 * DUENO       → VentasBackofficePage (visión global)
 */
export const SalesPage = () => {
  const { user } = useAuth();
  const rol = user?.rol?.codigo ?? "";

  if (rol === "ASESOR") return <VentasAsesorPage />;
  return <VentasBackofficePage />;
};
