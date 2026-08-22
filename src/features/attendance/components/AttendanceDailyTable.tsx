import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Minus,
  Save,
  Loader2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalAttendanceData, useSaveMultiAsistenciaMasiva } from "../api";
import type {
  AsistenciaItemPayload,
  AttendanceUser,
  AttendanceFilters,
} from "../types";
import { useAuth } from "@/features/auth/context/useAuth";
import React from "react";
import { toast } from "sonner";
import { AttendanceFilterBar } from "./AttendanceFilterBar";

interface Props {
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
}

/**
 * Calcula el valor visual por defecto para una celda sin registro en BD:
 * - TODOS los días (incluyendo domingos) → false (no asistió por defecto)
 * - RRHH debe marcar explícitamente "Asistió" para reducir el descuento
 */
function getValorPorDefecto(_fechaISO: string): boolean | null {
  // Por defecto, cualquier día sin marcar se considera "Falta" (false)
  return false;
}

export function AttendanceDailyTable({ filters, onFiltersChange }: Props) {
  const { user } = useAuth();
  const isDueno = user?.rol?.codigo === "DUENO";

  const { data, isLoading } = useGlobalAttendanceData(filters);
  const { users = [], asistencias = [] } = data || {};

  const multiSaveMutation = useSaveMultiAsistenciaMasiva();

  // ─── Día seleccionado dentro del mes ───
  // Por defecto seleccionamos el día de hoy si estamos en el mes actual,
  // o el día 1 si estamos mirando un mes histórico/futuro.
  const todayForced = useMemo(() => {
    const today = new Date();
    const isCurrentMonth =
      filters.mes === today.getMonth() + 1 &&
      filters.anio === today.getFullYear();

    if (isCurrentMonth) {
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(filters.mes).padStart(2, "0");
      return `${filters.anio}-${mm}-${dd}`;
    } else {
      const mm = String(filters.mes).padStart(2, "0");
      return `${filters.anio}-${mm}-01`;
    }
  }, [filters.mes, filters.anio]);

  const [selectedDate, setSelectedDate] = useState(todayForced);

  // Cuando cambia mes/año, resetamos la fecha seleccionada
  useEffect(() => {
    setSelectedDate(todayForced);
  }, [todayForced]);

  // ─── Agrupación por sede ───
  const groupedUsers = useMemo(() => {
    const groups: Record<
      number,
      { id_sucursal: number; nombre_sucursal: string; users: AttendanceUser[] }
    > = {};

    users.forEach((u) => {
      const firstSucursal = u.sucursales?.[0];
      const id_sucursal = firstSucursal?.id_sucursal ?? 0;
      const nombre_sucursal =
        firstSucursal?.nombre_sucursal ?? "Sin Sede Asignada";

      if (!groups[id_sucursal]) {
        groups[id_sucursal] = { id_sucursal, nombre_sucursal, users: [] };
      }
      groups[id_sucursal].users.push(u);
    });

    return Object.values(groups).sort((a, b) =>
      a.nombre_sucursal.localeCompare(b.nombre_sucursal),
    );
  }, [users]);

  const asistenciasDelDia = asistencias.filter((a) => a.fecha === selectedDate);

  const handleToggle = (
    userId: number,
    sucursalId: number,
    newValue: boolean | null,
    currentDBValue: boolean | null,
  ) => {
    if (isDueno) return;
    if (newValue === currentDBValue) return;
    if (sucursalId === 0) {
      toast.error("El colaborador no tiene sede asignada. No se puede guardar su asistencia.");
      return;
    }

    // Si newValue es nulo, significa que queremos "Limpiar",
    // pero el backend actualmente procesa los booleanos. 
    // Por seguridad enviamos el newValue aunque sea null si el backend lo soporta,
    // o sino enviamos la solicitud.
    const payloads = [
      {
        id_sucursal: sucursalId,
        asistencias: [
          {
            id_usuario: userId,
            fecha: selectedDate,
            asistio: newValue,
          },
        ],
      },
    ];

    multiSaveMutation.mutate(payloads);
  };

  // ─── Render ───
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Barra de filtros incluso durante carga */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <AttendanceFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            users={[]}
          />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-[13px] font-medium tracking-wide">
            Recopilando personal de todas las sedes...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Barra de filtros + selector de día ─── */}
      <div className="px-6 py-3 border-b border-border shrink-0 flex flex-wrap items-center gap-3 justify-between">
        <AttendanceFilterBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          users={users}
        />

        {/* Selector de día dentro del mes */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Día
          </span>
          <input
            type="date"
            value={selectedDate}
            min={`${filters.anio}-${String(filters.mes).padStart(2, "0")}-01`}
            max={`${filters.anio}-${String(filters.mes).padStart(2, "0")}-31`}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 px-3 bg-background border border-border rounded-lg text-[12px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 hover:border-primary/40 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* ─── Tabla ─── */}
      <div className="h-[calc(100%-57px)] overflow-auto p-4 md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full pb-32">
        {groupedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-[13px]">
            No hay colaboradores activos que coincidan con los filtros
            aplicados.
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden max-w-[900px] mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground w-1/2">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground text-center">
                    Estado de Asistencia
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/50">
                {groupedUsers.map((group) => (
                  <React.Fragment key={group.id_sucursal}>
                    <tr>
                      <td
                        colSpan={2}
                        className="bg-primary/5 px-5 py-2.5 border-y border-border/50"
                      >
                        <div className="flex items-center gap-2 text-primary">
                          <Building2 size={15} />
                          <span className="text-[12px] font-bold uppercase tracking-wider">
                            Sede: {group.nombre_sucursal}
                          </span>
                          <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full ml-auto font-medium">
                            {group.users.length} Colaboradores
                          </span>
                        </div>
                      </td>
                    </tr>

                    {group.users.map((u) => {
                      const recordDB = asistenciasDelDia.find(
                        (a) => a.id_usuario === u.id,
                      );
                      const currentDBValue = recordDB ? recordDB.asistio : null;
                      
                      // Si no hay registro en BD: usamos valor por defecto
                      const status =
                        currentDBValue !== null
                          ? currentDBValue
                          : getValorPorDefecto(selectedDate);

                      return (
                        <tr
                          key={u.id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                                {u.nombre_completo
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-foreground">
                                  {u.nombre_completo}
                                </span>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                                  {u.rol?.nombre ?? "Usuario"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            {isDueno ? (
                              <div className="flex items-center justify-center">
                                {status === true ? (
                                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <CheckCircle2 size={13} /> Asistió
                                  </span>
                                ) : status === false ? (
                                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    <XCircle size={13} /> Falta
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                                    <Minus size={13} /> Sin marcar
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggle(
                                      u.id,
                                      group.id_sucursal,
                                      true,
                                      currentDBValue,
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border",
                                    status === true
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                      : "bg-transparent border-border text-muted-foreground hover:bg-muted hover:border-emerald-500/30 hover:text-emerald-600",
                                  )}
                                >
                                  <CheckCircle2 size={13} /> Asistió
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggle(
                                      u.id,
                                      group.id_sucursal,
                                      false,
                                      currentDBValue,
                                    )
                                  }
                                  className={cn(
                                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border",
                                    status === false
                                      ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                                      : "bg-transparent border-border text-muted-foreground hover:bg-muted hover:border-rose-500/30 hover:text-rose-600",
                                  )}
                                >
                                  <XCircle size={13} /> Falta
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggle(
                                      u.id,
                                      group.id_sucursal,
                                      null,
                                      currentDBValue,
                                    )
                                  }
                                  title="Limpiar registro"
                                  className={cn(
                                    "flex items-center justify-center w-8 h-[30px] rounded-lg transition-all border",
                                    status === null
                                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                                      : "bg-transparent border-transparent text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground",
                                  )}
                                >
                                  <Minus size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── El Panel flotante de guardado masivo ha sido removido ─── */}
    </>
  );
}
