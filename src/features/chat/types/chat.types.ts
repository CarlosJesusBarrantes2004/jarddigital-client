export type ChatRoomType = "DIRECT" | "GROUP";

export type ChatMessageType = "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT" | "PDF";

export type ChatMemberRole = "ADMIN" | "MEMBER";

export type ChatFilter = "todos" | "grupos" | "privados" | "auditoria";

export interface ChatMember {
  user: number;
  nombre_completo: string;
  username: string;
  role: ChatMemberRole;
  joined_at: string;
  is_active: boolean;
}

export interface ChatLastMessage {
  id: number;
  sender: number | null;
  sender_nombre: string | null;
  content: string | null;
  message_type: ChatMessageType;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  display_name: string;
  room_type: ChatRoomType;
  created_by: number | null;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_readonly: boolean;
  members: ChatMember[];
  last_message: ChatLastMessage | null;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  room: number;
  sender: number | null;
  sender_nombre: string | null;
  content: string | null;
  message_type: ChatMessageType;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  is_read: boolean;
}

export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export interface ChatPermissionFlags {
  user_id: number;
  username: string;
  nombre_completo: string;
  rol: string | null;
  is_dueno_bypass: boolean;
  can_create_groups: boolean;
  can_delete_messages: boolean;
  can_audit_all_chats: boolean;
  can_allow_direct_messages: boolean;
}

export interface ChatPermissionsState {
  own: ChatPermissionFlags;
  matrix: ChatPermissionFlags[] | null;
}

export interface CreateRoomPayload {
  name?: string;
  room_type: ChatRoomType;
  member_ids: number[];
}

export interface SendMessagePayload {
  content?: string;
  message_type: ChatMessageType;
  file_url?: string | null;
  file_name?: string;
}

export interface ChatWsNotification {
  type: "chat_notification";
  room_id: number;
  room_name: string;
  room_type: ChatRoomType;
  message_id: number;
  sender_id: number;
  sender_name: string;
  preview: string;
  message_type: ChatMessageType;
  created_at: string | null;
}

export type ChatWsIncoming =
  | { type: "chat_message"; message: ChatMessage }
  | ChatWsNotification
  | {
      type: "chat_message_deleted";
      message_id: number;
      room_id: number;
      deleted_by?: number;
    }
  | {
      type: "chat_message_read";
      room_id: number;
      user_id: number;
      message_ids: number[];
    }
  | {
      type: "chat_typing";
      room_id: number;
      user_id: number;
      user_name: string;
    }
  | { type: "error"; detail: string };
