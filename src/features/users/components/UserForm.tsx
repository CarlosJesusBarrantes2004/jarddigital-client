import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { userService } from "../services/userService";
import type { BranchModalityOption, Role, User, UserPayload } from "../types";
import { Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface UserFormProps {
  user?: User;
  roles: Role[];
  onSave: (data: UserPayload) => Promise<void>;
  onCancel: () => void;
}

export const UserForm = ({ user, roles, onSave, onCancel }: UserFormProps) => {
  const [branchOptions, setBranchOptions] = useState<BranchModalityOption[]>(
    [],
  );
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: user?.nombre_completo || "",
    username: user?.username,
    email: user?.email || "",
    password: "",
    id_rol: user?.id_rol || 0,
    activo: user?.activo !== undefined ? user.activo : true,
  });

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await userService.getVenueOptions();
        setBranchOptions(data);

        if (user?.sucursales) {
          const matches = user.sucursales.map((b) => b.id_modalidad_sede);
          setSelectedBranches(matches);
        }

        if (!user && formData.id_rol === 0 && roles.length > 0)
          setFormData((prev) => ({ ...prev, id_rol: roles[0].id }));
      } catch (error) {
        console.error("Error loading branches:", error);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [roles, user, formData.id_rol]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBranch = (branchId: number) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedBranches.length === 0) return;

    setIsSubmitting(true);

    const payload: UserPayload = {
      ...formData,
      ids_modalidades_sede: selectedBranches,
    };

    if (user || !payload.password) delete payload.password;

    await onSave(payload);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-primary uppercase">
          Datos de Cuenta
        </h3>
        <div>
          <label className="text-sm font-medium text-foreground">
            Nombre Completo
          </label>
          <Input
            value={formData.nombre_completo}
            onChange={(e) => handleChange("nombre_completo", e.target.value)}
            placeholder="E.g. Carlos Barrantes"
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">
            Username (Login)
          </label>
          <Input
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="E.g. cbarrantes"
            required
            disabled={!!user}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="E.g. carlos@jard.com"
            required
            className="mt-1"
          />
        </div>
        {!user && (
          <div>
            <label className="text-sm font-medium text-foreground">
              Contraseña Inicial
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Secure password"
              required={!user}
              className="mt-1"
            />
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-primary uppercase">
          Rol en el Sistema
        </h3>
        <select
          value={formData.id_rol}
          onChange={(e) => handleChange("id_rol", Number(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value={0} disabled>
            Selecciona un rol...
          </option>
          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-primary uppercase">
          Asignación de Sedes y Modalidades
        </h3>
        <p className="text-xs text-muted-foreground">
          Selecciona las sedes y modalidades a las que tendrá acceso
        </p>

        <ScrollArea className="h-48 border rounded-lg p-3 space-y-2">
          {isLoadingBranches ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : branchOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-4">
              No hay sedes disponibles
            </p>
          ) : (
            branchOptions.map((branch) => (
              <div
                key={branch.id}
                onClick={() => toggleBranch(branch.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer border-2 transition-colors mb-2 last:mb-0",
                  selectedBranches.includes(branch.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      selectedBranches.includes(branch.id)
                        ? "bg-primary border-primary"
                        : "border-border",
                    )}
                  >
                    {selectedBranches.includes(branch.id) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {branch.etiqueta}
                  </span>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        {selectedBranches.length === 0 && !isLoadingBranches && (
          <p className="text-xs text-destructive">
            Debes seleccionar al menos una sede
          </p>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-primary uppercase">Estado</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.activo}
            onChange={(e) => handleChange("activo", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-foreground">Usuario Activo</span>
        </label>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || selectedBranches.length === 0}
          className="flex-1 bg-primary hover:bg-primary/90 hover:cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Guardar Usuario"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 hover:cursor-pointer"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};
