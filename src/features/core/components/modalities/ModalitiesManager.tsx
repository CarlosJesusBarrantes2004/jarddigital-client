import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalLoader } from "@/components/GlobalLoader";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useModalities } from "../../hooks/useModalities";
import type { ModalityFormData } from "../../schemas/modalitySchema";

import { ModalitiesTable } from "./ModalitiesTable";
import { ModalityForm } from "./ModalityForm";

import type { Modality } from "../../types";

export function ModalitiesManager() {
  const {
    modalities,
    loading,
    createModality,
    updateModality,
    deleteModality,
  } = useModalities();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedModality, setSelectedModality] = useState<Modality | null>(
    null,
  );
  const [modalityToDelete, setModalityToDelete] = useState<number | null>(null);

  const filteredModalities = modalities.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenSheet = (modality: Modality | null = null) => {
    setSelectedModality(modality);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: ModalityFormData) => {
    setIsSubmitting(true);
    let success = false;

    if (selectedModality)
      success = await updateModality(selectedModality.id, data);
    else success = await createModality(data);

    setIsSubmitting(false);
    if (success) setIsSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (modalityToDelete) {
      await deleteModality(modalityToDelete);
      setModalityToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre..."
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
          Nueva Modalidad
        </Button>
      </div>

      {loading ? (
        <GlobalLoader fullScreen={false} message="Cargando modalidades..." />
      ) : (
        <ModalitiesTable
          modalities={filteredModalities}
          onEdit={(modality) => handleOpenSheet(modality)}
          onDelete={setModalityToDelete}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto border-l shadow-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-xl">
              {selectedModality ? "Editar Modalidad" : "Nueva Modalidad"}
            </SheetTitle>
            <SheetDescription>
              {selectedModality
                ? "Actualiza el estado operativo de esta modalidad."
                : "Registra una nueva modalidad de atención o venta."}
            </SheetDescription>
          </SheetHeader>
          <ModalityForm
            modality={selectedModality}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!modalityToDelete}
        onOpenChange={() => setModalityToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ¿Eliminar modalidad?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Esta acción desactivará la modalidad de forma lógica. Las
              sucursales que la utilicen dejarán de verla en sus opciones
              operativas.
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
}
