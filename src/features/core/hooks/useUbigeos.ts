import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-errors";

import { ubigeoService } from "../services/ubigeoService";

import type { Departament, District, Province } from "../types";

export type UbigeoContext = "Instalacion" | "Nacimiento";

export const useUbigeo = () => {
  const [departments, setDepartments] = useState<Departament[]>([]);

  const [provincesInst, setProvincesInst] = useState<Province[]>([]);
  const [districtsInst, setDistrictsInst] = useState<District[]>([]);

  const [provincesBirth, setProvincesBirth] = useState<Province[]>([]);
  const [districtsBirth, setDistrictsBirth] = useState<District[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await ubigeoService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Error al cargar departamentos", error);
        toast.error("No se pudo conectar con el catálogo de Ubigeos.");
      }
    };
    fetchDepartments();
  }, []);

  const fetchProvinces = useCallback(
    async (departmentId: number, context: UbigeoContext) => {
      try {
        const data = await ubigeoService.getProvinces(departmentId);

        if (context === "Instalacion") {
          setProvincesInst(data);
          setDistrictsInst([]);
        } else {
          setProvincesBirth(data);
          setDistrictsBirth([]);
        }
      } catch (error) {
        console.error("Error al cargar provincias:", error);
        toast.error(extractApiError(error));
      }
    },
    [],
  );

  const fetchDistricts = useCallback(
    async (provinceId: number, context: UbigeoContext) => {
      try {
        const data = await ubigeoService.getDistricts(provinceId);

        if (context === "Instalacion") setDistrictsInst(data);
        else setDistrictsBirth(data);
      } catch (error) {
        console.error("Error al cargar distritos:", error);
        toast.error(extractApiError(error));
      }
    },
    [],
  );

  return {
    departments,
    provincesInst,
    districtsInst,
    provincesBirth,
    districtsBirth,
    fetchProvinces,
    fetchDistricts,
  };
};
