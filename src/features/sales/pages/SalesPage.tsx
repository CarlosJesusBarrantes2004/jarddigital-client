import { useAuth } from "@/features/auth/context/useAuth";
import { VentasAsesorPage } from "./Ventasasesorpage";
import { VentasBackofficePage } from "./Ventasbackofficepage";

/**
 * Punto de entrada único para /sales
 * ASESOR      → VentasAsesorPage   (mis ventas + estadísticas + crear/editar en corrección)
 * BACKOFFICE  → VentasBackofficePage (puede gestionar ventas)
 * SUPERVISOR  → VentasBackofficePage (solo lectura de sus sedes)
 * DUENO       → VentasBackofficePage (visión global, SIN botón gestionar)
 */
export const SalesPage = () => {
  const { user } = useAuth();
  const rol = user?.rol?.codigo ?? "";

  if (rol === "ASESOR") return <VentasAsesorPage />;

  // El DUEÑO puede ver todo pero NO gestionar ventas
  const soloLectura = rol === "DUENO";
  return <VentasBackofficePage soloLectura={soloLectura} />;
};
