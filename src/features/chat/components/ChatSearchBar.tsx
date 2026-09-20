/**
 * Barra de búsqueda interna de mensajes.
 * Se monta en el header de ConversationPanel cuando el usuario activa la lupa.
 * Emite:
 *  - onSearch(query): cada vez que el texto cambia (debounced 300ms)
 *  - onNavigate("prev" | "next"): cuando el usuario navega entre coincidencias
 *  - onClose(): cuando cierra la barra
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

interface ChatSearchBarProps {
  matchCount: number;
  currentMatch: number; // 1-indexed, 0 si no hay matches
  onSearch: (query: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onClose: () => void;
}

export const ChatSearchBar = ({
  matchCount,
  currentMatch,
  onSearch,
  onNavigate,
  onClose,
}: ChatSearchBarProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-focus al montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce de 300ms para no hacer peticiones en cada tecla
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setValue(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(val.trim());
      }, 300);
    },
    [onSearch],
  );

  // Cerrar con Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onNavigate("prev");
      } else {
        onNavigate("next");
      }
    }
  };

  const hasResults = matchCount > 0;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border animate-in slide-in-from-top-2 duration-200">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Buscar en esta conversación…"
        className="flex-1 text-sm bg-muted/60 border border-border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-sky-400/40"
      />

      {/* Contador de coincidencias */}
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 min-w-[56px] text-right">
        {value.trim() === ""
          ? ""
          : hasResults
            ? `${currentMatch} / ${matchCount}`
            : "Sin resultados"}
      </span>

      {/* Botón anterior */}
      <button
        type="button"
        onClick={() => onNavigate("prev")}
        disabled={!hasResults}
        className="size-7 rounded-full hover:bg-muted disabled:opacity-40 flex items-center justify-center text-muted-foreground"
        aria-label="Resultado anterior"
        title="Anterior (Shift+Enter)"
      >
        <ArrowUp size={14} />
      </button>

      {/* Botón siguiente */}
      <button
        type="button"
        onClick={() => onNavigate("next")}
        disabled={!hasResults}
        className="size-7 rounded-full hover:bg-muted disabled:opacity-40 flex items-center justify-center text-muted-foreground"
        aria-label="Resultado siguiente"
        title="Siguiente (Enter)"
      >
        <ArrowDown size={14} />
      </button>

      {/* Cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="size-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Cerrar búsqueda"
      >
        <X size={14} />
      </button>
    </div>
  );
};
