import { api } from "@/api/axios";
import type {
  ChatMessage,
  ChatPermissionFlags,
  ChatPermissionsState,
  ChatRoom,
  CreateRoomPayload,
  PaginatedMessages,
  SendMessagePayload,
} from "../types/chat.types";

function extraerError(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { detail?: unknown; [k: string]: unknown } };
  };
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(String).join(" ");
  const data = err.response?.data;
  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first)) return String(first[0]);
  }
  return fallback;
}

export const chatApi = {
  extraerError,

  getRooms: async (): Promise<ChatRoom[]> => {
    const { data } = await api.get<ChatRoom[]>("/chat/rooms/");
    return data;
  },

  createRoom: async (payload: CreateRoomPayload): Promise<ChatRoom> => {
    const { data } = await api.post<ChatRoom>("/chat/rooms/", payload);
    return data;
  },

  getRoom: async (id: number): Promise<ChatRoom> => {
    const { data } = await api.get<ChatRoom>(`/chat/rooms/${id}/`);
    return data;
  },

  getMessages: async (
    roomId: number,
    page = 1,
  ): Promise<PaginatedMessages> => {
    const { data } = await api.get<PaginatedMessages>(
      `/chat/rooms/${roomId}/messages/`,
      { params: { page, page_size: 50 } },
    );
    return data;
  },

  sendMessage: async (
    roomId: number,
    payload: SendMessagePayload,
  ): Promise<ChatMessage> => {
    const { data } = await api.post<ChatMessage>(
      `/chat/rooms/${roomId}/messages/`,
      payload,
    );
    return data;
  },

  markRead: async (roomId: number, messageIds?: number[]): Promise<void> => {
    await api.post(`/chat/rooms/${roomId}/read/`, {
      message_ids: messageIds ?? null,
    });
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/chat/messages/${messageId}/`);
  },

  getPermissions: async (
    currentUserId?: number,
  ): Promise<ChatPermissionsState> => {
    const { data } = await api.get<ChatPermissionFlags | ChatPermissionFlags[]>(
      "/chat/permissions/",
    );
    if (Array.isArray(data)) {
      const own =
        data.find((row) => row.user_id === currentUserId) ?? data[0] ?? {
          user_id: currentUserId ?? 0,
          username: "",
          nombre_completo: "",
          rol: null,
          is_dueno_bypass: false,
          can_create_groups: false,
          can_delete_messages: false,
          can_audit_all_chats: false,
          can_allow_direct_messages: false,
        };
      return { own, matrix: data };
    }
    return { own: data, matrix: null };
  },

  updatePermission: async (
    userId: number,
    flags: Partial<
      Pick<
        ChatPermissionFlags,
        | "can_create_groups"
        | "can_delete_messages"
        | "can_audit_all_chats"
        | "can_allow_direct_messages"
      >
    >,
  ): Promise<ChatPermissionFlags> => {
    const { data } = await api.put<ChatPermissionFlags>("/chat/permissions/", {
      user_id: userId,
      ...flags,
    });
    return data;
  },
};
