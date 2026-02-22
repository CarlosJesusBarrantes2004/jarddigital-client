import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalLoaderProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const GlobalLoader = ({
  message = "Cargando...",
  fullScreen = true,
  className,
}: GlobalLoaderProps) => {
  const containerClass = fullScreen
    ? "min-h-screen w-full fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
    : "w-full py-12 flex flex-col items-center justify-center";

  return (
    <div
      className={cn(
        containerClass,
        className,
        "animate-in fade-in duration-300",
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Anillo exterior animado */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-[spin_3s_linear_infinite]" />

        {/* Icono interior */}
        <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
      </div>

      {message && (
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
};
