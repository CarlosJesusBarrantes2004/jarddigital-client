import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Database, Shield, Smartphone } from "lucide-react";
import { BranchesManager } from "../components/branches/BranchesManager";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { RolesManager } from "../components/roles/RolesManager";
import { ModalitiesManager } from "../components/modalities/ModalitiesManager";

type Tabs = "sucursales" | "modalides" | "roles" | "maestros";

export const CorporativeConfigPage = () => {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  const validTabs = ["sucursales", "modalidades", "roles", "ubigeos"];

  if (tab && !validTabs.includes(tab))
    return <Navigate to={"/configuracion/sucursales"} replace></Navigate>;

  const activeTab = tab || "sucursales";

  const handleTabChange = (value: string) => {
    navigate(`/configuracion/${value}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Configuración Corporativa
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Gestiona sucursales, modalidades, roles y datos maestros.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="sucursales" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="modalidades" className="gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Modalidades</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="maestros" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Maestros</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="sucursales" className="m-0">
            <BranchesManager></BranchesManager>
          </TabsContent>

          <TabsContent value="modalidades" className="m-0">
            <ModalitiesManager></ModalitiesManager>
          </TabsContent>

          <TabsContent value="roles" className="m-0">
            <RolesManager></RolesManager>
          </TabsContent>

          <TabsContent value="maestros" className="m-0">
            <p>Sección de Maestros en construcción...</p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
