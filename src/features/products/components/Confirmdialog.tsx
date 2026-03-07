import { memo } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Asumiendo que tienes el botón de Shadcn

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  accentHex?: string; // Mantenemos la prop por retrocompatibilidad, pero la mapearemos a clases
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  accentHex = "#ef4444", // Lo trataremos como el color "destructive" (rojo)
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  // Pequeño mapa para traducir el prop accentHex que venías usando a clases de Tailwind.
  // Si necesitas más colores, puedes agregarlos aquí.
  const isDestructive =
    accentHex === "#ef4444" ||
    accentHex.includes("red") ||
    accentHex.includes("ef4444");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!loading ? onCancel : undefined}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1100] animate-in fade-in duration-200"
      />

      {/* Dialog */}
      <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[min(420px,92vw)] bg-card border border-border rounded-2xl z-[1101] p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl border mb-5",
            isDestructive
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-primary/10 border-primary/20 text-primary",
          )}
        >
          <AlertTriangle size={24} />
        </div>

        {/* Content */}
        <h3 className="font-serif text-xl font-bold text-foreground mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "h-10 px-5 rounded-xl font-semibold shadow-md transition-colors gap-2",
              isDestructive
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
});
