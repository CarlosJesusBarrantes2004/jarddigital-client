import { useState, useEffect, useRef } from "react";
import { Tag, MapPin, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PromocionCard } from "../components/PromocionCard";
import { promotionsService } from "../services/promotions.service";
import type { Promocion } from "../types/promotions.types";
import { toast } from "sonner";

export const PromocionesSearchPage = () => {
  const [query, setQuery] = useState("");
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<any | null>(null);
  
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cerrar dropdown si se hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda autocompletado
  useEffect(() => {
    if (distritoSeleccionado) return; // No buscar si ya se seleccionó uno
    if (query.trim().length < 3) {
      setSugerencias([]);
      setMostrarDropdown(false);
      return;
    }

    const fetchDistritos = async () => {
      setBuscando(true);
      try {
        const res = await promotionsService.buscarDistritos(query);
        setSugerencias(res);
        setMostrarDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setBuscando(false);
      }
    };
    
    const timeout = setTimeout(fetchDistritos, 400); // debounce 400ms
    return () => clearTimeout(timeout);
  }, [query, distritoSeleccionado]);

  const seleccionarDistrito = (d: any) => {
    setDistritoSeleccionado(d);
    setQuery(`${d.nombre}, ${d.nombre_provincia}, ${d.nombre_departamento}`);
    setMostrarDropdown(false);
    setPromociones([]);
    setHasSearched(false);
  };

  const limpiar = () => {
    setDistritoSeleccionado(null);
    setQuery("");
    setPromociones([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!distritoSeleccionado) return;
    setLoadingPromos(true);
    setHasSearched(true);
    try {
      const data = await promotionsService.buscarPorDistrito(distritoSeleccionado.id);
      setPromociones(data);
    } catch {
      toast.error("Error al buscar promociones");
    } finally {
      setLoadingPromos(false);
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
          Escribe y selecciona el distrito de instalación del cliente para descubrir las campañas y paquetes disponibles en su zona.
        </p>
      </div>

      {/* Buscador Box */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 md:p-6 mb-8 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1 relative" ref={wrapperRef}>
            <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Distrito, Provincia o Departamento
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={query}
                onChange={(e) => {
                  setDistritoSeleccionado(null);
                  setQuery(e.target.value);
                }}
                placeholder="Ej. Chiclayo..."
                className="h-12 pl-10 pr-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors text-base"
              />
              {query && (
                <button
                  onClick={limpiar}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Dropdown de Autocompletado */}
            {mostrarDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto overflow-x-hidden">
                {buscando ? (
                  <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Buscando...
                  </div>
                ) : sugerencias.length > 0 ? (
                  <ul className="py-2">
                    {sugerencias.map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => seleccionarDistrito(d)}
                          className="w-full text-left px-4 py-2 hover:bg-muted focus:bg-muted transition-colors flex items-center gap-2"
                        >
                          <MapPin size={16} className="text-muted-foreground shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">{d.nombre}</span>
                            <span className="text-[11px] text-muted-foreground truncate">{d.nombre_provincia}, {d.nombre_departamento}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No se encontraron distritos
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            disabled={!distritoSeleccionado || loadingPromos}
            className="h-12 px-8 shadow-md hover:shadow-lg transition-all font-medium text-sm w-full md:w-auto"
          >
            {loadingPromos ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span className="ml-2">Buscar Promos</span>
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {loadingPromos ? (
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
              Se encontraron {promociones.length} promociones aplicables para {distritoSeleccionado?.nombre}
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
              No hay promociones registradas para {distritoSeleccionado?.nombre} ni para su provincia o departamento.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
};
