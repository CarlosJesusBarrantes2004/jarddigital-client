import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Building2, Shield, Smartphone } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BranchesManager } from "../components/branches/BranchesManager";
import { ModalitiesManager } from "../components/modalities/ModalitiesManager";
import { RolesManager } from "../components/roles/RolesManager";

type ConfigTab = "sucursales" | "modalidades" | "roles";
const VALID_TABS: ConfigTab[] = ["sucursales", "modalidades", "roles"];

export const CorporativeConfigPage = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  const isValidTab = tab && VALID_TABS.includes(tab as ConfigTab);

  if (!isValidTab && tab !== undefined)
    return <Navigate to="/configuracion/sucursales" />;

  const activeTab = (tab as ConfigTab) || "sucursales";

  const handleTabChange = (value: string) => {
    navigate(`/configuracion/${value}`);
  };

  return (
    <div className="font-sans min-h-screen p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="font-serif text-[clamp(1.6rem,3vw,2.25rem)] font-bold text-foreground leading-tight mb-2 tracking-tight">
          Configuración Corporativa
        </h1>
        <p className="text-sm text-muted-foreground font-light max-w-2xl">
          Arquitectura del sistema. Gestiona las sucursales operativas,
          modalidades de atención y roles de seguridad.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Selector de Tabs Premium */}
        <TabsList className="flex w-full md:w-fit p-1.5 bg-card/80 backdrop-blur-md border border-border rounded-2xl h-auto shadow-sm">
          <TabsTrigger
            value="sucursales"
            className="flex-1 md:flex-none gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-300"
          >
            <Building2 size={16} />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>

          <TabsTrigger
            value="modalidades"
            className="flex-1 md:flex-none gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-300"
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">Modalidades</span>
          </TabsTrigger>

          <TabsTrigger
            value="roles"
            className="flex-1 md:flex-none gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-300"
          >
            <Shield size={16} />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenidos */}
        <div className="mt-8 relative ring-offset-background focus-visible:outline-none">
          <TabsContent
            value="sucursales"
            className="m-0 border-none outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300"
          >
            <BranchesManager />
          </TabsContent>

          <TabsContent
            value="modalidades"
            className="m-0 border-none outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300"
          >
            <ModalitiesManager />
          </TabsContent>

          <TabsContent
            value="roles"
            className="m-0 border-none outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300"
          >
            <RolesManager />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
