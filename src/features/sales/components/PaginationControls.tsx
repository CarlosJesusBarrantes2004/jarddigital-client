import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  count: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  count,
  page,
  pageSize = 10,
  onPageChange,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs font-mono text-muted-foreground">
        Página {page} de {totalPages} —{" "}
        <span className="text-foreground/70">{count} resultados</span>
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            "h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors",
            page <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-muted text-foreground",
          )}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Números de página */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 text-center text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "h-8 w-8 rounded-lg border text-xs font-mono transition-colors",
                  page === p
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "border-border hover:bg-muted text-foreground",
                )}
              >
                {p}
              </button>
            ),
          )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            "h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors",
            page >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-muted text-foreground",
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
