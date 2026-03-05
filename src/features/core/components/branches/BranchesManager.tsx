import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalLoader } from "@/components/GlobalLoader";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useBranches } from "../../hooks/useBranches";
import { BranchesTable } from "./BranchesTable";
import { BranchForm } from "./BranchForm";

import type { Branch } from "../../types";
import type { BranchFormData } from "../../schemas/branchSchema";

export const BranchesManager = () => {
  const {
    branches,
    modalities,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);

  const filteredBranches = branches.filter(
    (b) =>
      b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.direccion.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenSheet = (branch: Branch | null = null) => {
    setSelectedBranch(branch);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: BranchFormData) => {
    setIsSubmitting(true);
    let success = false;
    if (selectedBranch) success = await updateBranch(selectedBranch.id, data);
    else success = await createBranch(data);
    setIsSubmitting(false);
    if (success) setIsSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (branchToDelete) {
      await deleteBranch(branchToDelete);
      setBranchToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="bg-card/50 border border-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            className="pl-10 h-10 bg-background border-border rounded-xl text-[13px] focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => handleOpenSheet(null)}
          className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-5 shadow-[0_4px_16px_rgba(var(--primary),0.2)] hover:-translate-y-[1px] transition-all active:scale-[0.98]"
        >
          <Plus size={16} />{" "}
          <span className="font-semibold">Nueva Sucursal</span>
        </Button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <GlobalLoader
          fullScreen={false}
          message="Cargando mapa de sucursales..."
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <BranchesTable
            branches={filteredBranches}
            onEdit={(branch) => handleOpenSheet(branch)}
            onDelete={setBranchToDelete}
          />
        </div>
      )}

      {/* ── Sheet Form ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto p-0 bg-background border-l border-border"
        >
          <SheetHeader className="px-6 py-6 border-b border-border bg-card/50">
            <SheetTitle className="font-serif text-xl text-foreground">
              {selectedBranch ? "Editar Sucursal" : "Nueva Sucursal"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {selectedBranch
                ? "Ajusta las configuraciones de la sede."
                : "Registra un nuevo punto de operación en el sistema."}
            </SheetDescription>
          </SheetHeader>
          <BranchForm
            branch={selectedBranch}
            modalities={modalities}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Dialog Delete ── */}
      <AlertDialog
        open={!!branchToDelete}
        onOpenChange={() => setBranchToDelete(null)}
      >
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">
              ¿Desactivar sucursal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acción deshabilitará la sucursal. Los usuarios vinculados a
              ella perderán el acceso a esta sede inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-xl"
            >
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
