import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/features/auth/context/useAuth";
import { GlobalLoader } from "@/components/GlobalLoader";
import { Sidebar } from "@/components/sidebar";
import { ChatRealtimeProvider } from "@/features/chat/context/ChatRealtimeProvider";
import { useChatUnreadTotal } from "@/features/chat/context/useChatRealtime";

export const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading)
    return <GlobalLoader message="Sincronizando con Jard Digital..." />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return (
    <ChatRealtimeProvider>
      <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
        <header className="lg:hidden h-[60px] bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-serif font-bold text-[14px] text-primary-foreground shadow-sm">
              J
            </div>
            <span className="font-serif text-[15px] font-bold tracking-tight">
              Jard Digital
            </span>
          </div>
          <MobileMenuButton onOpen={() => setMobileOpen(true)} />
        </header>

        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main
          className={cn(
            "transition-[padding] duration-300 ease-in-out min-h-[calc(100vh-60px)] lg:min-h-screen",
            expanded ? "lg:pl-[240px]" : "lg:pl-[72px]",
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </ChatRealtimeProvider>
  );
};

const MobileMenuButton = ({ onOpen }: { onOpen: () => void }) => {
  const unread = useChatUnreadTotal();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground border border-sidebar-border shadow-sm active:scale-95 transition-all"
      aria-label={unread > 0 ? `Menú, ${unread} mensajes sin leer` : "Menú"}
    >
      <Menu size={18} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
};
