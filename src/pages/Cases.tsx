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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { Plus, Search, Filter, Download } from "lucide-react";

const Cases = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("all");
  const [filterEtapa, setFilterEtapa] = useState("all");

  const cases = [
    {
      id: "cas_01",
      numero: "2025-00123",
      titulo: "Cobro de pesos",
      cliente: "Juan Pérez",
      materia: "Civil",
      juzgado: "Primera Instancia DN",
      etapa: "demanda" as const,
      responsable: "María Arias",
      fecha: "05 Oct 2025",
    },
    {
      id: "cas_02",
      numero: "2025-00115",
      titulo: "Desalojo",
      cliente: "Ana Martínez",
      materia: "Civil",
      juzgado: "Juzgado de Paz DN",
      etapa: "pruebas" as const,
      responsable: "María Arias",
      fecha: "28 Sep 2025",
    },
    {
      id: "cas_03",
      numero: "2024-00892",
      titulo: "Despido injustificado",
      cliente: "Carlos García",
      materia: "Laboral",
      juzgado: "Tribunal Laboral DN",
      etapa: "contestacion" as const,
      responsable: "José Ramírez",
      fecha: "15 Ago 2025",
    },
    {
      id: "cas_04",
      numero: "2025-00045",
      titulo: "Divorcio",
      cliente: "Laura Rodríguez",
      materia: "Familia",
      juzgado: "Primera Instancia DN",
      etapa: "sentencia" as const,
      responsable: "María Arias",
      fecha: "10 Feb 2025",
    },
    {
      id: "cas_05",
      numero: "2024-00654",
      titulo: "Cobro de honorarios",
      cliente: "Bufete López & Asociados",
      materia: "Comercial",
      juzgado: "Cámara Civil y Comercial",
      etapa: "apelacion" as const,
      responsable: "José Ramírez",
      fecha: "03 Jun 2024",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Casos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos tus expedientes jurídicos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo caso
        </Button>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Filtros y búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger>
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="laboral">Laboral</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="familia">Familia</SelectItem>
                <SelectItem value="penal">Penal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa procesal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                <SelectItem value="demanda">Demanda</SelectItem>
                <SelectItem value="contestacion">Contestación</SelectItem>
                <SelectItem value="pruebas">Pruebas</SelectItem>
                <SelectItem value="sentencia">Sentencia</SelectItem>
                <SelectItem value="apelacion">Apelación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Más filtros
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Juzgado</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caso) => (
                <TableRow
                  key={caso.id}
                  className="cursor-pointer hover:bg-accent/5"
                >
                  <TableCell className="font-mono text-xs">
                    {caso.numero}
                  </TableCell>
                  <TableCell className="font-medium">{caso.titulo}</TableCell>
                  <TableCell>{caso.cliente}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                      {caso.materia}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{caso.juzgado}</TableCell>
                  <TableCell>
                    <CaseStatusBadge status={caso.etapa} />
                  </TableCell>
                  <TableCell className="text-sm">{caso.responsable}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {caso.fecha}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Mostrando 5 de 5 casos</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cases;
