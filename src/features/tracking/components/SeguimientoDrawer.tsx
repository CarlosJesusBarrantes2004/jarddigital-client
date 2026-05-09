import { useState } from "react";
import {
  X,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSeguimiento,
  useUpdateSeguimiento,
  useUpdateSeguimientoMensual,
} from "../api";
import { formatDate, getNombreAsesor, getNombreProducto } from "../utils";
import type {
  Seguimiento,
  SeguimientoMensual,
  ConformidadType,
  EstadoSeguimientoType,
} from "../types";

// ─── Sub-components ───────────────────────────────────────────

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground w-32 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-[13px] text-foreground font-medium flex-1">
        {value || "—"}
      </span>
    </div>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: EstadoSeguimientoType | null | undefined;
}) {
  if (!estado) return null;
  const colors: Record<EstadoSeguimientoType, string> = {
    PENALIZADO: "bg-red-500/15 text-red-600 border-red-500/30",
    SUSPENDIDO: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    DESACTIVADO: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
        colors[estado],
      )}
    >
      {estado}
    </span>
  );
}

// ─── Monthly Card ─────────────────────────────────────────────

function MesCard({
  mes,
  seguimientoId,
  isBlocked,
  isPenalizado, // NUEVA prop para bloquear todo
  isLast,
}: {
  mes: SeguimientoMensual;
  seguimientoId: number;
  isBlocked: boolean;
  isPenalizado: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showObs, setShowObs] = useState(false);
  const [form, setForm] = useState({
    observacion: mes.observacion ?? "",
    conformidad: mes.conformidad as ConformidadType | null,
    fecha_seguimiento: mes.fecha_seguimiento ?? "",
    fecha_validacion_pago: mes.fecha_validacion_pago ?? "",
  });

  const updateMes = useUpdateSeguimientoMensual();
  const isPaid = mes.pago_cliente_realizado;

  // Si está penalizado, deshabilitamos todo intento de edición
  const canEdit = !isBlocked && !isPenalizado;

  const handleTogglePago = () => {
    if (isPenalizado || (isBlocked && !isPaid)) return;
    updateMes.mutate({
      id: mes.id,
      seguimientoId,
      data: { pago_cliente_realizado: !isPaid },
    });
  };

  const handleSave = () => {
    updateMes.mutate({
      id: mes.id,
      seguimientoId,
      data: {
        observacion: form.observacion || undefined,
        conformidad: form.conformidad,
        fecha_seguimiento: form.fecha_seguimiento || undefined,
        fecha_validacion_pago: form.fecha_validacion_pago || undefined,
      },
    });
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border transition-all duration-200",
        isPaid
          ? "border-emerald-500/40 bg-emerald-500/5"
          : isBlocked || isPenalizado
            ? "border-border/30 bg-muted/20 opacity-60"
            : "border-border bg-card",
      )}
    >
      {!isLast && (
        <div className="absolute left-[23px] top-full h-3 w-px bg-border/50 z-10" />
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border-2",
              isPaid
                ? "border-emerald-500 bg-emerald-500 text-white"
                : isBlocked || isPenalizado
                  ? "border-border/40 bg-muted text-muted-foreground"
                  : "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {mes.mes_numero}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">
                Mes {mes.mes_numero}
              </span>

              {/* Etiqueta CONFORME / INCONFORME */}
              {mes.conformidad && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                      mes.conformidad === "CONFORME"
                        ? "bg-blue-500/15 text-blue-600"
                        : "bg-orange-500/15 text-orange-600",
                    )}
                  >
                    {mes.conformidad}
                  </span>

                  {/* Tooltip Cuadro flotante para Inconforme */}
                  {mes.conformidad === "INCONFORME" && mes.observacion && (
                    <div className="group relative flex items-center justify-center">
                      <AlertCircle
                        size={13}
                        className="text-orange-500 cursor-help hover:text-orange-600 transition-colors"
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-popover/95 backdrop-blur text-popover-foreground text-[11px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        {mes.observacion}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b border-r border-border rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-0.5">
              <span className="text-[11px] text-muted-foreground">
                <span className="font-mono">SEG</span>{" "}
                {formatDate(mes.fecha_seguimiento)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                <span className="font-mono">PAGO</span>{" "}
                {formatDate(mes.fecha_validacion_pago)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Edit3 size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={handleTogglePago}
              disabled={isPenalizado || (isBlocked && !isPaid)}
              title={
                isPenalizado
                  ? "Venta Penalizada"
                  : isBlocked && !isPaid
                    ? "El mes anterior aún no ha sido pagado"
                    : undefined
              }
              className={cn(
                "flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-semibold transition-all",
                isPaid
                  ? "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30"
                  : isPenalizado || isBlocked
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              {isPaid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {isPaid ? "Pagado" : "Sin pago"}
            </button>
          </div>
        </div>

        {editing && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                  Fecha Seguimiento
                </label>
                <input
                  type="date"
                  value={form.fecha_seguimiento}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fecha_seguimiento: e.target.value,
                    }))
                  }
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                  Fecha Validación Pago
                </label>
                <input
                  type="date"
                  value={form.fecha_validacion_pago}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fecha_validacion_pago: e.target.value,
                    }))
                  }
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                Conformidad
              </label>
              <div className="flex gap-2">
                {(
                  ["CONFORME", "INCONFORME", null] as (ConformidadType | null)[]
                ).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, conformidad: v }))}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-[11px] font-semibold border transition-all",
                      form.conformidad === v
                        ? v === "CONFORME"
                          ? "bg-blue-500 text-white border-blue-500"
                          : v === "INCONFORME"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-muted text-foreground border-border"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30",
                    )}
                  >
                    {v ?? "Sin def."}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                Observación
              </label>
              <textarea
                value={form.observacion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacion: e.target.value }))
                }
                rows={2}
                placeholder="Comentario del seguimiento..."
                className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-[12px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMes.isPending}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                <Save size={11} /> Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={11} /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────

interface SeguimientoDrawerProps {
  seguimientoId: number | null;
  onClose: () => void;
}

export function SeguimientoDrawer({
  seguimientoId,
  onClose,
}: SeguimientoDrawerProps) {
  const { data: seg, isLoading } = useSeguimiento(seguimientoId);
  const updateSeg = useUpdateSeguimiento();

  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<{
    codigo_pago: string;
    ciclo_facturacion: string;
    estado: EstadoSeguimientoType | "";
    descuento_realizado: boolean;
  }>({
    codigo_pago: "",
    ciclo_facturacion: "",
    estado: "",
    descuento_realizado: false,
  });

  const openHeaderEdit = () => {
    if (!seg) return;
    setHeaderForm({
      codigo_pago: seg.codigo_pago ?? "",
      ciclo_facturacion: seg.ciclo_facturacion ?? "",
      estado: (seg.estado as EstadoSeguimientoType) ?? "",
      descuento_realizado: seg.descuento_realizado,
    });
    setEditingHeader(true);
  };

  const saveHeader = () => {
    if (!seg) return;
    updateSeg.mutate({
      id: seg.id,
      data: {
        codigo_pago: headerForm.codigo_pago || undefined,
        ciclo_facturacion: headerForm.ciclo_facturacion || undefined,
        estado: (headerForm.estado as EstadoSeguimientoType) || null,
        descuento_realizado: headerForm.descuento_realizado,
      },
    });
    setEditingHeader(false);
  };

  const meses =
    seg?.meses_evaluados?.slice().sort((a, b) => a.mes_numero - b.mes_numero) ??
    [];

  // Determine which months are blocked (prev month not paid)
  const isBlocked = (mesNum: number) => {
    if (mesNum === 1) return false;
    const prev = meses.find((m) => m.mes_numero === mesNum - 1);
    return !prev?.pago_cliente_realizado;
  };

  const isPenalizado = seg?.estado === "PENALIZADO";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0  z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-[640px] bg-background border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="h-14 flex items-center gap-4 px-5 border-b border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex-1">
            <h2 className="text-[14px] font-bold text-foreground">
              {isLoading ? "Cargando..." : seg?.venta.cliente_nombre}
            </h2>
            {seg && (
              <p className="text-[11px] font-mono text-muted-foreground">
                {seg.venta.codigo_sot} · {getNombreAsesor(seg.venta)}
              </p>
            )}
          </div>
          {seg && <EstadoBadge estado={seg.estado} />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !seg ? null : (
            <div className="p-5 space-y-6">
              {/* ── Client Info ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-primary" />
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
                    Datos del Cliente
                  </h3>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 space-y-0">
                  <DataRow
                    label="Nombre"
                    value={`${seg.venta.cliente_nombre} ${seg.venta.cliente_apellido ?? ""}`}
                  />
                  <DataRow label="DNI" value={seg.venta.cliente_numero_doc} />
                  <DataRow
                    label="Dirección"
                    value={seg.venta.direccion_detalle}
                  />
                  <DataRow
                    label="Teléfono"
                    value={seg.venta.cliente_telefono}
                  />
                  <DataRow
                    label="F. Nacimiento"
                    value={formatDate(seg.venta.cliente_fecha_nacimiento)}
                  />
                  <DataRow
                    label="Lugar Nac."
                    value={`${seg.venta.departamento_nacimiento_nombre} / ${seg.venta.provincia_nacimiento_nombre} / ${seg.venta.distrito_nacimiento_nombre}`}
                  />
                  <DataRow label="Padre" value={seg.venta.cliente_papa} />
                  <DataRow label="Madre" value={seg.venta.cliente_mama} />
                  <DataRow label="Correo" value={seg.venta.cliente_email} />
                  <DataRow label="Género" value={seg.venta.cliente_genero} />
                  <DataRow
                    label="Producto"
                    value={getNombreProducto(seg.venta)}
                  />
                  <DataRow
                    label="F. Instalación"
                    value={formatDate(seg.venta.fecha_real_inst)}
                  />
                </div>
              </section>

              {/* ── Seguimiento Header ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-primary" />
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
                      Datos de Seguimiento
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={editingHeader ? saveHeader : openHeaderEdit}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
                  >
                    {editingHeader ? <Save size={12} /> : <Edit3 size={12} />}
                    {editingHeader ? "Guardar" : "Editar"}
                  </button>
                </div>

                {editingHeader ? (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                          Código de Pago
                        </label>
                        <input
                          value={headerForm.codigo_pago}
                          onChange={(e) =>
                            setHeaderForm((f) => ({
                              ...f,
                              codigo_pago: e.target.value,
                            }))
                          }
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                          placeholder="Ej. COD-00123"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                          Ciclo Facturación
                        </label>
                        <input
                          type="date"
                          value={headerForm.ciclo_facturacion}
                          onChange={(e) =>
                            setHeaderForm((f) => ({
                              ...f,
                              ciclo_facturacion: e.target.value,
                            }))
                          }
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                          Estado
                        </label>
                        <select
                          value={headerForm.estado}
                          onChange={(e) =>
                            setHeaderForm((f) => ({
                              ...f,
                              estado: e.target.value as
                                | EstadoSeguimientoType
                                | "",
                            }))
                          }
                          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="">Sin estado</option>
                          <option value="PENALIZADO">Penalizado</option>
                          <option value="SUSPENDIDO">Suspendido</option>
                          <option value="DESACTIVADO">Desactivado</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={headerForm.descuento_realizado}
                            onChange={(e) =>
                              setHeaderForm((f) => ({
                                ...f,
                                descuento_realizado: e.target.checked,
                              }))
                            }
                            className="rounded border-border accent-primary"
                          />
                          <span className="text-[12px] text-foreground">
                            Descuento Realizado
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingHeader(false)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-0">
                    <DataRow label="Código Pago" value={seg.codigo_pago} />
                    <DataRow
                      label="Ciclo Facturación"
                      value={formatDate(seg.ciclo_facturacion)}
                    />
                    <DataRow
                      label="Descuento"
                      value={seg.descuento_realizado ? "✓ Realizado" : "No"}
                    />
                  </div>
                )}
              </section>

              {/* ── Monthly tracking ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={14} className="text-primary" />
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground">
                    Seguimientos Mensuales
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {meses.filter((m) => m.pago_cliente_realizado).length} /{" "}
                    {meses.length} pagados
                  </span>
                </div>

                {meses.length === 0 ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-[13px] py-6 justify-center">
                    <Clock size={16} /> Sin registros mensuales
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meses.map((mes, idx) => (
                      <MesCard
                        key={mes.id}
                        mes={mes}
                        seguimientoId={seg.id}
                        isBlocked={isBlocked(mes.mes_numero)}
                        isPenalizado={isPenalizado}
                        isLast={idx === meses.length - 1}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
