import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/useAuth";
import { useChatSocket } from "../hooks/useChatSocket";
import { showIncomingChatToast } from "../lib/chat.notifications";
import {
  bindChatNotificationAudioUnlock,
  mergeGroupSnapshot,
  playNotificationPop,
} from "../lib/chat.utils";
import {
  CHAT_ALLOWANCES_QUERY_KEY,
  CHAT_ROOMS_QUERY_KEY,
  chatApi,
} from "../services/chat.api";
import type { ChatRoom, ChatWsIncoming, ChatWsNotification } from "../types/chat.types";
import { ChatRealtimeContext, type ChatRealtimeValue } from "./ChatRealtimeContext";

function patchRoomsCache(
  rooms: ChatRoom[],
  roomId: number,
  updater: (room: ChatRoom) => ChatRoom,
): ChatRoom[] {
  const exists = rooms.some((room) => room.id === roomId);
  if (!exists) return rooms;
  return rooms
    .map((room) => (room.id === roomId ? updater(room) : room))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export const ChatRealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = user?.id ?? 0;
  const activeRoomIdRef = useRef<number | null>(null);
  const listenersRef = useRef(new Set<(event: ChatWsIncoming) => void>());
  const sendRef = useRef<(payload: Record<string, unknown>) => boolean>(() => false);

  const roomsQuery = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    queryFn: chatApi.getRooms,
    enabled: isAuthenticated && currentUserId > 0,
  });

  const permissionsQuery = useQuery({
    queryKey: ["chat", "permissions", currentUserId],
    queryFn: () => chatApi.getPermissions(currentUserId),
    enabled: isAuthenticated && currentUserId > 0,
  });

  const canEditGroups = Boolean(permissionsQuery.data?.own.can_edit_groups);

  const unreadTotal = useMemo(
    () =>
      (roomsQuery.data ?? []).reduce(
        (sum, room) => sum + (room.unread_count || 0),
        0,
      ),
    [roomsQuery.data],
  );

  useEffect(() => bindChatNotificationAudioUnlock(), []);

  const setRooms = useCallback(
    (updater: (prev: ChatRoom[]) => ChatRoom[]) => {
      queryClient.setQueryData<ChatRoom[]>(CHAT_ROOMS_QUERY_KEY, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient],
  );

  const refreshRoomsIfMissing = useCallback(
    (roomId: number, rooms: ChatRoom[]) => {
      if (!rooms.some((room) => room.id === roomId)) {
        void queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY });
      }
    },
    [queryClient],
  );

  const openChatRoom = useCallback(
    (roomId: number) => {
      navigate(`/chat?room=${roomId}`);
    },
    [navigate],
  );

  const handleIncomingAlert = useCallback(
    (event: ChatWsNotification) => {
      if (event.sender_id === currentUserId) return;
      const viewingRoom = activeRoomIdRef.current === event.room_id;
      setRooms((prev) => {
        refreshRoomsIfMissing(event.room_id, prev);
        return patchRoomsCache(prev, event.room_id, (room) => ({
          ...room,
          last_message: {
            id: event.message_id,
            sender: event.sender_id,
            sender_nombre: event.sender_name,
            content: event.preview,
            message_type: event.message_type,
            is_deleted: false,
            created_at: event.created_at || room.updated_at,
          },
          unread_count: viewingRoom ? 0 : room.unread_count + 1,
          updated_at: event.created_at || room.updated_at,
        }));
      });
      if (viewingRoom) return;
      playNotificationPop();
      showIncomingChatToast(event, () => openChatRoom(event.room_id));
    },
    [currentUserId, openChatRoom, refreshRoomsIfMissing, setRooms],
  );

  const handleEvent = useCallback(
    (event: ChatWsIncoming) => {
      if (event.type === "error") {
        toast.error(event.detail);
      }

      if (event.type === "chat_notification") {
        handleIncomingAlert(event);
        if (event.sender_id !== currentUserId) {
          sendRef.current({
            type: "mark_as_delivered",
            room_id: event.room_id,
            message_ids: [event.message_id],
          });
        }
      }

      if (event.type === "chat_message") {
        const msg = event.message;
        const viewingRoom = msg.room === activeRoomIdRef.current;
        if (msg.sender && msg.sender !== currentUserId) {
          sendRef.current({
            type: "mark_as_delivered",
            room_id: msg.room,
            message_ids: [msg.id],
          });
        }
        setRooms((prev) =>
          patchRoomsCache(prev, msg.room, (room) => ({
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
              viewingRoom || msg.sender === currentUserId
                ? viewingRoom
                  ? 0
                  : room.unread_count
                : room.unread_count,
            updated_at: msg.created_at,
          })),
        );
      }

      if (event.type === "room_status_updated") {
        const readonly = event.is_readonly ?? event.is_read_only ?? false;
        setRooms((prev) =>
          patchRoomsCache(prev, event.room_id, (room) => ({
            ...room,
            is_readonly: readonly,
          })),
        );
        void queryClient.invalidateQueries({ queryKey: CHAT_ALLOWANCES_QUERY_KEY });
      }

      if (event.type === "group_updated") {
        const stillMember = event.room.members.some(
          (member) => member.user === currentUserId && member.is_active,
        );
        setRooms((prev) => {
          const existing = prev.find((room) => room.id === event.room_id);
          if (!stillMember) {
            const wasMember = existing?.members.some(
              (member) => member.user === currentUserId,
            );
            if (wasMember) {
              return prev.filter((room) => room.id !== event.room_id);
            }
            if (!existing) return prev;
            return patchRoomsCache(prev, event.room_id, (room) =>
              mergeGroupSnapshot(room, event.room, {
                currentUserId,
                canEditGroups,
              }),
            );
          }
          if (!existing) {
            refreshRoomsIfMissing(event.room_id, prev);
            return prev;
          }
          return patchRoomsCache(prev, event.room_id, (room) =>
            mergeGroupSnapshot(room, event.room, {
              currentUserId,
              canEditGroups,
            }),
          );
        });
      }

      listenersRef.current.forEach((listener) => listener(event));
    },
    [canEditGroups, currentUserId, handleIncomingAlert, queryClient, refreshRoomsIfMissing, setRooms],
  );

  const { joinRoom, sendTyping, sendViaSocket } = useChatSocket({
    enabled: isAuthenticated && Boolean(user),
    onEvent: handleEvent,
  });

  sendRef.current = sendViaSocket;

  const setActiveRoomId = useCallback((roomId: number | null) => {
    activeRoomIdRef.current = roomId;
  }, []);

  const subscribe = useCallback((listener: (event: ChatWsIncoming) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo<ChatRealtimeValue>(
    () => ({
      joinRoom,
      sendTyping,
      sendViaSocket,
      setActiveRoomId,
      subscribe,
      unreadTotal,
      openChatRoom,
    }),
    [
      joinRoom,
      sendTyping,
      sendViaSocket,
      setActiveRoomId,
      subscribe,
      unreadTotal,
      openChatRoom,
    ],
  );

  return (
    <ChatRealtimeContext.Provider value={value}>
      {children}
    </ChatRealtimeContext.Provider>
  );
};
