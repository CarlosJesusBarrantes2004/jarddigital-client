import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Menu, X, ChevronDown, Smartphone, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sidebarSections } from "@/lib/sidebar-routes";
import { useAuth } from "@/features/auth/context/useAuth";

interface SectionItemProps {
  label: string;
  href: string;
  disabled?: boolean;
  expanded?: boolean;
  onClickItem?: () => void;
}

const SectionItem: React.FC<SectionItemProps> = ({
  label,
  href,
  disabled,
  expanded,
  onClickItem,
}) => {
  if (disabled) {
    return (
      <div
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/50 opacity-50 cursor-not-allowed",
          "relative",
        )}
      >
        <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
        {expanded && <span className="flex-1">{label}</span>}
        {expanded && (
          <Badge variant="outline" className="text-xs">
            Pronto
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Link to={href} onClick={onClickItem}>
      <div className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
        <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
        {expanded && <span className="flex-1">{label}</span>}
      </div>
    </Link>
  );
};

interface SectionProps {
  section: (typeof sidebarSections)[0];
  isCollapsed: boolean;
  isExpanded: boolean;
  isAdmin?: boolean;
  onClickItem?: () => void;
}

const Section: React.FC<SectionProps> = ({
  section,
  isCollapsed,
  isExpanded,
  isAdmin = true,
  onClickItem,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = section.icon;

  if (section.adminOnly && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-2">
      {section.collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors group"
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <>
              <span className="flex-1 text-left">{section.title}</span>
              {section.adminOnly && (
                <Lock
                  className="w-3 h-3 text-sidebar-foreground/40"
                  title="Solo administradores"
                />
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>
      ) : (
        <div className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold text-sidebar-foreground">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <>
              <span className="flex-1 text-left">{section.title}</span>
              {section.adminOnly && (
                <Lock
                  className="w-3 h-3 text-sidebar-foreground/40"
                  title="Solo administradores"
                />
              )}
            </>
          )}
        </div>
      )}

      {isOpen && (
        <div className="space-y-1 pl-2">
          {section.items.map((item) => (
            <SectionItem
              key={item.href}
              {...item}
              expanded={isExpanded}
              onClickItem={onClickItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = user?.rol?.codigo === "DUENO";

  const handleLogout = async () => {
    await logout();
  };

  const handleChangeModality = () => {
    navigate("/select-branch");
  };

  return (
    <>
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

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40",
          isExpanded ? "w-64" : "w-20",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
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

        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {sidebarSections.map((section) => (
            <Section
              key={section.title}
              section={section}
              isCollapsed={!isExpanded}
              isExpanded={isExpanded}
              isAdmin={isAdmin}
              onClickItem={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>

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
            onClick={handleLogout}
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

      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
