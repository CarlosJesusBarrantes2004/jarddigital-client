import { useAuth } from "@/features/auth/context/useAuth";
import { AsesorPage } from "./Ventasasesorpage";
import { BackofficePage } from "./Ventasbackofficepage";

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

  if (rol === "ASESOR") return <AsesorPage></AsesorPage>;

  // El DUEÑO puede ver todo pero NO gestionar ventas
  const soloLectura = rol === "DUENO";
  return <BackofficePage soloLectura={soloLectura} />;
};
