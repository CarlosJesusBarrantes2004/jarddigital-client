import { useState, useEffect } from "react";
import { api } from "@/api/axios";
import type { Departamento, Distrito, Provincia } from "@/features/sales/types";

export const useUbigeo = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Estados para Instalación
  const [provinciasInst, setProvinciasInst] = useState<Provincia[]>([]);
  const [distritosInst, setDistritosInst] = useState<Distrito[]>([]);

  // Estados para Nacimiento (separados para que no choquen)
  const [provinciasNac, setProvinciasNac] = useState<Provincia[]>([]);
  const [distritosNac, setDistritosNac] = useState<Distrito[]>([]);

  // Cargar departamentos al inicio
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const { data } = await api.get<Departamento[]>(
          "/ubigeo/departamentos/",
        );
        setDepartamentos(data);
      } catch (error) {
        console.error("Error al cargar departamentos", error);
      }
    };
    fetchDepartamentos();
  }, []);

  // Funciones para cargar Provincias y Distritos filtrados
  const fetchProvincias = async (
    departamentoId: number,
    tipo: "Instalacion" | "Nacimiento",
  ) => {
    try {
      const { data } = await api.get<Provincia[]>(
        `/ubigeo/provincias/?id_departamento=${departamentoId}`,
      );
      if (tipo === "Instalacion") {
        setProvinciasInst(data);
        setDistritosInst([]); // Limpiamos distritos al cambiar deprovincia
      } else {
        setProvinciasNac(data);
        setDistritosNac([]);
      }
    } catch (error) {
      console.error("Error al cargar provincias", error);
    }
  };

  const fetchDistritos = async (
    provinciaId: number,
    tipo: "Instalacion" | "Nacimiento",
  ) => {
    try {
      const { data } = await api.get<Distrito[]>(
        `/ubigeo/distritos/?id_provincia=${provinciaId}`,
      );
      if (tipo === "Instalacion") setDistritosInst(data);
      else setDistritosNac(data);
    } catch (error) {
      console.error("Error al cargar distritos", error);
    }
  };

  return {
    departamentos,
    provinciasInst,
    distritosInst,
    provinciasNac,
    distritosNac,
    fetchProvincias,
    fetchDistritos,
  };
};
