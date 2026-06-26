import { api } from "@/api/axios"; // mismo cliente axios que usa el resto del proyecto
import type {
  MatrizPivoteResponse,
  MatrizPivoteParams,
  FilaBarraRendimiento,
  BarrasRendimientoParams,
  TendenciaDiariaResponse,
  TendenciaDiariaParams,
  NivelJerarquicoResponse,
  NivelJerarquicoParams,
} from "../types/analytics.types";

const BASE_URL = "/analytics";

export const analyticsService = {
  /**
   * Gráficos 1 y 3 — Matriz pivote Asesor x Mes
   */
  getMatrizPivote: async (
    params: MatrizPivoteParams,
  ): Promise<MatrizPivoteResponse> => {
    const { data } = await api.get<MatrizPivoteResponse>(
      `${BASE_URL}/matriz-rendimiento/`,
      { params },
    );
    return data;
  },

  /**
   * Gráficos 2 y 4 — Barras de rendimiento por asesor
   * Si se manda `mes` -> snapshot de ese mes (Gráfico 2)
   * Si no se manda `mes` -> evolución mensual completa (Gráfico 4)
   */
  getBarrasRendimiento: async (
    params: BarrasRendimientoParams,
  ): Promise<FilaBarraRendimiento[]> => {
    const { data } = await api.get<FilaBarraRendimiento[]>(
      `${BASE_URL}/barras-rendimiento/`,
      { params },
    );
    return data;
  },

  /**
   * Gráfico 5 — Tendencia diaria de un mes específico
   */
  getTendenciaDiaria: async (
    params: TendenciaDiariaParams,
  ): Promise<TendenciaDiariaResponse> => {
    const { data } = await api.get<TendenciaDiariaResponse>(
      `${BASE_URL}/tendencia-diaria/`,
      { params },
    );
    return data;
  },

  /**
   * Gráfico 6 — Un nivel del árbol jerárquico (drill-down)
   */
  getNivelJerarquico: async (
    params: NivelJerarquicoParams,
  ): Promise<NivelJerarquicoResponse> => {
    const { data } = await api.get<NivelJerarquicoResponse>(
      `${BASE_URL}/distribucion-jerarquica/`,
      { params },
    );
    return data;
  },
};
