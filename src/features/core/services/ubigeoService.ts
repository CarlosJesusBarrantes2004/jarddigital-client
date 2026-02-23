import { api } from "@/api/axios";

import type { Departament, District, Province } from "../types";

export const ubigeoService = {
  getDepartments: async () => {
    const { data } = await api.get<Departament[]>("/ubigeo/departamentos/");
    return data;
  },

  getProvinces: async (departmentId: number) => {
    const { data } = await api.get<Province[]>(
      `/ubigeo/provincias/?id_departamento=${departmentId}`,
    );
    return data;
  },

  getDistricts: async (provinceId: number) => {
    const { data } = await api.get<District[]>(
      `/ubigeo/distritos/?id_provincia=${provinceId}`,
    );
    return data;
  },
};
