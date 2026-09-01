import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { userService } from "@/features/users/services/userService";
import { chatApi } from "../services/chat.api";
import { useChatSocket } from "../hooks/useChatSocket";
import { playNotificationPop } from "../lib/chat.utils";
import type {
  ChatFilter,
  ChatMessage,
  ChatPermissionFlags,
  ChatRoom,
  ChatWsIncoming,
  SendMessagePayload,
} from "../types/chat.types";
import { ChatSidebar } from "../components/ChatSidebar";
import { ConversationPanel } from "../components/ConversationPanel";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { PermissionsPanel } from "../components/PermissionsPanel";

const ROOMS_KEY = ["chat", "rooms"] as const;

export const ChatPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [typingName, setTypingName] = useState<string | null>(null);
  const activeRoomIdRef = useRef<number | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);

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
    queryFn: () => userService.getAll({ activo: true }),
    retry: 1,
  });

  const own = permissionsQuery.data?.own;
  const canCreateGroups = Boolean(own?.can_create_groups);
  const canDelete = Boolean(own?.can_delete_messages);
  const canAudit = Boolean(own?.can_audit_all_chats);
  const isDueno = user?.rol?.codigo === "DUENO";

  const rooms = roomsQuery.data ?? [];
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (filter === "grupos" && room.room_type !== "GROUP") return false;
      if (filter === "privados" && room.room_type !== "DIRECT") return false;
      if (!q) return true;
      const preview = room.last_message?.content ?? "";
      return (
        room.display_name.toLowerCase().includes(q) ||
        preview.toLowerCase().includes(q)
      );
    });
  }, [rooms, filter, search]);

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

  const patchRooms = useCallback(
    (updater: (prev: ChatRoom[]) => ChatRoom[]) => {
      queryClient.setQueryData<ChatRoom[]>(ROOMS_KEY, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient],
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
      if (event.type === "error") {
        toast.error(event.detail);
        return;
      }

      if (event.type === "chat_message") {
        const msg = event.message;
        if (msg.room === activeRoomIdRef.current) {
          upsertMessage(msg);
          void chatApi.markRead(msg.room, [msg.id]);
        }
        patchRooms((prev) =>
          prev
            .map((room) =>
              room.id === msg.room
                ? {
                    ...room,
                    last_message: {
                      id: msg.id,
                      sender: msg.sender,
                      sender_nombre: msg.sender_nombre,
                      content: msg.content,
                      message_type: msg.message_type,
                      is_deleted: msg.is_deleted,
                      created_at: msg.created_at,
                    },
                    unread_count:
                      msg.room === activeRoomIdRef.current ||
                      msg.sender === currentUserId
                        ? 0
                        : room.unread_count + 1,
                    updated_at: msg.created_at,
                  }
                : room,
            )
            .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
        );
        return;
      }

      if (event.type === "chat_notification") {
        const inRoom = event.room_id === activeRoomIdRef.current;
        const inBackground = document.hidden;
        if ((!inRoom || inBackground) && event.sender_id !== currentUserId) {
          playNotificationPop();
          toast(`${event.sender_name}`, { description: event.preview });
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

      if (event.type === "chat_message_read" && event.room_id === activeRoomIdRef.current) {
        setMessages((prev) =>
          prev.map((item) =>
            event.message_ids.includes(item.id) ? { ...item, is_read: true } : item,
          ),
        );
        return;
      }

      if (event.type === "chat_typing" && event.room_id === activeRoomIdRef.current) {
        setTypingName(event.user_name);
        if (typingTimer.current) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTypingName(null), 2500);
      }
    },
    [currentUserId, patchRooms, upsertMessage],
  );

  const { joinRoom, sendTyping, sendViaSocket } = useChatSocket({
    enabled: Boolean(user),
    onEvent: handleWsEvent,
  });

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
      setTypingName(null);
      joinRoom(room.id);
      patchRooms((prev) =>
        prev.map((item) =>
          item.id === room.id ? { ...item, unread_count: 0 } : item,
        ),
      );
      await loadMessages(room.id, 1);
      try {
        await chatApi.markRead(room.id);
      } catch {
        // el marcado de leído no debe bloquear la conversación
      }
    },
    [joinRoom, loadMessages, patchRooms],
  );

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
    try {
      const room = await chatApi.createRoom({
        room_type: "DIRECT",
        member_ids: [userId],
      });
      patchRooms((prev) => {
        const exists = prev.some((item) => item.id === room.id);
        return exists ? prev : [room, ...prev];
      });
      setSearch("");
      await selectRoom(room);
    } catch (error) {
      toast.error(
        chatApi.extraerError(
          error,
          "No pueden iniciar un chat directo. Necesitan un grupo en común o una autorización.",
        ),
      );
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
    flag: keyof Pick<
      ChatPermissionFlags,
      | "can_create_groups"
      | "can_delete_messages"
      | "can_audit_all_chats"
      | "can_allow_direct_messages"
    >,
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
              onLoadMore={() => {
                if (activeRoomId) void loadMessages(activeRoomId, messagesPage + 1);
              }}
              onSend={handleSend}
              onDelete={setPendingDelete}
              onTyping={() => {
                if (activeRoomId) sendTyping(activeRoomId);
              }}
              onBack={() => setActiveRoomId(null)}
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
        onOpenChange={setPermsOpen}
        onToggle={(row, flag, value) => void togglePermission(row, flag, value)}
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
    </div>
  );
};
