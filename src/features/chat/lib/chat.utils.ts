import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  ChatLastMessage,
  ChatMessage,
  ChatMessageType,
} from "../types/chat.types";

export function buildChatWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const base = apiUrl
    ? new URL(apiUrl, window.location.origin)
    : new URL(window.location.origin);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${base.host}/ws/chat/`;
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

export function playNotificationPop(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1240, now + 0.07);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // Autplay policies: silencio si el navegador bloquea audio.
  }
}
