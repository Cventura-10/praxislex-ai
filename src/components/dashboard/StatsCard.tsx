import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "info";
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
  tooltip,
}: StatsCardProps & { 
  onClick?: () => void; 
  tooltip?: string;
}) {
  const variantStyles = {
    default: "text-primary",
    warning: "text-warning",
    success: "text-success",
    info: "text-info",
  };

  return (
    <Card 
      className={cn(
        "shadow-medium hover:shadow-strong transition-base",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
      title={tooltip}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-5 w-5", variantStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-serif">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs mt-2 font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
