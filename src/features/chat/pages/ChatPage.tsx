import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { useAuth } from "@/features/auth/context/useAuth";
import { useChatRealtime } from "../context/useChatRealtime";
import { CHAT_ROOMS_QUERY_KEY, CHAT_ALLOWANCES_QUERY_KEY, chatApi } from "../services/chat.api";
import { findDirectRoomWithUser, mergeDeliveryStatus } from "../lib/chat.utils";
import type {
  ChatDeliveryStatus,
  ChatFilter,
  ChatMessage,
  ChatPermissionFlagKey,
  ChatPermissionFlags,
  ChatReceiptUpdate,
  ChatRoom,
  ChatWsIncoming,
  SendMessagePayload,
} from "../types/chat.types";
import { ChatSidebar } from "../components/ChatSidebar";
import { ConversationPanel } from "../components/ConversationPanel";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { PermissionsPanel } from "../components/PermissionsPanel";

const ROOMS_KEY = CHAT_ROOMS_QUERY_KEY;

export const ChatPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    joinRoom,
    sendTyping,
    sendViaSocket,
    setActiveRoomId: setGlobalActiveRoomId,
    subscribe,
  } = useChatRealtime();
  const currentUserId = user?.id ?? 0;

  const [filter, setFilter] = useState<ChatFilter>("todos");
  const [search, setSearch] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatMessage | null>(null);
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);
  const openingDirectRef = useRef<number | null>(null);
  const visibleReadQueue = useRef<Set<number>>(new Set());
  const visibleReadTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const roomsQuery = useQuery({
    queryKey: ROOMS_KEY,
    queryFn: chatApi.getRooms,
  });

  const permissionsQuery = useQuery({
    queryKey: ["chat", "permissions", currentUserId],
    queryFn: () => chatApi.getPermissions(currentUserId),
    enabled: currentUserId > 0,
  });

  const usersQuery = useQuery({
    queryKey: ["chat", "people"],
    queryFn: chatApi.getPeople,
    retry: 1,
  });

  const own = permissionsQuery.data?.own;
  const canCreateGroups = Boolean(own?.can_create_groups);
  const canDelete = Boolean(own?.can_delete_messages);
  const canAudit = Boolean(own?.can_audit_all_chats);
  const canAllowDirect = Boolean(own?.can_allow_direct_messages);
  const canDeleteRooms = Boolean(own?.can_delete_rooms);
  const isDueno = user?.rol?.codigo === "DUENO";

  const allowancesQuery = useQuery({
    queryKey: CHAT_ALLOWANCES_QUERY_KEY,
    queryFn: chatApi.getAllowances,
    enabled: permsOpen && (canAllowDirect || isDueno || canAudit),
  });

  const rooms = roomsQuery.data ?? [];

  const isMember = useCallback(
    (room: ChatRoom) =>
      room.members.some((m) => m.user === currentUserId && m.is_active),
    [currentUserId],
  );

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms
      .filter((room) => {
        const amMember = isMember(room);
        if (filter === "todos") return amMember;
        if (filter === "grupos") return amMember && room.room_type === "GROUP";
        if (filter === "privados") return amMember && room.room_type === "DIRECT";
        if (filter === "auditoria") return !amMember;
        return amMember;
      })
      .filter((room) => {
        if (!q) return true;
        const preview = room.last_message?.content ?? "";
        return (
          room.display_name.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      });
  }, [rooms, filter, search, isMember]);

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const directPeerIds = new Set(
      rooms
        .filter((room) => room.room_type === "DIRECT")
        .flatMap((room) => room.members.map((m) => m.user))
        .filter((id) => id !== currentUserId),
    );
    const source =
      usersQuery.data ??
      rooms.flatMap((room) =>
        room.members.map((m) => ({
          id: m.user,
          nombre_completo: m.nombre_completo,
        })),
      );
    const unique = new Map<number, { id: number; nombre_completo: string }>();
    source.forEach((item) => {
      unique.set(item.id, { id: item.id, nombre_completo: item.nombre_completo });
    });
    return [...unique.values()].filter(
      (person) =>
        person.id !== currentUserId &&
        !directPeerIds.has(person.id) &&
        person.nombre_completo.toLowerCase().includes(q),
    );
  }, [search, rooms, usersQuery.data, currentUserId]);

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;

  const isAuditRoom = useMemo(() => {
    if (!activeRoom) return false;
    if (!canAudit && !isDueno) return false;
    return !activeRoom.members.some(
      (m) => m.user === currentUserId && m.is_active,
    );
  }, [activeRoom, canAudit, isDueno, currentUserId]);

  const patchRooms = useCallback(
    (updater: (prev: ChatRoom[]) => ChatRoom[]) => {
      queryClient.setQueryData<ChatRoom[]>(ROOMS_KEY, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient],
  );

  const closeConversation = useCallback(() => {
    if (searchParams.has("room")) {
      setSearchParams({}, { replace: true });
      return;
    }
    setActiveRoomId(null);
    setGlobalActiveRoomId(null);
    activeRoomIdRef.current = null;
    setMessages((prev) => (prev.length === 0 ? prev : []));
    setTypingName(null);
  }, [searchParams, setGlobalActiveRoomId, setSearchParams]);

  const applyReceipts = useCallback((receipts: ChatReceiptUpdate[] | undefined) => {
    if (!receipts?.length) return;
    const byId = new Map(receipts.map((item) => [item.id, item.delivery_status]));
    setMessages((prev) =>
      prev.map((item) => {
        const next = byId.get(item.id);
        if (!next) return item;
        const merged = mergeDeliveryStatus(
          (item.delivery_status as ChatDeliveryStatus) || (item.is_read ? "read" : "sent"),
          next,
        );
        return {
          ...item,
          delivery_status: merged,
          is_read: merged === "read",
        };
      }),
    );
  }, []);

  const enqueueVisibleRead = useCallback(
    (messageId: number) => {
      const roomId = activeRoomIdRef.current;
      if (!roomId) return;
      visibleReadQueue.current.add(messageId);
      if (visibleReadTimer.current) return;
      visibleReadTimer.current = window.setTimeout(() => {
        visibleReadTimer.current = undefined;
        const ids = [...visibleReadQueue.current];
        visibleReadQueue.current.clear();
        const currentRoom = activeRoomIdRef.current;
        if (!ids.length || !currentRoom) return;
        const sent = sendViaSocket({
          type: "mark_as_read",
          room_id: currentRoom,
          message_ids: ids,
        });
        if (!sent) {
          void chatApi.markRead(currentRoom, ids);
        }
      }, 200);
    },
    [sendViaSocket],
  );

  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === incoming.id)) {
        return prev.map((item) => (item.id === incoming.id ? incoming : item));
      }
      return [...prev, incoming];
    });
  }, []);

  const handleWsEvent = useCallback(
    (event: ChatWsIncoming) => {
      if (event.type === "chat_message") {
        const msg = event.message;
        if (msg.room === activeRoomIdRef.current) {
          upsertMessage({
            ...msg,
            delivery_status: msg.delivery_status ?? (msg.is_read ? "read" : "sent"),
          });
        }
        return;
      }

      if (event.type === "chat_message_deleted") {
        if (event.room_id === activeRoomIdRef.current) {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === event.message_id
                ? { ...item, is_deleted: true, content: null, file_url: null }
                : item,
            ),
          );
        }
        return;
      }

      if (
        (event.type === "chat_message_delivered" || event.type === "chat_message_read") &&
        event.room_id === activeRoomIdRef.current
      ) {
        applyReceipts(event.receipts);
        return;
      }

      if (event.type === "chat_typing" && event.room_id === activeRoomIdRef.current) {
        setTypingName(event.user_name);
        if (typingTimer.current) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTypingName(null), 2500);
        return;
      }

      if (event.type === "group_updated" && event.room_id === activeRoomIdRef.current) {
        const stillMember = event.room.members.some(
          (member) => member.user === currentUserId && member.is_active,
        );
        if (!stillMember && !canAudit && !isDueno) {
          toast.info("Ya no formas parte de este grupo.");
          closeConversation();
        }
      }

      if (event.type === "room_deleted") {
        patchRooms((prev) => prev.filter((r) => r.id !== event.room_id));
        if (activeRoomIdRef.current === event.room_id) {
          closeConversation();
          toast.info("Esta conversación fue eliminada.");
        }
      }
    },
    [applyReceipts, canAudit, closeConversation, currentUserId, isDueno, upsertMessage],
  );

  useEffect(() => subscribe(handleWsEvent), [subscribe, handleWsEvent]);

  useEffect(() => {
    setGlobalActiveRoomId(activeRoomId);
    visibleReadQueue.current.clear();
    if (visibleReadTimer.current) {
      window.clearTimeout(visibleReadTimer.current);
      visibleReadTimer.current = undefined;
    }
  }, [activeRoomId, setGlobalActiveRoomId]);

  useEffect(() => {
    return () => setGlobalActiveRoomId(null);
  }, [setGlobalActiveRoomId]);

  const loadMessages = useCallback(async (roomId: number, page = 1) => {
    setLoadingMessages(true);
    try {
      const data = await chatApi.getMessages(roomId, page);
      const chronological = [...data.results].reverse();
      setMessages((prev) =>
        page === 1 ? chronological : [...chronological, ...prev],
      );
      setHasMore(Boolean(data.next));
      setMessagesPage(page);
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo cargar el historial."));
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectRoom = useCallback(
    async (room: ChatRoom) => {
      setActiveRoomId(room.id);
      setGlobalActiveRoomId(room.id);
      activeRoomIdRef.current = room.id;
      setMessages([]);
      setHasMore(false);
      setTypingName(null);
      joinRoom(room.id);
      patchRooms((prev) =>
        prev.map((item) =>
          item.id === room.id ? { ...item, unread_count: 0 } : item,
        ),
      );
      if (searchParams.get("room") !== String(room.id)) {
        setSearchParams(
          { room: String(room.id) },
          { replace: searchParams.has("room") },
        );
      }
      await loadMessages(room.id, 1);
    },
    [joinRoom, loadMessages, patchRooms, searchParams, setSearchParams, setGlobalActiveRoomId],
  );

  useEffect(() => {
    const raw = searchParams.get("room");
    if (!raw) {
      if (activeRoomId === null) return;
      setActiveRoomId(null);
      setGlobalActiveRoomId(null);
      activeRoomIdRef.current = null;
      setMessages((prev) => (prev.length === 0 ? prev : []));
      setTypingName(null);
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0 || id === activeRoomId) return;
    const room = rooms.find((item) => item.id === id);
    if (room) void selectRoom(room);
  }, [searchParams, rooms, activeRoomId, selectRoom, setGlobalActiveRoomId]);

  const handleSend = async (payload: SendMessagePayload) => {
    if (!activeRoomId) return;
    const sent = sendViaSocket({
      type: "send_message",
      room_id: activeRoomId,
      ...payload,
    });
    if (sent) return;
    try {
      const message = await chatApi.sendMessage(activeRoomId, payload);
      upsertMessage(message);
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo enviar el mensaje."));
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await chatApi.deleteMessage(pendingDelete.id);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === pendingDelete.id
            ? { ...item, is_deleted: true, content: null, file_url: null }
            : item,
        ),
      );
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo eliminar el mensaje."));
    } finally {
      setPendingDelete(null);
    }
  };

  const openDirect = async (userId: number) => {
    if (!userId || userId === currentUserId) return;
    if (openingDirectRef.current === userId) return;
    openingDirectRef.current = userId;
    try {
      if (filter === "grupos") setFilter("todos");
      setSearch("");

      const existing = findDirectRoomWithUser(rooms, userId);
      if (existing) {
        await selectRoom(existing);
        return;
      }

      const room = await chatApi.createRoom({
        room_type: "DIRECT",
        member_ids: [userId],
      });
      patchRooms((prev) => {
        const exists = prev.some((item) => item.id === room.id);
        return exists ? prev : [room, ...prev];
      });
      await selectRoom(room);
    } catch (error) {
      toast.error(
        chatApi.extraerError(
          error,
          "No pueden iniciar un chat directo. Necesitan un grupo en común o una autorización.",
        ),
      );
    } finally {
      openingDirectRef.current = null;
    }
  };

  const createGroup = async (name: string, memberIds: number[]) => {
    setCreatingGroup(true);
    try {
      const room = await chatApi.createRoom({
        name,
        room_type: "GROUP",
        member_ids: memberIds,
      });
      patchRooms((prev) => [room, ...prev]);
      setGroupOpen(false);
      await selectRoom(room);
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo crear el grupo."));
    } finally {
      setCreatingGroup(false);
    }
  };

  const togglePermission = async (
    row: ChatPermissionFlags,
    flag: ChatPermissionFlagKey,
    value: boolean,
  ) => {
    try {
      const updated = await chatApi.updatePermission(row.user_id, {
        [flag]: value,
      });
      queryClient.setQueryData(["chat", "permissions", currentUserId], (prev) => {
        if (!prev) return prev;
        const current = prev as { own: ChatPermissionFlags; matrix: ChatPermissionFlags[] | null };
        return {
          ...current,
          matrix: current.matrix?.map((item) =>
            item.user_id === updated.user_id ? { ...item, ...updated } : item,
          ) ?? null,
        };
      });
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo actualizar el permiso."));
    }
  };

  const createAllowance = async (userAId: number, userBId: number) => {
    try {
      await chatApi.createAllowance(userAId, userBId);
      await queryClient.invalidateQueries({ queryKey: CHAT_ALLOWANCES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
      toast.success("Par autorizado. Ya pueden chatear en privado.");
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo autorizar el par."));
      throw error;
    }
  };

  const revokeAllowance = async (id: number) => {
    try {
      await chatApi.revokeAllowance(id);
      await queryClient.invalidateQueries({ queryKey: CHAT_ALLOWANCES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
      toast.success("Excepción revocada.");
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo revocar la excepción."));
    }
  };

  const unlockDirect = async () => {
    if (!activeRoomId) return;
    setUnlocking(true);
    try {
      const updated = await chatApi.unlockRoom(activeRoomId);
      patchRooms((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? { ...item, ...updated, last_message: updated.last_message ?? item.last_message }
            : item,
        ),
      );
      toast.success("Chat directo habilitado para ambos usuarios.");
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo habilitar el chat."));
    } finally {
      setUnlocking(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoomId) return;
    try {
      await chatApi.deleteRoom(activeRoomId);
      patchRooms((prev) => prev.filter((r) => r.id !== activeRoomId));
      closeConversation();
      toast.success("Conversación eliminada permanentemente.");
    } catch (error) {
      toast.error(chatApi.extraerError(error, "No se pudo eliminar la conversación."));
    } finally {
      setPendingDeleteRoom(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-60px)] lg:h-screen overflow-hidden bg-background">
      <div className="flex h-full border-t border-border">
        <div
          className={
            activeRoomId ? "hidden md:flex md:h-full" : "flex h-full w-full md:w-auto"
          }
        >
          <ChatSidebar
            userName={user.nombre_completo}
            rooms={filteredRooms}
            activeRoomId={activeRoomId}
            search={search}
            filter={filter}
            canCreateGroups={canCreateGroups}
            canAudit={canAudit || isDueno}
            canOpenSettings={canAudit || isDueno || canAllowDirect}
            people={people}
            onSearch={setSearch}
            onFilter={setFilter}
            onSelectRoom={(room) => void selectRoom(room)}
            onSelectPerson={(id) => void openDirect(id)}
            onNewGroup={() => setGroupOpen(true)}
            onOpenPermissions={() => setPermsOpen(true)}
          />
        </div>

        <div className={activeRoomId ? "flex flex-1 min-w-0" : "hidden md:flex flex-1 min-w-0"}>
          {roomsQuery.isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ConversationPanel
              room={activeRoom}
              messages={messages}
              loading={loadingMessages}
              currentUserId={currentUserId}
              canDelete={canDelete}
              typingName={typingName}
              hasMore={hasMore}
              isAuditRoom={isAuditRoom}
              onLoadMore={() => {
                if (activeRoomId) void loadMessages(activeRoomId, messagesPage + 1);
              }}
              onSend={handleSend}
              onDelete={setPendingDelete}
              onTyping={() => {
                if (activeRoomId) sendTyping(activeRoomId);
              }}
              onBack={closeConversation}
              onStartPrivateChat={(userId) => void openDirect(userId)}
              onMessageVisible={enqueueVisibleRead}
              users={usersQuery.data ?? []}
              canUnlockDirect={canAllowDirect || isDueno}
              unlocking={unlocking}
              onUnlockDirect={() => void unlockDirect()}
              canDeleteRoom={canDeleteRooms || isDueno}
              onDeleteRoom={() => setPendingDeleteRoom(true)}
              onRoomUpdated={(updated) => {
                patchRooms((prev) => {
                  const stillMember = updated.members.some(
                    (member) => member.user === currentUserId && member.is_active,
                  );
                  if (!stillMember && !canAudit && !isDueno) {
                    return prev.filter((item) => item.id !== updated.id);
                  }
                  const exists = prev.some((item) => item.id === updated.id);
                  if (!exists) return [updated, ...prev];
                  return prev.map((item) =>
                    item.id === updated.id
                      ? {
                          ...item,
                          ...updated,
                          last_message: updated.last_message ?? item.last_message,
                          unread_count: updated.unread_count ?? item.unread_count,
                        }
                      : item,
                  );
                });
                const stillMember = updated.members.some(
                  (member) => member.user === currentUserId && member.is_active,
                );
                if (!stillMember && !canAudit && !isDueno) {
                  closeConversation();
                }
              }}
            />
          )}
        </div>
      </div>

      <CreateGroupModal
        open={groupOpen}
        users={usersQuery.data ?? []}
        currentUserId={currentUserId}
        submitting={creatingGroup}
        onOpenChange={setGroupOpen}
        onSubmit={createGroup}
      />

      <PermissionsPanel
        open={permsOpen}
        matrix={permissionsQuery.data?.matrix ?? []}
        canEdit={isDueno}
        canManageAllowances={canAllowDirect || isDueno}
        people={usersQuery.data ?? []}
        allowances={allowancesQuery.data ?? []}
        allowancesLoading={allowancesQuery.isFetching}
        onOpenChange={setPermsOpen}
        onToggle={(row, flag, value) => void togglePermission(row, flag, value)}
        onCreateAllowance={createAllowance}
        onRevokeAllowance={revokeAllowance}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              El mensaje se ocultará para todos los participantes (borrado lógico).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingDeleteRoom}
        onOpenChange={(open) => !open && setPendingDeleteRoom(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es <strong>permanente e irreversible</strong>. Se
              eliminarán todos los mensajes, archivos e historial. Todos los
              participantes perderán el acceso inmediatamente.
              {activeRoom?.room_type === "GROUP" && (
                <span className="block mt-1">
                  Al eliminar el grupo, los chats privados entre sus miembros
                  podrían bloquearse si no comparten otro grupo activo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteRoom()}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
