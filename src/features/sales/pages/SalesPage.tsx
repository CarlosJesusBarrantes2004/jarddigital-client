import { useAuth } from "@/features/auth/context/useAuth";
import { VentasAsesorPage } from "./Ventasasesorpage";
import { VentasBackofficePage } from "./Ventasbackofficepage";

/**
 * Punto de entrada único para /sales
 * El componente decide qué vista renderizar según el rol del usuario.
 *
 * ASESOR      → VentasAsesorPage   (mis ventas + estadísticas + crear/reingresar)
 * BACKOFFICE  → VentasBackofficePage (gestión de ventas de su sucursal)
 * SUPERVISOR  → VentasBackofficePage (lectura de ventas de sus sedes)
 * DUENO       → VentasBackofficePage (visión global)
 */
export const SalesPage = () => {
  const { user } = useAuth();
  const rol = user?.rol?.codigo ?? "";

  if (rol === "ASESOR") {
    return <VentasAsesorPage />;
  }

  // BACKOFFICE, SUPERVISOR, DUENO → vista de gestión
  return <VentasBackofficePage />;
};
