import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BranchCardProps {
  id: number;
  nombre: string;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const BranchCard = ({
  id,
  nombre,
  isSelected,
  isLoading,
  onClick,
}: BranchCardProps) => {
  return (
    <Card
      onClick={() => !isLoading && onClick()}
      className={`p-6 cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-primary/30 hover:bg-primary/2"
      } ${isLoading && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary mb-1">{nombre}</h3>
          <p className="text-sm text-muted-foreground">
            Haz clic para ingresar
          </p>
        </div>

        {isSelected && (
          <div className="ml-4">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-6 h-6 text-primary" />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
