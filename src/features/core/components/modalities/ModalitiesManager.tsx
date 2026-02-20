import { useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useModalities } from "../../hooks/useModalities";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModality, setSelectedModality] = useState<Modality | null>(
    null,
  );
  const [modalityToDelete, setModalityToDelete] = useState<number | null>(null);

  const filteredModalities = modalities.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleNew = () => {
    setSelectedModality(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (modality: Modality) => {
    setSelectedModality(modality);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: { nombre: string; activo: boolean }) => {
    let success = false;
    if (selectedModality) {
      success = await updateModality(selectedModality.id, data);
    } else {
      success = await createModality(data);
    }

    if (success) setIsDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (modalityToDelete) {
      await deleteModality(modalityToDelete);
      setModalityToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modalidad..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Modalidad
        </Button>
      </div>

      {/* Tabla o Loading */}
      {loading ? (
        <div className="p-10 flex justify-center items-center h-48 border rounded-xl bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ModalitiesTable
          modalities={filteredModalities}
          onEdit={handleEdit}
          onDelete={(id) => setModalityToDelete(id)}
        />
      )}

      {/* Modal para Formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedModality ? "Editar Modalidad" : "Nueva Modalidad"}
            </DialogTitle>
            <DialogDescription>
              {selectedModality
                ? "Actualiza los datos de la modalidad."
                : "Registra una nueva modalidad operativa."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <ModalityForm
              modality={selectedModality}
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Borrado */}
      <AlertDialog
        open={!!modalityToDelete}
        onOpenChange={() => setModalityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar modalidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará la modalidad operativa. Las sucursales que
              la utilicen podrían verse afectadas.
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
}
