import { useContext } from "react";
import { ChatRealtimeContext } from "./ChatRealtimeContext";

export const useChatRealtime = () => {
  const context = useContext(ChatRealtimeContext);
  if (!context) {
    throw new Error("useChatRealtime debe usarse dentro de un <ChatRealtimeProvider>");
  }
  return context;
};

export const useChatUnreadTotal = () => {
  const context = useContext(ChatRealtimeContext);
  return context?.unreadTotal ?? 0;
};
