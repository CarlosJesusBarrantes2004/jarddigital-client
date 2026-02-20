import { LayoutDashboard, Users, Settings } from "lucide-react";

export const sidebarSections = [
  {
    title: "Operaciones",
    icon: LayoutDashboard,
    collapsible: false,
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Ventas", href: "/sales" },
    ],
  },
  {
    title: "Capital Humano",
    icon: Users,
    collapsible: true,
    adminOnly: true,
    items: [
      { label: "Colaboradores", href: "/users" },
      { label: "Asistencia", href: "/attendance", disabled: true },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    collapsible: true,
    adminOnly: true,
    items: [
      { label: "Sucursales", href: "/configuracion/sucursales" },
      { label: "Modalidades", href: "/configuracion/modalidades" },
      { label: "Roles", href: "/configuracion/roles" },
      { label: "Maestros Globales", href: "/configuracion/ubigeos" },
    ],
  },
];
