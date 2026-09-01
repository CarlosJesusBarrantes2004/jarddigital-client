import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  ChatDeliveryStatus,
  ChatLastMessage,
  ChatMessage,
  ChatMessageType,
  ChatRoom,
  GroupUpdatedSnapshot,
} from "../types/chat.types";

export function buildChatWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const base = apiUrl
    ? new URL(apiUrl, window.location.origin)
    : new URL(window.location.origin);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${base.host}/ws/chat/`;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/).filter(Boolean)[0] || fullName;
}

export function mergeGroupSnapshot(
  prev: ChatRoom,
  snapshot: GroupUpdatedSnapshot,
  options: { currentUserId: number; canEditGroups: boolean },
): ChatRoom {
  const members = snapshot.members ?? prev.members;
  const isAdmin = members.some(
    (member) =>
      member.user === options.currentUserId &&
      member.is_active &&
      member.role === "ADMIN",
  );
  return {
    ...prev,
    name: snapshot.name ?? prev.name,
    display_name: snapshot.display_name || snapshot.name || prev.display_name,
    description: snapshot.description ?? prev.description ?? "",
    image_url: snapshot.image_url,
    members,
    updated_at: snapshot.updated_at || prev.updated_at,
    can_edit:
      (snapshot.room_type || prev.room_type) === "GROUP" &&
      (options.canEditGroups || isAdmin),
  };
}

export function findDirectRoomWithUser(
  rooms: ChatRoom[],
  userId: number,
): ChatRoom | undefined {
  return rooms.find(
    (room) =>
      room.room_type === "DIRECT" &&
      room.members.some((member) => member.user === userId),
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function avatarTone(seed: string): string {
  const tones = [
    "bg-sky-600",
    "bg-teal-600",
    "bg-indigo-600",
    "bg-cyan-700",
    "bg-blue-700",
    "bg-emerald-700",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tones[Math.abs(hash) % tones.length];
}

export function formatChatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Ayer";
  return format(date, "dd/MM/yyyy", { locale: es });
}

export function formatMessageClock(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "HH:mm");
}

export function formatDaySeparator(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function isSameDay(a: string, b: string): boolean {
  return formatDaySeparator(a) === formatDaySeparator(b);
}

export function previewForMessage(
  message: Pick<ChatLastMessage | ChatMessage, "content" | "message_type" | "is_deleted"> & {
    file_name?: string | null;
  },
): string {
  if (message.is_deleted) return "Mensaje eliminado";
  switch (message.message_type) {
    case "IMAGE":
      return "📷 Foto";
    case "AUDIO":
      return "🎤 Audio";
    case "PDF":
      return `📄 ${message.file_name || "PDF"}`;
    case "DOCUMENT":
      return `📄 ${message.file_name || "Documento"}`;
    default:
      return message.content?.trim() || "";
  }
}

export function iconForType(type: ChatMessageType): string {
  if (type === "IMAGE") return "📷";
  if (type === "AUDIO") return "🎤";
  if (type === "PDF" || type === "DOCUMENT") return "📄";
  return "";
}

export function messageTypeFromFile(file: File): ChatMessageType {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("audio/")) return "AUDIO";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "PDF";
  }
  return "DOCUMENT";
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Desbloquea el AudioContext tras un gesto del usuario (política autoplay). */
export function unlockChatNotificationAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

export function bindChatNotificationAudioUnlock(): () => void {
  const unlock = () => unlockChatNotificationAudio();
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
}

export function playNotificationPop(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      if (ctx.state !== "running") return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.07);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(play).catch(() => undefined);
      return;
    }
    play();
  } catch {
    // Autplay policies: silencio si el navegador bloquea audio.
  }
}

export function previewFromNotification(event: {
  preview: string;
  message_type: ChatMessageType;
}): string {
  if (event.message_type === "TEXT") return event.preview?.trim() || "Nuevo mensaje";
  return previewForMessage({
    content: event.preview,
    message_type: event.message_type,
    is_deleted: false,
  }) || event.preview;
}

const STATUS_RANK: Record<ChatDeliveryStatus, number> = {
  sent: 0,
  delivered: 1,
  read: 2,
};

export function resolveDeliveryStatus(message: ChatMessage): ChatDeliveryStatus {
  if (message.delivery_status) return message.delivery_status;
  if (message.is_read) return "read";
  return "sent";
}

export function mergeDeliveryStatus(
  current: ChatDeliveryStatus,
  incoming: ChatDeliveryStatus,
): ChatDeliveryStatus {
  return STATUS_RANK[incoming] > STATUS_RANK[current] ? incoming : current;
}
