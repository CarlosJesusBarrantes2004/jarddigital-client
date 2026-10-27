import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSeguimiento, useUpdateSeguimientoMensual } from "../api";
import type { Seguimiento } from "../types";

export function RetentionActionModal({ seguimiento, onClose }: { seguimiento: Seguimiento; onClose: () => void }) {
  const detail = useSeguimiento(seguimiento.id);
  const months = (detail.data?.meses_evaluados ?? []).filter(m => m.activo).slice().sort((a, b) => a.mes_numero - b.mes_numero);
  const [monthId, setMonthId] = useState("");
  const [note, setNote] = useState("");
  const update = useUpdateSeguimientoMensual();
  const month = months.find(m => String(m.id) === monthId);
  return <Dialog open onOpenChange={open => { if (!open && !update.isPending) onClose(); }}>
    <DialogContent showCloseButton={!update.isPending}>
      <DialogHeader><DialogTitle>Registrar gestión de retención</DialogTitle><DialogDescription>Atención proactiva a {seguimiento.venta.cliente_nombre}. La gestión se añadirá a las observaciones del mes seleccionado.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={e => {
        e.preventDefault();
        if (!month || !note.trim() || update.isPending) return;
        const date = new Date();
        const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const entry = `[Gestión de retención · ${date.toLocaleString("es-PE")}] ${note.trim()}`;
        update.mutate({ id: month.id, seguimientoId: seguimiento.id, data: {
          observacion: [month.observacion, entry].filter(Boolean).join("\n"),
          fecha_seguimiento: localDate,
        } }, { onSuccess: () => { toast.success("Gestión registrada correctamente."); onClose(); }, onError: () => toast.error("No se pudo guardar la gestión. Intenta nuevamente.") });
      }}>
        {detail.isPending ? <p role="status" className="text-sm">Cargando meses disponibles...</p> : detail.isError ? <p role="alert" className="text-sm text-destructive">No se pudo cargar el seguimiento. <button type="button" onClick={() => void detail.refetch()} className="underline">Reintentar</button></p> : months.length === 0 ? <p role="status" className="text-sm">No hay meses activos disponibles para registrar la gestión.</p> : null}
        <label className="block text-sm space-y-2"><span>Mes de seguimiento</span><select required value={monthId} disabled={update.isPending || !months.length} onChange={e => setMonthId(e.target.value)} className="block w-full rounded-lg border border-border bg-background p-2"><option value="">Selecciona un mes</option>{months.map(m => <option key={m.id} value={m.id}>Mes {m.mes_numero}</option>)}</select></label>
        <label className="block text-sm space-y-2"><span>Atención realizada y acuerdos</span><textarea required value={note} disabled={update.isPending} onChange={e => setNote(e.target.value)} rows={4} className="block w-full rounded-lg border border-border bg-background p-2" /></label>
        <div className="flex justify-end gap-2"><button type="button" disabled={update.isPending} onClick={onClose} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button><button type="submit" disabled={!month || !note.trim() || update.isPending || detail.isFetching} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm disabled:opacity-50">{update.isPending ? "Guardando..." : "Guardar gestión"}</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
