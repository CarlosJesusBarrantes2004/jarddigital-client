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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            className="pl-10 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => handleOpenSheet(null)}
          className="w-full sm:w-auto gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Sucursal
        </Button>
      </div>

      {loading ? (
        <GlobalLoader
          fullScreen={false}
          message="Cargando sucursales..."
        ></GlobalLoader>
      ) : (
        <BranchesTable
          branches={filteredBranches}
          onEdit={(branch) => handleOpenSheet(branch)}
          onDelete={setBranchToDelete}
        />
      )}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto border-l shadow-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-xl">
              {selectedBranch ? "Editar Sucursal" : "Nueva Sucursal"}
            </SheetTitle>
            <SheetDescription>
              {selectedBranch
                ? "Modifica los datos operativos de la sede."
                : "Registra una nueva sede para la operación."}
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

      <AlertDialog
        open={!!branchToDelete}
        onOpenChange={() => setBranchToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ¿Eliminar sucursal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Esta acción desactivará la sucursal de forma lógica. Los usuarios
              asignados a ella podrían perder temporalmente el acceso si no
              tienen otras sedes vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90 shadow-sm"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
