import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDepartamentos,
  useProvincias,
  useDistritos,
} from "../hooks/useSales";

interface UbigeoCascadaProps {
  depFieldName: string;
  provFieldName: string;
  distFieldName: string;
  labels?: { dep?: string; prov?: string; dist?: string };
  disabled?: boolean;
  required?: boolean;
  // Nombres para mostrar mientras cargan las listas (modo pre-llenado)
  depNombre?: string;
  provNombre?: string;
  distNombre?: string;
}

export function UbigeoCascada({
  depFieldName,
  provFieldName,
  distFieldName,
  labels = { dep: "Departamento", prov: "Provincia", dist: "Distrito" },
  disabled = false,
  required = false,
}: UbigeoCascadaProps) {
  const form = useFormContext();
  const depId = form.watch(depFieldName) as number | null;
  const provId = form.watch(provFieldName) as number | null;

  const { data: departamentos = [], isLoading: loadingDep } =
    useDepartamentos();
  const { data: provincias = [], isLoading: loadingProv } =
    useProvincias(depId);
  const { data: distritos = [], isLoading: loadingDist } = useDistritos(provId);

  // Encuentra el nombre del ítem seleccionado incluso si la lista aún está cargando
  const depNombreActual = departamentos.find((d) => d.id === depId)?.nombre;
  const provNombreActual = provincias.find((p) => p.id === provId)?.nombre;
  const distId = form.watch(distFieldName) as number | null;
  const distNombreActual = distritos.find((d) => d.id === distId)?.nombre;

  const onDepChange = (value: string) => {
    form.setValue(depFieldName, Number(value), { shouldValidate: true });
    form.setValue(provFieldName, null);
    form.setValue(distFieldName, null);
  };

  const onProvChange = (value: string) => {
    form.setValue(provFieldName, Number(value), { shouldValidate: true });
    form.setValue(distFieldName, null);
  };

  const onDistChange = (value: string) => {
    form.setValue(distFieldName, Number(value), { shouldValidate: true });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* DEPARTAMENTO */}
      <FormField
        control={form.control}
        name={depFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {labels.dep}
              {required && <span className="ml-1 text-red-500">*</span>}
            </FormLabel>
            <Select
              disabled={disabled || loadingDep}
              onValueChange={onDepChange}
              value={field.value ? String(field.value) : undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingDep ? "Cargando..." : "Selecciona..."}
                  >
                    {/* Muestra nombre mientras las opciones llegan */}
                    {field.value && !depNombreActual && loadingDep
                      ? "Cargando..."
                      : depNombreActual}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* PROVINCIA */}
      <FormField
        control={form.control}
        name={provFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {labels.prov}
              {required && <span className="ml-1 text-red-500">*</span>}
            </FormLabel>
            <Select
              disabled={disabled || !depId || loadingProv}
              onValueChange={onProvChange}
              value={field.value ? String(field.value) : undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingProv
                        ? "Cargando..."
                        : !depId
                          ? "Primero elige departamento"
                          : "Selecciona..."
                    }
                  >
                    {field.value && !provNombreActual && loadingProv
                      ? "Cargando..."
                      : provNombreActual}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {provincias.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* DISTRITO */}
      <FormField
        control={form.control}
        name={distFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {labels.dist}
              {required && <span className="ml-1 text-red-500">*</span>}
            </FormLabel>
            <Select
              disabled={disabled || !provId || loadingDist}
              onValueChange={onDistChange}
              value={field.value ? String(field.value) : undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingDist
                        ? "Cargando..."
                        : !provId
                          ? "Primero elige provincia"
                          : "Selecciona..."
                    }
                  >
                    {field.value && !distNombreActual && loadingDist
                      ? "Cargando..."
                      : distNombreActual}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {distritos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
