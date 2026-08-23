import { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImagenToCloudinary } from "@/lib/cloudinary.utils";
import { promotionsService } from "../services/promotions.service";
import type {
  Promocion,
  CreatePromocionPayload,
  Departamento,
  Provincia,
  Distrito,
} from "../types/promotions.types";

interface TerritorioRow {
  id_departamento: number | null;
  id_provincia: number | null;
  id_distrito: number | null;
  // Opciones cargadas para cada fila
  provincias: Provincia[];
  distritos: Distrito[];
}

interface PromocionFormProps {
  promocion?: Promocion | null;
  onSubmit: (payload: CreatePromocionPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PromocionForm = ({
  promocion,
  onSubmit,
  onCancel,
  isLoading = false,
}: PromocionFormProps) => {
  const [titulo, setTitulo] = useState(promocion?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(promocion?.descripcion ?? "");
  const [imagenUrl, setImagenUrl] = useState(promocion?.imagen_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [territorios, setTerritorios] = useState<TerritorioRow[]>([
    { id_departamento: null, id_provincia: null, id_distrito: null, provincias: [], distritos: [] },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cargar departamentos al montar
  useEffect(() => {
    promotionsService.getDepartamentos().then(setDepartamentos);
  }, []);

  // Pre-cargar territorios existentes al editar
  useEffect(() => {
    if (promocion?.territorios && promocion.territorios.length > 0) {
      const rows: TerritorioRow[] = promocion.territorios.map((t) => ({
        id_departamento: t.id_departamento,
        id_provincia: t.id_provincia,
        id_distrito: t.id_distrito,
        provincias: [],
        distritos: [],
      }));
      setTerritorios(rows);
    }
  }, [promocion]);

  const handleDepChange = async (index: number, depId: string) => {
    const id = parseInt(depId);
    const row = { ...territorios[index] };
    row.id_departamento = id;
    row.id_provincia = null;
    row.id_distrito = null;
    row.distritos = [];
    try {
      row.provincias = await promotionsService.getProvincias(id);
    } catch {
      row.provincias = [];
    }
    const updated = [...territorios];
    updated[index] = row;
    setTerritorios(updated);
  };

  const handleProvChange = async (index: number, provId: string) => {
    const id = parseInt(provId);
    const row = { ...territorios[index] };
    row.id_provincia = id;
    row.id_distrito = null;
    try {
      row.distritos = await promotionsService.getDistritos(id);
    } catch {
      row.distritos = [];
    }
    const updated = [...territorios];
    updated[index] = row;
    setTerritorios(updated);
  };

  const handleDistChange = (index: number, distId: string) => {
    const updated = [...territorios];
    updated[index] = { ...updated[index], id_distrito: parseInt(distId) };
    setTerritorios(updated);
  };

  const addTerritorioRow = () => {
    setTerritorios([
      ...territorios,
      { id_departamento: null, id_provincia: null, id_distrito: null, provincias: [], distritos: [] },
    ]);
  };

  const removeTerritorioRow = (index: number) => {
    if (territorios.length <= 1) return;
    setTerritorios(territorios.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImagenToCloudinary(file, "promociones");
      setImagenUrl(url);
    } catch {
      alert("Error al subir imagen. Verifica el preset 'jard_imagenes' en Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const terrPayload = territorios
      .filter((t) => t.id_departamento || t.id_provincia || t.id_distrito)
      .map((t) => ({
        id_departamento: t.id_departamento,
        id_provincia: t.id_provincia,
        id_distrito: t.id_distrito,
      }));

    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      imagen_url: imagenUrl || null,
      territorios: terrPayload,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="promo-titulo">Título</Label>
        <Input
          id="promo-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Internet 200 Mbps por S/59.90..."
          className="h-11"
          required
        />
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="promo-desc">Descripción (opcional)</Label>
        <Textarea
          id="promo-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles de la promoción..."
          className="min-h-[100px] resize-y"
        />
      </div>

      {/* Imagen */}
      <div className="space-y-2">
        <Label>Imagen (opcional)</Label>
        {imagenUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={imagenUrl} alt="Vista previa" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => setImagenUrl("")}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
            <span className="text-xs">{uploading ? "Subiendo..." : "Subir imagen"}</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Territorios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Territorios</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addTerritorioRow} className="gap-1 h-7 text-xs">
            <Plus size={12} />
            Agregar
          </Button>
        </div>

        {territorios.map((row, idx) => (
          <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/20">
            {/* Departamento */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Dpto.</span>
              <Select
                value={row.id_departamento?.toString() ?? ""}
                onValueChange={(v) => handleDepChange(idx, v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar..." />
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

            {/* Provincia */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Prov.</span>
              <Select
                value={row.id_provincia?.toString() ?? ""}
                onValueChange={(v) => handleProvChange(idx, v)}
                disabled={!row.id_departamento}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {row.provincias.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Distrito */}
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Dist.</span>
              <Select
                value={row.id_distrito?.toString() ?? ""}
                onValueChange={(v) => handleDistChange(idx, v)}
                disabled={!row.id_provincia}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {row.distritos.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remove */}
            {territorios.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTerritorioRow(idx)}
                className="h-9 w-9 p-0 mt-5 text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || uploading}>
          {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
          {promocion ? "Guardar cambios" : "Crear promoción"}
        </Button>
      </div>
    </form>
  );
};
