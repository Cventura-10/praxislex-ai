import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocumentCitations } from "@/lib/rag";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentCitationsProps {
  documentId: string;
}

export const DocumentCitations = ({ documentId }: DocumentCitationsProps) => {
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCitations();
  }, [documentId]);

  const loadCitations = async () => {
    setLoading(true);
    const { data } = await getDocumentCitations(documentId);
    if (data) {
      setCitations(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Citaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (citations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Citaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay citaciones en este documento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Citaciones ({citations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {citations.map((citation, index) => (
              <div
                key={citation.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      {citation.jurisprudence?.materia && (
                        <Badge variant="secondary" className="text-xs">
                          {citation.jurisprudence.materia}
                        </Badge>
                      )}
                      {citation.similarity_score && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500">
                          {(citation.similarity_score * 100).toFixed(0)}% relevante
                        </Badge>
                      )}
                    </div>
                    
                    {citation.jurisprudence && (
                      <h5 className="font-medium text-sm">
                        {citation.jurisprudence.titulo}
                      </h5>
                    )}
                  </div>
                </div>

                {citation.cited_text && (
                  <blockquote className="border-l-4 border-primary pl-3 text-sm italic text-muted-foreground">
                    "{citation.cited_text}"
                  </blockquote>
                )}

                {citation.jurisprudence && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      {citation.jurisprudence.tribunal && (
                        <span>{citation.jurisprudence.tribunal}</span>
                      )}
                      {citation.jurisprudence.numero_sentencia && (
                        <span>• No. {citation.jurisprudence.numero_sentencia}</span>
                      )}
                      {citation.jurisprudence.fecha_sentencia && (
                        <span>• {new Date(citation.jurisprudence.fecha_sentencia).toLocaleDateString('es-DO')}</span>
                      )}
                    </div>
                  </div>
                )}

                {citation.jurisprudence?.url_fuente && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    asChild
                  >
                    <a 
                      href={citation.jurisprudence.url_fuente} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver fuente completa
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
