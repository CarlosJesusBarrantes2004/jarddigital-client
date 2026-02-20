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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Plus, Search } from "lucide-react";
import { useBranches } from "../../hooks/useBranches";
import { useState } from "react";
import type { Branch, BranchPayload } from "../../types";
import { BranchesTable } from "./BranchesTable";
import { BranchForm } from "./BranchForm";

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
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);

  const filteredBranches = branches.filter(
    (b) =>
      b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.direccion.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleNew = () => {
    setSelectedBranch(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = async (id: number) => {
    setBranchToDelete(id);
  };

  const confirmDelete = async () => {
    if (branchToDelete) {
      await deleteBranch(branchToDelete);
      setBranchToDelete(null);
    }
  };

  const handleSave = async (data: BranchPayload) => {
    let success = false;

    if (selectedBranch) success = await updateBranch(selectedBranch.id, data);
    else success = await createBranch(data);

    if (success) setIsSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sucursal..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Sucursal
        </Button>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center items-center h-48 border rounded-xl bg-card text-card-foreground shadow">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <BranchesTable
          branches={filteredBranches}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        ></BranchesTable>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full md:w-[500px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {selectedBranch ? "Editar Sucursal" : "Nueva Sucursal"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <BranchForm
              branch={selectedBranch}
              modalities={modalities}
              onSave={handleSave}
              onCancel={() => setIsSheetOpen(false)}
            ></BranchForm>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!branchToDelete}
        onOpenChange={() => setBranchToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará la sucursal. Los usuarios asignados a ella
              podrían perder el acceso si no tienen otras sedes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
