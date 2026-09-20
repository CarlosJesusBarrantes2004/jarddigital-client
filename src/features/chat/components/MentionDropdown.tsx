/**
 * Dropdown de menciones estilo WhatsApp.
 * Se activa cuando el usuario escribe @ en el textarea del chat.
 * Filtra los miembros de la sala reactivamente conforme el usuario escribe.
 */
import { useEffect, useRef } from "react";
import type { ChatMember } from "../types/chat.types";

interface MentionDropdownProps {
  members: ChatMember[];
  query: string; // texto después del @ (puede ser vacío para mostrar todos)
  onSelect: (member: ChatMember) => void;
  onClose: () => void;
}

export const MentionDropdown = ({
  members,
  query,
  onSelect,
  onClose,
}: MentionDropdownProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const q = query.toLowerCase();

  const filtered = members
    .filter(
      (m) =>
        m.is_active &&
        (q === "" ||
          m.nombre_completo.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q)),
    )
    .slice(0, 8);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-[calc(100%+4px)] left-0 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
      role="listbox"
      aria-label="Menciones de usuarios"
    >
      <div className="px-2.5 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide border-b border-border">
        Mencionar
      </div>
      {filtered.map((member) => {
        const initials = member.nombre_completo
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();

        return (
          <button
            key={member.user}
            type="button"
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              // mousedown para que no haga blur en el textarea
              e.preventDefault();
              onSelect(member);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/70 transition-colors"
          >
            {/* Avatar */}
            <div className="size-7 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {member.nombre_completo}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                @{member.username}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
