import { cn } from "@/lib/utils";
import { memo } from "react";

export const IconBtn = memo(function IconBtn({
  onClick,
  title,
  colorClass,
  bgClass,
  hoverClass,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  colorClass: string;
  bgClass: string;
  hoverClass: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200",
        colorClass,
        bgClass,
        disabled
          ? "opacity-40 cursor-not-allowed"
          : cn("cursor-pointer", hoverClass),
      )}
    >
      {children}
    </button>
  );
});
