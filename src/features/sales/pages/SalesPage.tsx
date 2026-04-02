import { useAuth } from "@/features/auth/context/useAuth";
import { AsesorPage } from "./Ventasasesorpage";
import { BackofficePage } from "./Ventasbackofficepage";

export const SalesPage = () => {
  const { user } = useAuth();
  const rol = user?.rol?.codigo ?? "";

  if (rol === "ASESOR") return <AsesorPage></AsesorPage>;

  const soloLectura = rol === "DUENO" || rol === "SUPERVISOR";
  return <BackofficePage soloLectura={soloLectura} />;
};
