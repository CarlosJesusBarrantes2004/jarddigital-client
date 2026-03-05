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
      {/* ── Toolbar ── */}
      <div className="bg-card/50 border border-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="relative w-full sm:max-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
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
          <span className="font-semibold">Nueva Modalidad</span>
        </Button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <GlobalLoader fullScreen={false} message="Cargando modalidades..." />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <ModalitiesTable
            modalities={filteredModalities}
            onEdit={(modality) => handleOpenSheet(modality)}
            onDelete={setModalityToDelete}
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
              {selectedModality ? "Editar Modalidad" : "Nueva Modalidad"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
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

      {/* ── Dialog Delete ── */}
      <AlertDialog
        open={!!modalityToDelete}
        onOpenChange={() => setModalityToDelete(null)}
      >
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">
              ¿Desactivar modalidad?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acción desactivará la modalidad de forma lógica. Las
              sucursales que la utilicen dejarán de verla en sus opciones
              operativas.
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
}
