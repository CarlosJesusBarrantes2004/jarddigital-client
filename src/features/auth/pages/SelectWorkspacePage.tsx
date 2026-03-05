import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Layers, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";
import type { Workspace } from "../types";

export const SelectWorkspacePage = () => {
  const navigate = useNavigate();
  
  // 1. Extraemos activeWorkspace para usarlo como candado
  const { user, activeWorkspace, selectWorkspace, logout } = useAuth();
  
  const workspaces: Workspace[] = user?.sucursales ?? [];

  useEffect(() => {
    if (user?.rol?.codigo === "BACKOFFICE") {
      // 2. CANDADO CRÍTICO: Solo seteamos la sede si NO hay una ya activa
      if (workspaces.length > 0 && !activeWorkspace) {
        selectWorkspace(workspaces[0]);
      }
      // 3. Usamos replace: true para no ensuciar el historial de navegación
      navigate("/dashboard", { replace: true });
    }
  // 4. Deshabilitamos la regla de dependencias exhaustivas aquí para evitar el loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeWorkspace, navigate]);

  const handleSelect = (workspace: Workspace) => {
    selectWorkspace(workspace);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  // Evitamos el parpadeo visual mientras se redirige al Backoffice
  if (user?.rol?.codigo === "BACKOFFICE") return null;
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background font-sans p-8 overflow-hidden transition-colors duration-300">
      {/* Fondo Atmosférico Celeste */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Cabecera */}
        <div className="text-center mb-10">
          <div className="w-[52px] h-[52px] mx-auto mb-5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Layers size={24} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight mb-2">
            Selecciona tu espacio
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            Hola,{" "}
            <strong className="text-foreground font-medium">
              {user?.nombre_completo}
            </strong>
            . Tienes acceso a {workspaces.length} sedes.
          </p>
        </div>

        {/* Lista de sedes */}
        <div className="flex flex-col gap-3">
          {workspaces.map((ws, idx) => (
            <button
              key={ws.id_modalidad_sede}
              onClick={() => handleSelect(ws)}
              className="group flex items-center gap-4 w-full bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${idx * 100 + 100}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors">
                <Building2 size={20} />
              </div>
              <div className="flex-1">
                <span className="block text-[15px] font-medium text-foreground leading-snug">
                  {ws.nombre_sucursal}
                </span>
                <span className="block mt-1 text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
                  {ws.nombre_modalidad}
                </span>
              </div>
              <ChevronRight
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200"
                size={20}
              />
            </button>
          ))}
        </div>

        {/* Botón de Logout */}
        <div className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="group flex items-center justify-center gap-2 mx-auto text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
          >
            <LogOut
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
