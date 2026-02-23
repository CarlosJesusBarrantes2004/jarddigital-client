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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Configuración Corporativa
        </h1>
        <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">
          Gestiona sucursales, modalidades operativas y roles del sistema.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] h-11 p-1 bg-slate-100/80 rounded-lg">
          <TabsTrigger
            value="sucursales"
            className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Sucursales</span>
          </TabsTrigger>

          <TabsTrigger
            value="modalidades"
            className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Modalidades</span>
          </TabsTrigger>

          <TabsTrigger
            value="roles"
            className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Roles</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <TabsContent
            value="sucursales"
            className="m-0 border-none outline-none"
          >
            <BranchesManager />
          </TabsContent>

          <TabsContent
            value="modalidades"
            className="m-0 border-none outline-none"
          >
            <ModalitiesManager />
          </TabsContent>

          <TabsContent value="roles" className="m-0 border-none outline-none">
            <RolesManager />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
