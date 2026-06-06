import { useState } from "react";
import { useAuth } from "@/features/auth/context/useAuth";
import { ShieldAlert, Download, Loader2 } from "lucide-react";
import { AttendanceDailyTable } from "./components/AttendanceDailyTable";
import type { AttendanceFilters } from "./types";
import { exportarExcelAsistencias } from "./api";
import { toast } from "sonner";

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

  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportarExcelAsistencias(filters);
    } catch (error) {
      toast.error("Ocurrió un error al intentar descargar el reporte.");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="px-6 py-5 border-b border-border shrink-0 flex items-start justify-between gap-4">
        {/* Título */}
        <div>
          <h1 className="text-[18px] font-bold text-foreground tracking-tight">
            Control de Asistencia Global
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Vista general de colaboradores de todas las sedes operativas
          </p>
        </div>

        {/* Botón Exportar */}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? "Generando..." : "Exportar Mensual"}
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AttendanceDailyTable filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}
