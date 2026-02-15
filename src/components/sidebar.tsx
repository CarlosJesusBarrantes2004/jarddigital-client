import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Users,
  PhoneCall,
  TrendingUp,
  FileText,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/useAuth";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  submenu?: Array<{ label: string; href: string }>;
  isActive?: boolean;
}

const MenuItem: React.FC<
  MenuItemProps & { onClick?: () => void; expanded?: boolean }
> = ({ icon, label, href, submenu, isActive, onClick, expanded }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const content = (
    <>
      <span className="text-xl flex-shrink-0">{icon}</span>
      {expanded && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {submenu && (
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isSubmenuOpen && "rotate-180",
              )}
            />
          )}
        </>
      )}
    </>
  );

  const buttonClassName = cn(
    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
  );

  return (
    <div>
      {href && !submenu ? (
        <Link to={href} onClick={onClick}>
          <div className={buttonClassName}>{content}</div>
        </Link>
      ) : (
        <button
          onClick={() => {
            if (submenu) setIsSubmenuOpen(!isSubmenuOpen);
            onClick?.();
          }}
          className={buttonClassName}
        >
          {content}
        </button>
      )}
      {submenu && isSubmenuOpen && expanded && (
        <div className="pl-8 mt-2 space-y-1">
          {submenu.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block px-4 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();

  const handleChangeModality = () => {
    sessionStorage.removeItem("currentModality");
    const currentUser = sessionStorage.getItem("currentUser");
    const currentBranch = sessionStorage.getItem("currentBranch");
    if (currentUser && currentBranch) {
      sessionStorage.setItem("pendingUser", currentUser);
      navigate("/auth/select-modality");
    }
  };

  const menuItems: MenuItemProps[] = [
    {
      icon: <PhoneCall className="w-5 h-5" />,
      label: "Campañas",
      href: "/campaigns",
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      label: "Personal RH",
      href: "/hr",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Ventas",
      href: "/sales",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Reportes",
      href: "/reports",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Usuarios",
      href: "/users",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "BI",
      href: "/bi",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Documentación",
      submenu: [
        { label: "Guía de usuario", href: "/docs/user-guide" },
        { label: "Políticas", href: "/docs/policies" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40",
          isExpanded ? "w-64" : "w-20",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          {isExpanded && (
            <h1 className="text-xl font-bold text-sidebar-primary">
              Jard Digital
            </h1>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden lg:flex p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, i) => (
            <MenuItem
              key={i}
              {...item}
              expanded={isExpanded}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Change Modality & Logout Buttons */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            onClick={handleChangeModality}
            variant="outline"
            className={cn(
              "w-full flex items-center gap-3 border-sidebar-border text-sidebar-foreground hover:bg-primary/10 hover:text-primary",
              !isExpanded && "justify-center",
            )}
            title="Cambiar modalidad de trabajo"
          >
            <Smartphone className="w-5 h-5" />
            {isExpanded && "Cambiar Modalidad"}
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className={cn(
              "w-full flex items-center gap-3 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive",
              !isExpanded && "justify-center",
            )}
          >
            <LogOut className="w-5 h-5" />
            {isExpanded && "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
};
