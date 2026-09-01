import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Camera,
  Check,
  Loader2,
  Pencil,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { uploadImagenToCloudinary } from "@/lib/cloudinary.utils";
import type { ChatDirectoryUser, ChatMember, ChatRoom } from "../types/chat.types";
import { avatarTone, firstName, initials } from "../lib/chat.utils";
import { chatApi } from "../services/chat.api";
import { MemberPrivateChatMenu } from "./MemberPrivateChatMenu";
import { RoomAvatar } from "./RoomAvatar";

interface GroupInfoDrawerProps {
  open: boolean;
  room: ChatRoom;
  currentUserId: number;
  users: ChatDirectoryUser[];
  onOpenChange: (open: boolean) => void;
  onRoomUpdated: (room: ChatRoom) => void;
  onStartPrivateChat?: (userId: number) => void;
}

export const GroupInfoDrawer = ({
  open,
  room,
  currentUserId,
  users,
  onOpenChange,
  onRoomUpdated,
  onStartPrivateChat,
}: GroupInfoDrawerProps) => {
  const isGroup = room.room_type === "GROUP";
  const canEdit = isGroup && Boolean(room.can_edit);
  const fileRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"info" | "add">("info");
  const [nameDraft, setNameDraft] = useState(room.name);
  const [descDraft, setDescDraft] = useState(room.description ?? "");
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pendingRemove, setPendingRemove] = useState<ChatMember | null>(null);

  useEffect(() => {
    if (!open) {
      setView("info");
      setEditingName(false);
      setEditingDesc(false);
      setAddQuery("");
      setSelectedIds([]);
      setPendingRemove(null);
    }
  }, [open]);

  useEffect(() => {
    setNameDraft(room.name);
    setDescDraft(room.description ?? "");
  }, [room.id, room.name, room.description]);

  const members = useMemo(
    () =>
      [...room.members].sort((a, b) => {
        if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
        return a.nombre_completo.localeCompare(b.nombre_completo, "es");
      }),
    [room.members],
  );

  const memberIds = useMemo(
    () => new Set(room.members.map((member) => member.user)),
    [room.members],
  );

  const candidates = useMemo(
    () =>
      users.filter(
        (user) =>
          user.activo &&
          !memberIds.has(user.id) &&
          user.nombre_completo.toLowerCase().includes(addQuery.toLowerCase()),
      ),
    [users, memberIds, addQuery],
  );

  const createdLabel = useMemo(() => {
    if (!room.created_at) return null;
    const date = parseISO(room.created_at);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  }, [room.created_at]);

  const applyUpdate = (updated: ChatRoom) => {
    onRoomUpdated(updated);
  };

  const saveField = async (payload: { name?: string; description?: string }) => {
    setSaving(true);
    try {
      const updated = await chatApi.updateRoom(room.id, payload);
      applyUpdate(updated);
      toast.success("Grupo actualizado.");
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo actualizar el grupo."));
      setNameDraft(room.name);
      setDescDraft(room.description ?? "");
    } finally {
      setSaving(false);
      setEditingName(false);
      setEditingDesc(false);
    }
  };

  const commitName = () => {
    const next = nameDraft.trim();
    if (!next || next === room.name) {
      setNameDraft(room.name);
      setEditingName(false);
      return;
    }
    void saveField({ name: next });
  };

  const commitDesc = () => {
    const next = descDraft.trim();
    if (next === (room.description ?? "").trim()) {
      setEditingDesc(false);
      return;
    }
    void saveField({ description: next });
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !canEdit) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImagenToCloudinary(file, "chat/groups");
      const updated = await chatApi.updateRoom(room.id, { image_url: url });
      applyUpdate(updated);
      toast.success("Foto del grupo actualizada.");
    } catch (error) {
      toast.error(
        chatApi.extraerError(error, "No se pudo subir la foto del grupo."),
      );
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = async () => {
    if (!canEdit || !room.image_url) return;
    setUploading(true);
    try {
      const updated = await chatApi.updateRoom(room.id, { image_url: "" });
      applyUpdate(updated);
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo quitar la foto."));
    } finally {
      setUploading(false);
    }
  };

  const addSelected = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const updated = await chatApi.addMembers(room.id, selectedIds);
      applyUpdate(updated);
      setSelectedIds([]);
      setAddQuery("");
      setView("info");
      toast.success(
        selectedIds.length === 1
          ? "Participante añadido."
          : `${selectedIds.length} participantes añadidos.`,
      );
    } catch (error) {
      toast.error(
        chatApi.extraerError(error, "No se pudieron añadir los participantes."),
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    setSaving(true);
    try {
      const updated = await chatApi.removeMember(room.id, pendingRemove.user);
      applyUpdate(updated);
      toast.success(
        pendingRemove.user === currentUserId
          ? "Saliste del grupo."
          : `${pendingRemove.nombre_completo} fue eliminado del grupo.`,
      );
      setPendingRemove(null);
    } catch (error) {
      toast.error(
        chatApi.extraerError(error, "No se pudo eliminar al integrante."),
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: ChatMember, role: "ADMIN" | "MEMBER") => {
    setSaving(true);
    try {
      const updated = await chatApi.updateMemberRole(room.id, member.user, role);
      applyUpdate(updated);
      toast.success(
        role === "ADMIN"
          ? `${firstName(member.nombre_completo)} ahora es administrador.`
          : `${firstName(member.nombre_completo)} ya no es administrador.`,
      );
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo cambiar el rol."));
    } finally {
      setSaving(false);
    }
  };

  const startPrivate = (userId: number) => {
    onOpenChange(false);
    onStartPrivateChat?.(userId);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 gap-0 overflow-y-auto [&>button]:text-white [&>button]:hover:bg-white/15 [&>button]:hover:opacity-100"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {isGroup ? "Información del grupo" : "Info del chat"}
            </SheetTitle>
            <SheetDescription>
              {isGroup
                ? `${room.members.length} participantes`
                : "Chat privado"}
            </SheetDescription>
          </SheetHeader>

          {view === "add" && canEdit ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-4 border-b border-border">
                <p className="text-sm font-semibold">Añadir participantes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Elige colaboradores que aún no están en el grupo.
                </p>
              </div>
              <div className="p-4 space-y-3 flex-1">
                <Input
                  value={addQuery}
                  onChange={(event) => setAddQuery(event.target.value)}
                  placeholder="Buscar colaboradores"
                />
                <div className="max-h-[60vh] overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {candidates.length === 0 && (
                    <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                      No hay más colaboradores disponibles.
                    </p>
                  )}
                  {candidates.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(user.id)
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id],
                          )
                        }
                        className="accent-sky-500"
                      />
                      <span className="flex-1 truncate">{user.nombre_completo}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {user.rol?.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView("info")}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  disabled={saving || selectedIds.length === 0}
                  onClick={() => void addSelected()}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Añadir
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="bg-sky-700 text-white px-5 pt-12 pb-6 flex flex-col items-center text-center">
                <div className="relative">
                  <RoomAvatar
                    room={room}
                    className="size-28"
                    iconSize={36}
                  />
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute bottom-0 right-0 size-9 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-400"
                        aria-label="Cambiar foto del grupo"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void handlePhoto(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>

                {canEdit && editingName ? (
                  <div className="w-full mt-4 flex items-center gap-2">
                    <Input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onBlur={commitName}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitName();
                        if (event.key === "Escape") {
                          setNameDraft(room.name);
                          setEditingName(false);
                        }
                      }}
                      autoFocus
                      maxLength={150}
                      className="bg-white/15 border-white/30 text-white placeholder:text-white/70"
                    />
                    <button
                      type="button"
                      onClick={commitName}
                      className="size-9 rounded-full bg-white/20 flex items-center justify-center"
                      aria-label="Guardar nombre"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "mt-4 text-xl font-semibold flex items-center gap-2",
                      canEdit && "hover:underline",
                    )}
                    onClick={() => canEdit && setEditingName(true)}
                    disabled={!canEdit}
                  >
                    {room.display_name}
                    {canEdit && <Pencil size={14} className="opacity-80" />}
                  </button>
                )}

                <p className="text-sm text-white/80 mt-1">
                  {isGroup
                    ? `Grupo · ${room.members.length} participantes`
                    : "Chat privado"}
                </p>
                {createdLabel && isGroup && (
                  <p className="text-[11px] text-white/70 mt-1">
                    Creado el {createdLabel}
                    {room.created_by_nombre ? ` por ${room.created_by_nombre}` : ""}
                  </p>
                )}
                {canEdit && room.image_url && (
                  <button
                    type="button"
                    onClick={() => void clearPhoto()}
                    className="mt-2 text-[11px] text-white/80 hover:underline"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              {isGroup && (
                <section className="px-4 py-3 border-b border-border">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Descripción
                  </p>
                  {canEdit && editingDesc ? (
                    <Textarea
                      value={descDraft}
                      onChange={(event) => setDescDraft(event.target.value)}
                      onBlur={commitDesc}
                      maxLength={300}
                      autoFocus
                      rows={3}
                    />
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left text-sm",
                        canEdit && "hover:bg-muted/50 rounded-md px-1 -mx-1 py-1",
                      )}
                      onClick={() => canEdit && setEditingDesc(true)}
                      disabled={!canEdit}
                    >
                      {(room.description || "").trim() ? (
                        room.description
                      ) : (
                        <span className="text-muted-foreground">
                          {canEdit
                            ? "Añade una descripción del grupo"
                            : "Sin descripción"}
                        </span>
                      )}
                    </button>
                  )}
                </section>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setView("add")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sky-700 hover:bg-muted/60 text-sm font-medium border-b border-border"
                >
                  <span className="size-10 rounded-full bg-sky-500/15 text-sky-700 flex items-center justify-center">
                    <UserPlus size={18} />
                  </span>
                  Añadir participante
                </button>
              )}

              <section className="px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                  <Users size={12} />
                  {room.members.length} participantes
                </p>
                <ul className="space-y-0.5">
                  {members.map((member) => {
                    const isSelf = member.user === currentUserId;
                    const row = (
                      <span className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-10">
                          <AvatarFallback
                            className={cn(
                              "text-white text-[10px]",
                              avatarTone(member.nombre_completo),
                            )}
                          >
                            {initials(member.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm truncate">
                            {member.nombre_completo}
                            {isSelf ? " (tú)" : ""}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            @{member.username}
                          </span>
                        </span>
                        {member.role === "ADMIN" && (
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Shield size={10} />
                            Admin
                          </span>
                        )}
                      </span>
                    );

                    if (!canEdit && (!onStartPrivateChat || isSelf || !isGroup)) {
                      return (
                        <li key={member.user} className="rounded-lg px-2 py-2">
                          {row}
                        </li>
                      );
                    }

                    if (!canEdit) {
                      return (
                        <li key={member.user}>
                          <MemberPrivateChatMenu
                            memberName={member.nombre_completo}
                            onChat={() => startPrivate(member.user)}
                          >
                            <button
                              type="button"
                              className="w-full rounded-lg px-2 py-2 hover:bg-muted/70 text-left"
                            >
                              {row}
                            </button>
                          </MemberPrivateChatMenu>
                        </li>
                      );
                    }

                    return (
                      <li key={member.user}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="w-full rounded-lg px-2 py-2 hover:bg-muted/70 text-left"
                            >
                              {row}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-56">
                            <DropdownMenuLabel className="font-normal text-muted-foreground truncate">
                              {member.nombre_completo}
                            </DropdownMenuLabel>
                            {!isSelf && onStartPrivateChat && (
                              <DropdownMenuItem
                                onSelect={() => startPrivate(member.user)}
                              >
                                Enviar mensaje a {firstName(member.nombre_completo)}
                              </DropdownMenuItem>
                            )}
                            {member.role === "MEMBER" ? (
                              <DropdownMenuItem
                                onSelect={() => void changeRole(member, "ADMIN")}
                              >
                                <Shield size={14} />
                                Transferir / hacer admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() => void changeRole(member, "MEMBER")}
                              >
                                Quitar rol de admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setPendingRemove(member)}
                            >
                              <UserMinus size={14} />
                              {isSelf ? "Salir del grupo" : "Eliminar del grupo"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
                {!canEdit && isGroup && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Solo lectura. Pide a un administrador o al dueño que te
                    conceda el permiso «Editar grupos».
                  </p>
                )}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingRemove)}
        onOpenChange={(next) => !next && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRemove?.user === currentUserId
                ? "¿Salir de este grupo?"
                : `¿Eliminar a ${pendingRemove?.nombre_completo}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove?.user === currentUserId
                ? "Dejarás de recibir mensajes de este grupo."
                : "La persona dejará de ver esta conversación. Debe quedar al menos un administrador y dos integrantes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={() => void confirmRemove()}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
