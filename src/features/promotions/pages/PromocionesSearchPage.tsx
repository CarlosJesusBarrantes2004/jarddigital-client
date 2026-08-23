import { useState, useEffect } from "react";
import { Tag, MapPin, Loader2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PromocionCard } from "../components/PromocionCard";
import { promotionsService } from "../services/promotions.service";
import type { Promocion, Departamento, Provincia, Distrito } from "../types/promotions.types";
import { toast } from "sonner";

export const PromocionesSearchPage = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);

  const [depId, setDepId] = useState<string>("");
  const [provId, setProvId] = useState<string>("");
  const [distId, setDistId] = useState<string>("");

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    promotionsService.getDepartamentos().then(setDepartamentos);
  }, []);

  const handleDepChange = async (val: string) => {
    setDepId(val);
    setProvId("");
    setDistId("");
    setProvincias([]);
    setDistritos([]);
    setPromociones([]);
    setHasSearched(false);
    try {
      const data = await promotionsService.getProvincias(parseInt(val));
      setProvincias(data);
    } catch {
      toast.error("Error al cargar provincias");
    }
  };

  const handleProvChange = async (val: string) => {
    setProvId(val);
    setDistId("");
    setDistritos([]);
    setPromociones([]);
    setHasSearched(false);
    try {
      const data = await promotionsService.getDistritos(parseInt(val));
      setDistritos(data);
    } catch {
      toast.error("Error al cargar distritos");
    }
  };

  const handleDistChange = (val: string) => {
    setDistId(val);
    setPromociones([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!distId) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await promotionsService.buscarPorDistrito(parseInt(distId));
      setPromociones(data);
    } catch {
      toast.error("Error al buscar promociones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen p-6 md:p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
          <Tag size={24} />
        </div>
        <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-foreground leading-tight tracking-tight mb-2">
          Buscador de Promociones
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Selecciona el distrito de instalación del cliente para descubrir las campañas y paquetes disponibles en su zona.
        </p>
      </div>

      {/* Buscador Box */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 md:p-6 mb-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Departamento
            </Label>
            <Select value={depId} onValueChange={handleDepChange}>
              <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Provincia
            </Label>
            <Select value={provId} onValueChange={handleProvChange} disabled={!depId}>
              <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Distrito
            </Label>
            <Select value={distId} onValueChange={handleDistChange} disabled={!provId}>
              <SelectTrigger className="h-12 bg-background border-input hover:border-primary/50 transition-colors">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {distritos.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={!distId || loading}
            className="h-12 w-full gap-2 shadow-md hover:shadow-lg transition-all font-medium text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Buscar Promos
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : hasSearched ? (
        promociones.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-2">
              <MapPin size={16} className="text-primary" />
              Se encontraron {promociones.length} promociones aplicables
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promociones.map((p) => (
                <PromocionCard key={p.id} promocion={p} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search size={32} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Sin resultados</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              No hay promociones registradas para el distrito seleccionado ni para su provincia o departamento.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
};
