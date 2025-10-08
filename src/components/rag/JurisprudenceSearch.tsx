import { useState } from "react";
import { Search, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { searchJurisprudenceRAG, formatCitation, type JurisprudenceResult } from "@/lib/rag";
import { MATERIAS_JURIDICAS } from "@/lib/constants";

interface JurisprudenceSearchProps {
  onSelect?: (result: JurisprudenceResult) => void;
  showInsertButton?: boolean;
}

export const JurisprudenceSearch = ({ onSelect, showInsertButton = false }: JurisprudenceSearchProps) => {
  const [query, setQuery] = useState("");
  const [materia, setMateria] = useState<string>("");
  const [results, setResults] = useState<JurisprudenceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa una consulta de búsqueda",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data, error } = await searchJurisprudenceRAG(query, {
      materia: materia || undefined,
      limit: 10,
      threshold: 0.65
    });

    if (error) {
      toast({
        title: "Error en búsqueda",
        description: "No se pudo realizar la búsqueda semántica",
        variant: "destructive"
      });
    } else if (data) {
      setResults(data);
      if (data.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron jurisprudencias relevantes",
        });
      }
    }
    setLoading(false);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (similarity >= 0.8) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (similarity >= 0.7) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Búsqueda Semántica de Jurisprudencia
        </CardTitle>
        <CardDescription>
          Búsqueda inteligente usando embeddings vectoriales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="flex gap-2">
          <Input
            placeholder="Ej: jurisprudencia sobre daños y perjuicios por incumplimiento contractual..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Select value={materia} onValueChange={setMateria}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las materias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {MATERIAS_JURIDICAS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {results.map((result) => (
                <Card key={result.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{result.titulo}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">{result.materia}</Badge>
                          {result.tribunal && (
                            <Badge variant="secondary" className="text-xs">
                              {result.tribunal}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={getSimilarityColor(result.similarity)}
                          >
                            {(result.similarity * 100).toFixed(1)}% similar
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {result.resumen && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {result.resumen}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <div className="font-mono bg-muted p-2 rounded">
                        {formatCitation(result)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {result.url_fuente && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={result.url_fuente} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver fuente
                          </a>
                        </Button>
                      )}
                      {showInsertButton && onSelect && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onSelect(result)}
                        >
                          Insertar citación
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
