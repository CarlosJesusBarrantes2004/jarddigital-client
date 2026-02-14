import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin } from "lucide-react";

interface BranchCardProps {
  nombre: string;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const BranchCard = ({
  nombre,
  isSelected,
  isLoading,
  onClick,
}: BranchCardProps) => {
  return (
    <Card
      onClick={!isLoading ? onClick : undefined}
      className={`p-6 cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-transparent hover:border-primary/30 hover:bg-primary/5"
      } ${isLoading && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
          >
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{nombre}</h3>
            <p className="text-xs text-slate-500 italic">
              Sede operativa autorizada
            </p>
          </div>
        </div>

        {isSelected && (
          <div className="ml-4">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
