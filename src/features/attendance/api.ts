import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import type {
  AsistenciaRecord,
  AttendanceUser,
  SaveAsistenciaMasivaPayload,
  RolSistema,
  AttendanceFilters,
} from "./types";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-errors";

export const attendanceKeys = {
  all: ["attendance"] as const,
  global: (filters: AttendanceFilters) =>
    [...attendanceKeys.all, "global", filters] as const,
  roles: () => [...attendanceKeys.all, "roles"] as const,
};

// Traemos asistencias ya filtradas desde el backend según los filtros activos
export function useGlobalAttendanceData(filters: AttendanceFilters) {
  const { mes, anio, id_sucursal, modalidad_sede, rol } = filters;

  // Obtenemos los roles almacenados en caché para poder mapear el código al ID numérico
  const qc = useQueryClient();
  const cachedRoles =
    qc.getQueryData<RolSistema[]>(attendanceKeys.roles()) || [];

  return useQuery({
    queryKey: attendanceKeys.global(filters),
    queryFn: async () => {
      // Params para el endpoint de usuarios (excluye DUEÑO a nivel de UI)
      const userParams: Record<string, any> = {
        activo: true,
        page_size: 500,
      };

      // Params para el endpoint de asistencias (backend ya excluye DUEÑO via selector)
      const asistenciaParams: Record<string, any> = { mes, anio };

      // Aplicamos filtros opcionales si están activos
      if (id_sucursal) {
        userParams.id_modalidad_sede = id_sucursal; // reusamos el filtro de sede en users
        asistenciaParams.id_sucursal = id_sucursal;
      }
      if (modalidad_sede) {
        userParams.id_modalidad_sede = modalidad_sede;
        asistenciaParams.modalidad_sede = modalidad_sede;
      }
      if (rol) {
        // CORRECCIÓN QA: DjangoFilterBackend espera el id numérico del rol, no el string
        const rolEncontrado = cachedRoles.find((r) => r.codigo === rol);
        if (rolEncontrado) {
          userParams.id_rol = rolEncontrado.id;
        }
        // El endpoint de asistencias sí podría aceptar un String u omitirlo porque cruza internamente
        asistenciaParams.rol = rol;
      }

      const [usersRes, asisRes] = await Promise.all([
        api.get<any>("/users/empleados/", { params: userParams }),
        api.get<AsistenciaRecord[]>("/finances/asistencias/", {
          params: asistenciaParams,
        }),
      ]);

      const usersData: AttendanceUser[] = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data?.results || [];

      // Excluimos DUEÑO en frontend también (defensa en profundidad)
      const colaboradores = usersData.filter(
        (u) =>
          u.rol?.codigo !== "DUENO" && (u as any).id_rol?.codigo !== "DUENO",
      );

      return {
        users: colaboradores,
        asistencias: (asisRes.data || []) as AsistenciaRecord[],
      };
    },
    staleTime: 1000 * 60 * 2,
    // Aseguramos que la llamada se haga incluso si todavía no cargan los roles,
    // pero idealmente useRoles debería haberse llamado antes en el ciclo de vida (en AttendanceFilterBar).
  });
}

// Traemos los roles disponibles para el filtro (excluimos DUEÑO en UI)
export function useRoles() {
  return useQuery({
    queryKey: attendanceKeys.roles(),
    queryFn: async () => {
      const res = await api.get<RolSistema[]>("/users/roles/");
      const data: RolSistema[] = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.results || [];
      // Excluimos DUEÑO del selector de filtros
      return data.filter((r) => r.codigo !== "DUENO" && r.activo !== false);
    },
    staleTime: 1000 * 60 * 10, // Los roles cambian poco
  });
}

// Guardado Masivo en paralelo agrupado por sedes
export function useSaveMultiAsistenciaMasiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payloads: SaveAsistenciaMasivaPayload[]) => {
      const promises = payloads.map((payload) =>
        api.post("/finances/asistencias/guardado_masivo/", payload),
      );
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      toast.success("Asistencias guardadas exitosamente");
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      toast.error(extractApiError(error));
    },
  });
}

export async function exportarExcelAsistencias(filters: AttendanceFilters) {
  // Limpiamos los filtros para no enviar nulos
  const cleanFilters: Record<string, any> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      cleanFilters[k] = v;
    }
  });

  const response = await api.get("/finances/asistencias/exportar_excel/", {
    params: cleanFilters,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;

  // El nombre de archivo lo determina el backend (Content-Disposition),
  // pero le ponemos un fallback por si acaso
  const contentDisposition = response.headers["content-disposition"];
  let filename = `Asistencias_${filters.mes}_${filters.anio}.xlsx`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch?.length === 2) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
