import { useMemo, useState } from "react";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ChatDirectAllowance,
  ChatDirectoryUser,
  ChatPermissionFlagKey,
  ChatPermissionFlags,
} from "../types/chat.types";

interface PermissionsPanelProps {
  open: boolean;
  matrix: ChatPermissionFlags[];
  canEdit: boolean;
  canManageAllowances: boolean;
  people: ChatDirectoryUser[];
  allowances: ChatDirectAllowance[];
  allowancesLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (
    row: ChatPermissionFlags,
    flag: ChatPermissionFlagKey,
    value: boolean,
  ) => void;
  onCreateAllowance: (userAId: number, userBId: number) => Promise<void>;
  onRevokeAllowance: (id: number) => Promise<void>;
}

const COLUMNS: {
  key: ChatPermissionFlagKey;
  label: string;
  hint?: string;
}[] = [
  { key: "can_create_groups", label: "Crear grupos" },
  { key: "can_edit_groups", label: "Editar grupos" },
  { key: "can_delete_messages", label: "Borrar mensajes" },
  { key: "can_audit_all_chats", label: "Auditoría total" },
  {
    key: "can_allow_direct_messages",
    label: "Gestionar autorizaciones 1 a 1",
    hint: "Permite al usuario autorizar excepciones de chats privados entre otros colaboradores",
  },
  {
    key: "can_delete_rooms",
    label: "Eliminar conversaciones",
    hint: "Permite eliminar permanentemente cualquier chat (grupo o privado), incluso aquellos en los que no participa",
  },
];

export const PermissionsPanel = ({
  open,
  matrix,
  canEdit,
  canManageAllowances,
  people,
  allowances,
  allowancesLoading,
  onOpenChange,
  onToggle,
  onCreateAllowance,
  onRevokeAllowance,
}: PermissionsPanelProps) => {
  const showMatrix = matrix.length > 0;
  const defaultTab = showMatrix ? "permisos" : "excepciones";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Permisos y autorizaciones de chat</DialogTitle>
        </DialogHeader>
        <Tabs key={defaultTab} defaultValue={defaultTab} className="gap-3">
          <TabsList className="w-full">
            {showMatrix && (
              <TabsTrigger value="permisos">Matriz de permisos</TabsTrigger>
            )}
            <TabsTrigger value="excepciones">Excepciones 1 a 1 activas</TabsTrigger>
          </TabsList>

          {showMatrix && (
            <TabsContent value="permisos">
              <div className="overflow-auto max-h-[60vh] rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Colaborador</th>
                      <th className="text-left px-3 py-2 font-medium">Rol</th>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2 font-medium text-center min-w-28"
                          title={col.hint}
                        >
                          <span className="inline-flex items-center justify-center gap-1 leading-tight">
                            {col.label}
                            {col.hint && (
                              <Info
                                size={12}
                                className="shrink-0 text-muted-foreground"
                                aria-label={col.hint}
                              />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row) => (
                      <tr key={row.user_id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <p className="font-medium">{row.nombre_completo}</p>
                          <p className="text-[11px] text-muted-foreground">
                            @{row.username}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.rol || "—"}
                        </td>
                        {COLUMNS.map((col) => (
                          <td key={col.key} className="px-3 py-2 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={row[col.key]}
                                disabled={!canEdit || row.is_dueno_bypass}
                                onCheckedChange={(value) =>
                                  onToggle(row, col.key, value)
                                }
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!canEdit && (
                <p className="text-xs text-muted-foreground mt-2">
                  Solo el dueño puede modificar la matriz. Estás en modo auditoría.
                </p>
              )}
            </TabsContent>
          )}

          <TabsContent value="excepciones">
            <AllowancesTab
              people={people}
              allowances={allowances}
              loading={Boolean(allowancesLoading)}
              canManage={canManageAllowances}
              onCreate={onCreateAllowance}
              onRevoke={onRevokeAllowance}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface AllowancesTabProps {
  people: ChatDirectoryUser[];
  allowances: ChatDirectAllowance[];
  loading: boolean;
  canManage: boolean;
  onCreate: (userAId: number, userBId: number) => Promise<void>;
  onRevoke: (id: number) => Promise<void>;
}

const AllowancesTab = ({
  people,
  allowances,
  loading,
  canManage,
  onCreate,
  onRevoke,
}: AllowancesTabProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [userA, setUserA] = useState<number | "">("");
  const [userB, setUserB] = useState<number | "">("");
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const optionsA = useMemo(
    () =>
      people.filter((person) =>
        person.nombre_completo.toLowerCase().includes(queryA.toLowerCase()),
      ),
    [people, queryA],
  );

  const optionsB = useMemo(
    () =>
      people.filter(
        (person) =>
          person.id !== userA &&
          person.nombre_completo.toLowerCase().includes(queryB.toLowerCase()),
      ),
    [people, queryB, userA],
  );

  const selectedA = people.find((person) => person.id === userA);
  const selectedB = people.find((person) => person.id === userB);

  const resetForm = () => {
    setUserA("");
    setUserB("");
    setQueryA("");
    setQueryB("");
    setFormOpen(false);
  };

  const submit = async () => {
    if (userA === "" || userB === "" || userA === userB) return;
    setSaving(true);
    try {
      await onCreate(Number(userA), Number(userB));
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Pares que pueden chatear en privado aunque no compartan un grupo.
        </p>
        {canManage && (
          <Button size="sm" onClick={() => setFormOpen((open) => !open)}>
            <Plus size={14} />
            Autorizar nuevo par
          </Button>
        )}
      </div>

      {formOpen && canManage && (
        <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Autorizar nuevo par</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <UserPicker
              label="Usuario 1"
              query={queryA}
              onQuery={setQueryA}
              selected={selectedA}
              options={optionsA}
              onSelect={setUserA}
            />
            <UserPicker
              label="Usuario 2"
              query={queryB}
              onQuery={setQueryB}
              selected={selectedB}
              options={optionsB}
              onSelect={setUserB}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={saving || userA === "" || userB === "" || userA === userB}
              onClick={() => void submit()}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border max-h-[45vh] overflow-y-auto divide-y divide-border">
        {loading && (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
          </div>
        )}
        {!loading && allowances.length === 0 && (
          <p className="px-4 py-8 text-sm text-center text-muted-foreground">
            No hay excepciones 1 a 1 vigentes.
          </p>
        )}
        {allowances.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {row.user_a_nombre} ↔ {row.user_b_nombre}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Autorizó {row.created_by_nombre || row.authorized_by_nombre || "—"}
              </p>
            </div>
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={revokingId === row.id}
                onClick={() => {
                  setRevokingId(row.id);
                  void onRevoke(row.id).finally(() => setRevokingId(null));
                }}
              >
                {revokingId === row.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Revocar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const UserPicker = ({
  label,
  query,
  onQuery,
  selected,
  options,
  onSelect,
}: {
  label: string;
  query: string;
  onQuery: (value: string) => void;
  selected?: ChatDirectoryUser;
  options: ChatDirectoryUser[];
  onSelect: (id: number) => void;
}) => {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {selected && (
        <p className="text-sm font-medium truncate">{selected.nombre_completo}</p>
      )}
      <Input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Buscar colaborador"
      />
      <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-background">
        {options.slice(0, 8).map((person) => (
          <button
            key={person.id}
            type="button"
            className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-muted/70 truncate"
            onClick={() => {
              onSelect(person.id);
              onQuery("");
            }}
          >
            {person.nombre_completo}
          </button>
        ))}
        {options.length === 0 && (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">Sin resultados</p>
        )}
      </div>
    </div>
  );
};
