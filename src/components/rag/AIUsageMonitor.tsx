import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, Activity } from "lucide-react";
import { getMonthlyAIUsage, type AIUsageSummary } from "@/lib/rag";
import { Skeleton } from "@/components/ui/skeleton";

export const AIUsageMonitor = () => {
  const [usage, setUsage] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    setLoading(true);
    const { data } = await getMonthlyAIUsage();
    if (data) {
      setUsage(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Uso de IA este mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  // Example quota limits (estos deben venir del plan del usuario)
  const quotaLimits = {
    free: { tokens: 100000, cost: 5 },
    pro: { tokens: 1000000, cost: 50 },
    admin: { tokens: 10000000, cost: 500 }
  };

  // Asumiendo plan "pro" por ahora
  const currentPlan = "pro";
  const limits = quotaLimits[currentPlan];
  
  const tokenPercentage = (usage.total_tokens / limits.tokens) * 100;
  const costPercentage = (usage.total_cost / limits.cost) * 100;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Uso de IA este mes
        </CardTitle>
        <CardDescription>
          Seguimiento de consumo de tokens y costos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tokens consumidos</span>
            </div>
            <Badge variant="outline">
              {usage.total_tokens.toLocaleString()} / {limits.tokens.toLocaleString()}
            </Badge>
          </div>
          <Progress 
            value={Math.min(tokenPercentage, 100)} 
            className={getProgressColor(tokenPercentage)}
          />
          <p className="text-xs text-muted-foreground">
            {tokenPercentage.toFixed(1)}% del límite mensual
          </p>
        </div>

        {/* Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Costo estimado</span>
            </div>
            <Badge variant="outline">
              ${usage.total_cost.toFixed(4)} / ${limits.cost}
            </Badge>
          </div>
          <Progress 
            value={Math.min(costPercentage, 100)} 
            className={getProgressColor(costPercentage)}
          />
          <p className="text-xs text-muted-foreground">
            {costPercentage.toFixed(1)}% del presupuesto mensual
          </p>
        </div>

        {/* Operations Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Operaciones por tipo</h4>
          <div className="space-y-2">
            {Object.entries(usage.by_operation || {}).map(([type, stats]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.count} ops
                  </Badge>
                  <span className="text-xs">
                    {stats.tokens.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning if over limit */}
        {(tokenPercentage >= 90 || costPercentage >= 90) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-500">
              ⚠️ Te estás acercando al límite mensual. Considera actualizar tu plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
