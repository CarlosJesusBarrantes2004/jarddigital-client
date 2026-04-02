import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Users,
  Settings,
  ShoppingBag,
  Building2,
  Check,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/features/auth/context/useAuth";
import { useTheme } from "@/components/ThemeProvider"; // Ajusta la ruta a tu ThemeProvider
import type { RoleCode, Workspace } from "@/features/auth/types";

// ─────────────────────────────────────────────
// Rutas (Mismo código que tenías)
// ─────────────────────────────────────────────
interface RouteItem {
  label: string;
  href: string;
  roles: RoleCode[];
  disabled?: boolean;
}
interface RouteSection {
  title: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  collapsible: boolean;
  items: RouteItem[];
}

const SECTIONS: RouteSection[] = [
  {
    title: "Operaciones",
    Icon: LayoutDashboard,
    collapsible: false,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        roles: [
          "DUENO",
          "SUPERVISOR",
          "COORDINADOR",
          "RRHH",
          "BACKOFFICE",
          "ASESOR",
        ],
      },
    ],
  },
  {
    title: "Comercial",
    Icon: ShoppingBag,
    collapsible: true,
    items: [
      { label: "Mis Ventas", href: "/sales", roles: ["ASESOR"] },
      {
        label: "Gestión de Ventas",
        href: "/sales",
        roles: ["BACKOFFICE", "SUPERVISOR", "COORDINADOR", "DUENO"],
      },
    ],
  },
  {
    title: "Capital Humano",
    Icon: Users,
    collapsible: true,
    items: [
      {
        label: "Colaboradores",
        href: "/users",
        roles: ["DUENO", "SUPERVISOR", "RRHH"],
      },
      {
        label: "Asistencia",
        href: "/attendance",
        roles: ["DUENO", "RRHH"],
        disabled: true,
      },
    ],
  },
  {
    title: "Configuración",
    Icon: Settings,
    collapsible: true,
    items: [
      {
        label: "Sucursales",
        href: "/configuracion/sucursales",
        roles: ["DUENO"],
      },
      {
        label: "Modalidades",
        href: "/configuracion/modalidades",
        roles: ["DUENO"],
      },
      { label: "Roles", href: "/configuracion/roles", roles: ["DUENO"] },
      {
        label: "Productos",
        href: "/configuracion/productos",
        roles: ["DUENO"],
      },
    ],
  },
];

const NavItem = ({
  label,
  href,
  disabled,
  expanded,
  onClick,
}: {
  label: string;
  href: string;
  disabled?: boolean;
  expanded: boolean;
  onClick?: () => void;
}) => {
  const { pathname } = useLocation();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  if (disabled) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-muted-foreground/50 cursor-not-allowed">
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-50" />
        {expanded && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              Pronto
            </span>
          </>
        )}
      </div>
    );
  }
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-primary/10 text-primary font-medium hover:text-primary hover:bg-primary/15",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
          isActive ? "bg-primary" : "bg-current opacity-50",
        )}
      />
      {expanded && <span className="flex-1 truncate">{label}</span>}
    </Link>
  );
};

const NavSection = ({
  section,
  roleCode,
  expanded,
  onClickItem,
}: {
  section: RouteSection;
  roleCode: RoleCode;
  expanded: boolean;
  onClickItem?: () => void;
}) => {
  const [open, setOpen] = useState(true);
  const visibleItems = section.items.filter((item) =>
    item.roles.includes(roleCode),
  );
  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-1 overflow-hidden">
      {section.collapsible ? (
        <button
          type="button"
          className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg bg-transparent hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-accent-foreground cursor-pointer"
          onClick={() => setOpen((v) => !v)}
        >
          <section.Icon size={16} className="shrink-0" />
          {expanded && (
            <>
              <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wider font-mono truncate">
                {section.title}
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200 shrink-0",
                  open && "rotate-180",
                )}
              />
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2.5 px-2.5 py-2 w-full text-muted-foreground">
          <section.Icon size={16} className="shrink-0" />
          {expanded && (
            <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wider font-mono truncate">
              {section.title}
            </span>
          )}
        </div>
      )}
      {open && (
        <div className="pl-2 mt-0.5 flex flex-col gap-[1px]">
          {visibleItems.map((item) => (
            <NavItem
              key={item.href + item.label}
              {...item}
              expanded={expanded}
              onClick={onClickItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const WorkspaceSwitcher = ({ expanded }: { expanded: boolean }) => {
  const { user, activeWorkspace, selectWorkspace } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const workspaces: Workspace[] = user?.sucursales ?? [];
  const esVistaGlobal =
    user?.rol?.codigo === "BACKOFFICE" || user?.rol?.codigo === "COORDINADOR";

  if (workspaces.length === 0) return null;

  // ---> NUEVA LÓGICA: BLOQUEO VISUAL PARA BACKOFFICE <---
  if (esVistaGlobal) {
    return (
      <div
        className="w-full h-9 rounded-lg border border-sidebar-border bg-transparent flex items-center justify-center lg:justify-start gap-2.5 lg:px-3 text-muted-foreground opacity-80 cursor-default"
        title="Vista Global Backoffice"
      >
        <Building2 size={14} className="shrink-0" />
        {expanded && (
          <div className="flex-1 overflow-hidden text-left">
            <span className="block text-[13px] font-medium text-sidebar-foreground truncate leading-snug">
              Vista Global
            </span>
            <span className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
              Tus Sedes Asignadas
            </span>
          </div>
        )}
      </div>
    );
  }

  const handleSelect = (ws: Workspace) => {
    selectWorkspace(ws);
    setOpen(false);
    navigate(0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "w-full h-9 rounded-lg border border-sidebar-border bg-transparent flex items-center justify-center lg:justify-start gap-2.5 lg:px-3 text-muted-foreground transition-all duration-150 overflow-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          open &&
            "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5",
        )}
        onClick={() => setOpen((v) => !v)}
        title={!expanded ? activeWorkspace?.nombre_sucursal : undefined}
      >
        <Building2 size={14} className="shrink-0" />
        {expanded && (
          <>
            <div className="flex-1 overflow-hidden text-left">
              <span className="block text-[13px] font-medium text-sidebar-foreground truncate leading-snug">
                {activeWorkspace?.nombre_sucursal ?? "Sin sede"}
              </span>
              <span className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
                {activeWorkspace?.nombre_modalidad ?? "—"}
              </span>
            </div>
            <ChevronDown
              size={12}
              className={cn(
                "shrink-0 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open && expanded && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-full bg-popover border border-border rounded-xl p-2 shadow-xl animate-in slide-in-from-bottom-2 duration-200 z-50">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-2 m-0">
            Cambiar sede
          </p>
          {workspaces.map((ws) => {
            const isActive =
              ws.id_modalidad_sede === activeWorkspace?.id_modalidad_sede;
            return (
              <button
                key={ws.id_modalidad_sede}
                type="button"
                className={cn(
                  "w-full p-2.5 rounded-lg border-none flex items-center gap-2 text-left transition-colors hover:bg-muted text-popover-foreground",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                onClick={() => handleSelect(ws)}
              >
                <div className="flex-1 overflow-hidden">
                  <span className="block text-[13px] font-medium truncate">
                    {ws.nombre_sucursal}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
                    {ws.nombre_modalidad}
                  </span>
                </div>
                {isActive && (
                  <Check size={14} className="text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Sidebar principal
// Recibe props para controlar su estado desde el Layout
// ─────────────────────────────────────────────

interface SidebarProps {
  expanded: boolean;
  setExpanded: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar = ({
  expanded,
  setExpanded,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const roleCode = (user?.rol?.codigo ?? "ASESOR") as RoleCode;

  // Lógica para alternar temas (Claro -> Oscuro -> Sistema)
  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun size={14} className="shrink-0" />;
    if (theme === "dark") return <Moon size={14} className="shrink-0" />;
    return <Laptop size={14} className="shrink-0" />;
  };

  const getThemeLabel = () => {
    if (theme === "light") return "Modo Claro";
    if (theme === "dark") return "Modo Oscuro";
    return "Tema del Sistema";
  };

  return (
    <>
      {/* ── Overlay Mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col font-sans transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
          expanded ? "w-[240px]" : "w-[72px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* 1. Header FIJO */}
        <div className="h-[64px] flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all duration-300",
              !expanded && "mx-auto",
            )}
          >
            <div className="w-[32px] h-[32px] rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-serif font-bold text-[15px] text-primary-foreground shadow-sm shrink-0">
              J
            </div>
            {expanded && (
              <span className="text-[15px] font-bold text-sidebar-foreground truncate tracking-tight">
                Jard Digital
              </span>
            )}
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-transparent bg-transparent hidden lg:flex items-center justify-center text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* 2. CONTENEDOR SCROLLEABLE (Usuario + Nav + Bottom) */}
        <div className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
          {/* User info */}
          {user && (
            <div
              className={cn(
                "p-4 border-b border-sidebar-border flex items-center gap-3 overflow-hidden shrink-0",
                !expanded && "justify-center",
              )}
            >
              <div className="w-[32px] h-[32px] rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">
                {user.nombre_completo.substring(0, 2).toUpperCase()}
              </div>
              {expanded && (
                <div className="overflow-hidden flex-1">
                  <span className="block text-[13px] font-semibold text-sidebar-foreground truncate">
                    {user.nombre_completo}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate mt-0.5">
                    {user.rol?.codigo}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <NavSection
                key={section.title}
                section={section}
                roleCode={roleCode}
                expanded={expanded}
                onClickItem={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          {/* Bottom (usamos mt-auto para empujarlo al fondo si la pantalla es alta) */}
          <div className="mt-auto border-t border-sidebar-border p-3 flex flex-col gap-2 shrink-0">
            <WorkspaceSwitcher expanded={expanded} />

            {/* Botón Theme */}
            <button
              type="button"
              className="group w-full h-9 rounded-lg border border-transparent bg-transparent flex items-center justify-center lg:justify-start gap-2.5 lg:px-3 text-muted-foreground font-sans text-[13px] transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground overflow-hidden whitespace-nowrap"
              onClick={cycleTheme}
            >
              {getThemeIcon()}
              {expanded && <span>{getThemeLabel()}</span>}
            </button>

            {/* Logout */}
            <button
              type="button"
              className="group w-full h-9 rounded-lg border border-sidebar-border bg-transparent flex items-center justify-center lg:justify-start gap-2.5 lg:px-3 text-muted-foreground font-sans text-[13px] transition-all hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive overflow-hidden whitespace-nowrap"
              onClick={logout}
            >
              <LogOut
                size={14}
                className="shrink-0 group-hover:-translate-x-0.5 transition-transform"
              />
              {expanded && "Cerrar sesión"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
