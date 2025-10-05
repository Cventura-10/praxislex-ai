import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, BookOpen, Calendar, Scale } from "lucide-react";

const Jurisprudence = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const jurisprudence = [
    {
      id: "jur_01",
      numero: "SCJ-3ra-2020-123",
      organo: "Suprema Corte de Justicia",
      sala: "Tercera Sala",
      fecha: "12 Mar 2020",
      titulo: "Responsabilidad contractual por incumplimiento",
      sumario:
        "Se reitera criterio sobre la necesidad de demostrar el daño real y directo en casos de incumplimiento contractual...",
      materia: "Civil",
      url: "https://poderjudicial.gob.do/consulta-sentencias/...",
    },
    {
      id: "jur_02",
      numero: "SCJ-1ra-2019-045",
      organo: "Suprema Corte de Justicia",
      sala: "Primera Sala",
      fecha: "22 May 2019",
      titulo: "Desahucio en arrendamiento comercial",
      sumario:
        "Criterio establecido sobre plazos de desahucio en contratos comerciales y requisitos de notificación...",
      materia: "Civil",
      url: "https://poderjudicial.gob.do/consulta-sentencias/...",
    },
    {
      id: "jur_03",
      numero: "TL-DN-2021-089",
      organo: "Tribunal Laboral DN",
      sala: "Sala Principal",
      fecha: "15 Sep 2021",
      titulo: "Despido injustificado - Prueba de causa justa",
      sumario:
        "Establece que la carga de la prueba en casos de despido corresponde al empleador demostrar la causa justa...",
      materia: "Laboral",
      url: "https://poderjudicial.gob.do/consulta-sentencias/...",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jurisprudencia</h1>
          <p className="text-muted-foreground mt-1">
            Base de datos de sentencias y criterios judiciales
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Portal Poder Judicial
        </Button>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Búsqueda de jurisprudencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por palabras clave, número o tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Órgano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los órganos</SelectItem>
                <SelectItem value="scj">Suprema Corte</SelectItem>
                <SelectItem value="tribunal">Tribunales</SelectItem>
                <SelectItem value="primera">Primera Instancia</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="laboral">Laboral</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="penal">Penal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {jurisprudence.map((item) => (
          <Card
            key={item.id}
            className="shadow-medium hover:shadow-strong transition-base"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{item.titulo}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="font-mono">{item.numero}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.fecha}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{item.materia}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.organo} - {item.sala}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.sumario}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" className="gap-2">
                  <BookOpen className="h-3 w-3" />
                  Leer sentencia completa
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3 w-3" />
                  Ver en portal oficial
                </Button>
                <Button variant="ghost" size="sm">
                  Citar en documento
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center">
        <Button variant="outline">Cargar más resultados</Button>
      </div>
    </div>
  );
};

export default Jurisprudence;
