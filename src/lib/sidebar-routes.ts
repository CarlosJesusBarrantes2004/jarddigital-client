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
    adminOnly: true, // Esto es opcional, si quieres que los asesores no vean esto
    items: [
      { label: "Colaboradores", href: "/users" },
      { label: "Asistencia", href: "/attendance", disabled: true },
    ],
  },
  {
    title: "Configuración",
    icon: Settings,
    collapsible: true,
    adminOnly: true, // Esto activa el candadito en el sidebar y lo oculta a no-admins
    items: [
      { label: "Sucursales", href: "/core/sucursales" },
      { label: "Modalidades", href: "/core/modalidades" },
      { label: "Maestros Globales", href: "/core/ubigeos" },
    ],
  },
];
