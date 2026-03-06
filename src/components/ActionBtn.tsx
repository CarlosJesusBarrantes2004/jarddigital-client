import { cn } from "@/lib/utils";

export function ActionBtn({
  onClick,
  title,
  variant = "default",
  children,
}: {
  onClick: () => void;
  title?: string;
  variant?: "default" | "primary" | "warning";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold font-sans transition-all duration-200 tracking-wider uppercase",
        variant === "default" &&
          "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "primary" &&
          "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20",
        variant === "warning" &&
          "bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20",
      )}
    >
      {children}
    </button>
  );
}
