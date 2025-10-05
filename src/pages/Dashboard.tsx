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

const Dashboard = () => {
  const upcomingDeadlines = [
    {
      case: "Cobro de pesos - Pérez vs. XYZ",
      deadline: "Contestación",
      date: "28 Oct 2025",
      daysLeft: 2,
      priority: "high" as const,
    },
    {
      case: "Desalojo - Martínez vs. López",
      deadline: "Presentación pruebas",
      date: "05 Nov 2025",
      daysLeft: 10,
      priority: "medium" as const,
    },
    {
      case: "Laboral - García vs. Empresa ABC",
      deadline: "Alegatos finales",
      date: "12 Nov 2025",
      daysLeft: 17,
      priority: "low" as const,
    },
  ];

  const upcomingHearings = [
    {
      case: "Divorcio - Rodríguez",
      court: "Primera Instancia DN",
      date: "06 Oct 2025",
      time: "10:00 AM",
    },
    {
      case: "Comercial - Importaciones SA",
      court: "Suprema Corte",
      date: "08 Oct 2025",
      time: "02:00 PM",
    },
  ];

  const recentCases = [
    {
      id: "cas_01",
      title: "Cobro de pesos",
      client: "Juan Pérez",
      status: "demanda" as const,
      matter: "Civil",
      lastUpdate: "Hace 2 horas",
    },
    {
      id: "cas_02",
      title: "Desalojo",
      client: "Ana Martínez",
      status: "pruebas" as const,
      matter: "Civil",
      lastUpdate: "Hace 1 día",
    },
    {
      id: "cas_03",
      title: "Despido injustificado",
      client: "Carlos García",
      status: "contestacion" as const,
      matter: "Laboral",
      lastUpdate: "Hace 3 días",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenida, María. Resumen de tu práctica.
          </p>
        </div>
        <Button className="gap-2">
          <Briefcase className="h-4 w-4" />
          Nuevo caso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Casos activos"
          value="24"
          icon={Briefcase}
          trend={{ value: "+3 este mes", isPositive: true }}
        />
        <StatsCard
          title="Vencimientos próximos"
          value="3"
          icon={AlertTriangle}
          description="En los próximos 7 días"
          variant="warning"
        />
        <StatsCard
          title="Audiencias esta semana"
          value="2"
          icon={Calendar}
          variant="info"
        />
        <StatsCard
          title="Documentos generados"
          value="48"
          icon={TrendingUp}
          trend={{ value: "+12 vs. mes anterior", isPositive: true }}
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
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.case}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.deadline}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.daysLeft} días
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-info" />
              Audiencias esta semana
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              Ver calendario
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingHearings.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.case}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.court}
                    </p>
                    <p className="text-xs font-medium text-primary mt-1">
                      {item.date} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Casos recientes
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1">
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentCases.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-base cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <CaseStatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cliente: {item.client} • {item.matter}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {item.lastUpdate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
