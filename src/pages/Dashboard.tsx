import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  Briefcase,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCases: 0,
    upcomingDeadlines: 0,
    upcomingHearings: 0,
    generatedDocuments: 0,
  });
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      // Fetch cases
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*, clients(nombre_completo)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (casesError) throw casesError;

      // Fetch deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .eq("completado", false)
        .order("fecha_vencimiento", { ascending: true })
        .limit(3);

      if (deadlinesError) throw deadlinesError;

      // Fetch hearings
      const { data: hearingsData, error: hearingsError } = await supabase
        .from("hearings")
        .select("*")
        .eq("user_id", user.id)
        .gte("fecha", new Date().toISOString().split('T')[0])
        .order("fecha", { ascending: true })
        .limit(3);

      if (hearingsError) throw hearingsError;

      // Fetch documents count
      const { count: docsCount } = await supabase
        .from("legal_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        activeCases: casesData?.length || 0,
        upcomingDeadlines: deadlinesData?.length || 0,
        upcomingHearings: hearingsData?.length || 0,
        generatedDocuments: docsCount || 0,
      });

      setDeadlines(deadlinesData || []);
      setHearings(hearingsData || []);
      setRecentCases(casesData || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/casos`);
  };

  const handleNewCase = () => {
    navigate("/casos");
  };

  const getDaysLeft = (date: string) => {
    const today = new Date();
    const deadline = new Date(date);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriority = (daysLeft: number): "high" | "medium" | "low" => {
    if (daysLeft <= 3) return "high";
    if (daysLeft <= 7) return "medium";
    return "low";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {userName ? `Bienvenido/a, ${userName}. ` : "Bienvenido/a. "}
            Resumen de tu práctica.
          </p>
        </div>
        <Button className="gap-2" onClick={handleNewCase}>
          <Briefcase className="h-4 w-4" />
          Nuevo caso
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Casos activos"
              value={stats.activeCases}
              icon={Briefcase}
            />
            <StatsCard
              title="Vencimientos próximos"
              value={stats.upcomingDeadlines}
              icon={AlertTriangle}
              description="Pendientes"
              variant="warning"
            />
            <StatsCard
              title="Audiencias programadas"
              value={stats.upcomingHearings}
              icon={Calendar}
              variant="info"
            />
            <StatsCard
              title="Documentos generados"
              value={stats.generatedDocuments}
              icon={TrendingUp}
              variant="success"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Vencimientos próximos
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/audiencias")}>
                  Ver todos
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {deadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay vencimientos próximos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deadlines.map((item) => {
                      const daysLeft = getDaysLeft(item.fecha_vencimiento);
                      const priority = getPriority(daysLeft);
                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.caso}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.tipo}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={
                                priority === "high"
                                  ? "destructive"
                                  : priority === "medium"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {daysLeft} días
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.fecha_vencimiento).toLocaleDateString('es-DO')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-info" />
                  Audiencias próximas
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/audiencias")}>
                  Ver calendario
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {hearings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay audiencias programadas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {hearings.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.caso}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.juzgado}
                          </p>
                          <p className="text-xs font-medium text-primary mt-1">
                            {new Date(item.fecha).toLocaleDateString('es-DO')} • {item.hora}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Casos recientes
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/casos")}>
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentCases.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No hay casos creados aún
                  </p>
                  <Button onClick={handleNewCase} size="sm">
                    Crear primer caso
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCases.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base cursor-pointer"
                      onClick={() => handleViewCase(item.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{item.titulo}</p>
                            <CaseStatusBadge status={item.estado} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Cliente: {item.clients?.nombre_completo || "Sin cliente"} • {item.materia}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('es-DO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;