export type ChatRoomType = "DIRECT" | "GROUP";

export type ChatMessageType = "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT" | "PDF";

export type ChatMemberRole = "ADMIN" | "MEMBER";

export type ChatDeliveryStatus = "sent" | "delivered" | "read";

export interface ChatDirectoryUser {
  id: number;
  username: string;
  nombre_completo: string;
  activo: boolean;
  rol: { codigo: string; nombre: string } | null;
}

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
  description?: string;
  image_url?: string | null;
  display_name: string;
  room_type: ChatRoomType;
  created_by: number | null;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_readonly: boolean;
  can_edit?: boolean;
  members: ChatMember[];
  last_message: ChatLastMessage | null;
  unread_count: number;
}

export interface ChatMessageReplySnippet {
  id: number;
  room: number;
  sender: number | null;
  sender_nombre: string | null;
  content: string | null;
  message_type: ChatMessageType;
  is_deleted: boolean;
}

export interface ChatMessage {
  id: number;
  room: number;
  sender: number | null;
  sender_nombre: string | null;
  content: string | null;
  caption: string | null;
  message_type: ChatMessageType;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  is_forwarded: boolean;
  mentioned_user_ids: number[];
  created_at: string;
  delivery_status: ChatDeliveryStatus;
  is_read: boolean;
  reply_to?: ChatMessageReplySnippet | null;
}

export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export type ChatPermissionFlagKey =
  | "can_create_groups"
  | "can_delete_messages"
  | "can_audit_all_chats"
  | "can_allow_direct_messages"
  | "can_edit_groups"
  | "can_delete_rooms";

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
  can_edit_groups: boolean;
  can_delete_rooms: boolean;
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

export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  image_url?: string | null;
}

export type GroupUpdatedAction =
  | "updated"
  | "members_added"
  | "member_removed"
  | "role_changed";

export interface GroupUpdatedSnapshot {
  id: number;
  name: string;
  display_name: string;
  description: string;
  image_url: string | null;
  room_type: ChatRoomType;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_active?: boolean;
  members: ChatMember[];
}

export interface ChatGroupUpdated {
  type: "group_updated";
  action: GroupUpdatedAction;
  room_id: number;
  actor_id: number | null;
  room: GroupUpdatedSnapshot;
}

export interface SendMessagePayload {
  content?: string;
  caption?: string;
  message_type: ChatMessageType;
  file_url?: string | null;
  file_name?: string;
  is_forwarded?: boolean;
  mentioned_user_ids?: number[];
  reply_to_id?: number | null;
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

export interface ChatDirectAllowance {
  id: number;
  user_a: number;
  user_a_nombre: string;
  user_b: number;
  user_b_nombre: string;
  created_by: number | null;
  created_by_nombre: string | null;
  authorized_by: number | null;
  authorized_by_nombre: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ChatRoomStatusUpdated {
  type: "room_status_updated";
  room_id: number;
  is_readonly: boolean;
  is_read_only?: boolean;
}

export interface ChatReceiptUpdate {
  id: number;
  delivery_status: ChatDeliveryStatus;
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
      type: "chat_message_delivered";
      room_id: number;
      user_id: number;
      message_ids: number[];
      delivered_at?: string | null;
      receipts?: ChatReceiptUpdate[];
    }
  | {
      type: "chat_message_read";
      room_id: number;
      user_id: number;
      read_by?: number;
      message_ids: number[];
      read_at?: string | null;
      receipts?: ChatReceiptUpdate[];
    }
  | {
      type: "chat_typing";
      room_id: number;
      user_id: number;
      user_name: string;
    }
  | ChatGroupUpdated
  | ChatRoomStatusUpdated
  | { type: "room_deleted"; room_id: number; deleted_by?: number | null }
  | { type: "error"; detail: string };
