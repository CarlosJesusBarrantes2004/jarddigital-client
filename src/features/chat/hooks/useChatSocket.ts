import { useCallback, useEffect, useRef } from "react";
import { buildChatWsUrl } from "../lib/chat.utils";
import type { ChatWsIncoming } from "../types/chat.types";

interface UseChatSocketOptions {
  enabled?: boolean;
  onEvent: (event: ChatWsIncoming) => void;
}

export function useChatSocket({ enabled = true, onEvent }: UseChatSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const retriesRef = useRef(0);
  const joinedRooms = useRef<Set<number>>(new Set());

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const joinRoom = useCallback(
    (roomId: number) => {
      joinedRooms.current.add(roomId);
      send({ type: "join_room", room_id: roomId });
    },
    [send],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let reconnectTimer: number | undefined;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(buildChatWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
        joinedRooms.current.forEach((roomId) => {
          ws.send(JSON.stringify({ type: "join_room", room_id: roomId }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as ChatWsIncoming;
          onEventRef.current(parsed);
        } catch {
          // payload no JSON
        }
      };

      ws.onclose = (ev) => {
        if (cancelled || ev.code === 4401 || ev.code === 4403) return;
        const delay = Math.min(1000 * 2 ** retriesRef.current, 10000);
        retriesRef.current += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled]);

  const sendTyping = useCallback(
    (roomId: number) => send({ type: "typing", room_id: roomId }),
    [send],
  );

  const sendViaSocket = useCallback(
    (payload: Record<string, unknown>) => send(payload),
    [send],
  );

  return { joinRoom, sendTyping, sendViaSocket };
}
