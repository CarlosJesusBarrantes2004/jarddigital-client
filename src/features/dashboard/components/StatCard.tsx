import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color?: string;
}

export const StatCard = ({
  title,
  value,
  sub,
  icon,
  color = "text-muted-foreground",
}: StatCardProps) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <p className={`text-xs mt-1 font-semibold ${color}`}>{sub}</p>
        </div>
        <div className="w-12 h-12 text-primary/20 bg-primary/5 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
};
