import type { role_code } from "@/features/auth/types";
import { LayoutDashboard, Users, Settings } from "lucide-react";

type RoleArray = role_code[];

export const sidebarSections = [
  {
    title: "Operaciones",
    icon: LayoutDashboard,
    collapsible: false,
    items: [
      // Todos pueden ver el Dashboard inicial
      {
        label: "Dashboard",
        href: "/dashboard",
        roles: [
          "DUENO",
          "SUPERVISOR",
          "RRHH",
          "BACKOFFICE",
          "ASESOR",
        ] as RoleArray,
      },
      // RRHH no ve ventas
      {
        label: "Ventas",
        href: "/sales",
        roles: ["DUENO", "SUPERVISOR", "BACKOFFICE", "ASESOR"] as RoleArray,
      },
    ],
  },
  {
    title: "Capital Humano",
    icon: Users,
    collapsible: true,
    items: [
      // Backoffice y Asesor no ven colaboradores
      {
        label: "Colaboradores",
        href: "/users",
        roles: ["DUENO", "SUPERVISOR", "RRHH"] as RoleArray,
      },
      // Solo Dueño y RRHH ven asistencia
      {
        label: "Asistencia",
        href: "/attendance",
        disabled: true,
        roles: ["DUENO", "RRHH"] as RoleArray,
      },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    collapsible: true,
    items: [
      // Solo el dueño entra a la configuración del sistema
      {
        label: "Sucursales",
        href: "/configuracion/sucursales",
        roles: ["DUENO"] as RoleArray,
      },
      {
        label: "Modalidades",
        href: "/configuracion/modalidades",
        roles: ["DUENO"] as RoleArray,
      },
      {
        label: "Roles",
        href: "/configuracion/roles",
        roles: ["DUENO"] as RoleArray,
      },
    ],
  },
];
