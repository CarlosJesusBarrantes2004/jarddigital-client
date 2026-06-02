import { useState } from "react";
import { useAuth } from "@/features/auth/context/useAuth";
import { ShieldAlert } from "lucide-react";
import { AttendanceDailyTable } from "./components/AttendanceDailyTable";
import type { AttendanceFilters } from "./types";

const ALLOWED_ROLES = ["DUENO", "RRHH"];

function getCurrentMonthFilters(): AttendanceFilters {
  const today = new Date();
  return {
    mes: today.getMonth() + 1,
    anio: today.getFullYear(),
    modalidad_sede: null,
    id_sucursal: null,
    rol: null,
  };
}

export function AttendancePage() {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo ?? "";

  const [filters, setFilters] = useState<AttendanceFilters>(
    getCurrentMonthFilters,
  );

  if (!ALLOWED_ROLES.includes(roleCode)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-[18px] font-bold text-foreground">
          Acceso Denegado
        </h2>
        <p className="text-[13px] text-muted-foreground max-w-md">
          Este módulo está restringido exclusivamente para la Gerencia y el área
          de Capital Humano.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="px-6 py-5 border-b border-border shrink-0 space-y-4">
        {/* Título */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground tracking-tight">
            Control de Asistencia Global
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Vista general de colaboradores de todas las sedes operativas
          </p>
        </div>

        {/* Barra de filtros — se importa dentro de la tabla para acceder a los usuarios cargados */}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AttendanceDailyTable filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}
