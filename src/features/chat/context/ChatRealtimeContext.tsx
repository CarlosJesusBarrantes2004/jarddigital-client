import { createContext } from "react";
import type { ChatWsIncoming } from "../types/chat.types";

export interface ChatRealtimeValue {
  joinRoom: (roomId: number) => void;
  sendTyping: (roomId: number) => void;
  sendViaSocket: (payload: Record<string, unknown>) => boolean;
  setActiveRoomId: (roomId: number | null) => void;
  subscribe: (listener: (event: ChatWsIncoming) => void) => () => void;
  unreadTotal: number;
  openChatRoom: (roomId: number) => void;
}

export const ChatRealtimeContext = createContext<ChatRealtimeValue | null>(null);
