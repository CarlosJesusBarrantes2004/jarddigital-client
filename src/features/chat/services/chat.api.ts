import { api } from "@/api/axios";
import type {
  ChatMemberRole,
  ChatMessage,
  ChatPermissionFlagKey,
  ChatPermissionFlags,
  ChatPermissionsState,
  ChatRoom,
  CreateRoomPayload,
  PaginatedMessages,
  ChatDirectoryUser,
  ChatDirectAllowance,
  SendMessagePayload,
  UpdateRoomPayload,
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

const EMPTY_FLAGS = {
  can_create_groups: false,
  can_delete_messages: false,
  can_audit_all_chats: false,
  can_allow_direct_messages: false,
  can_edit_groups: false,
} as const;

export const CHAT_ROOMS_QUERY_KEY = ["chat", "rooms"] as const;
export const CHAT_ALLOWANCES_QUERY_KEY = ["chat", "allowances"] as const;

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

  updateRoom: async (
    roomId: number,
    payload: UpdateRoomPayload,
  ): Promise<ChatRoom> => {
    const { data } = await api.patch<ChatRoom>(`/chat/rooms/${roomId}/`, payload);
    return data;
  },

  addMembers: async (roomId: number, memberIds: number[]): Promise<ChatRoom> => {
    const { data } = await api.post<ChatRoom>(`/chat/rooms/${roomId}/members/`, {
      member_ids: memberIds,
    });
    return data;
  },

  removeMember: async (roomId: number, userId: number): Promise<ChatRoom> => {
    const { data } = await api.delete<ChatRoom>(
      `/chat/rooms/${roomId}/members/${userId}/`,
    );
    return data;
  },

  updateMemberRole: async (
    roomId: number,
    userId: number,
    role: ChatMemberRole,
  ): Promise<ChatRoom> => {
    const { data } = await api.patch<ChatRoom>(
      `/chat/rooms/${roomId}/members/${userId}/`,
      { role },
    );
    return data;
  },

  getPeople: async (): Promise<ChatDirectoryUser[]> => {
    const { data } = await api.get<ChatDirectoryUser[]>("/chat/people/");
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
          ...EMPTY_FLAGS,
        };
      return {
        own: { ...EMPTY_FLAGS, ...own },
        matrix: data.map((row) => ({ ...EMPTY_FLAGS, ...row })),
      };
    }
    return { own: { ...EMPTY_FLAGS, ...data }, matrix: null };
  },

  updatePermission: async (
    userId: number,
    flags: Partial<Pick<ChatPermissionFlags, ChatPermissionFlagKey>>,
  ): Promise<ChatPermissionFlags> => {
    const { data } = await api.put<ChatPermissionFlags>("/chat/permissions/", {
      user_id: userId,
      ...flags,
    });
    return data;
  },

  getAllowances: async (): Promise<ChatDirectAllowance[]> => {
    const { data } = await api.get<ChatDirectAllowance[]>(
      "/chat/direct-allowances/",
    );
    return data;
  },

  createAllowance: async (
    userAId: number,
    userBId: number,
  ): Promise<ChatDirectAllowance> => {
    const { data } = await api.post<ChatDirectAllowance>(
      "/chat/direct-allowances/",
      { user_a_id: userAId, user_b_id: userBId },
    );
    return data;
  },

  revokeAllowance: async (id: number): Promise<void> => {
    await api.delete(`/chat/direct-allowances/${id}/`);
  },

  unlockRoom: async (roomId: number): Promise<ChatRoom> => {
    const { data } = await api.post<ChatRoom>(`/chat/rooms/${roomId}/unlock/`);
    return data;
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    await api.delete(`/chat/rooms/${roomId}/`);
  },
};
