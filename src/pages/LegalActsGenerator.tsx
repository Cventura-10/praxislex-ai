import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Scale, Sparkles, Edit3, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LEGAL_CATEGORIES, searchLegalActs, type LegalAct, type LegalMatter } from "@/lib/legalActsData";
import * as LucideIcons from "lucide-react";

export default function LegalActsGenerator() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAct, setSelectedAct] = useState<LegalAct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedMatters, setExpandedMatters] = useState<string[]>([]);

  // Filtrado de actos por búsqueda
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchLegalActs(searchQuery);
  }, [searchQuery]);

  const handleActClick = (act: LegalAct) => {
    setSelectedAct(act);
    setIsDialogOpen(true);
  };

  const handleIntakeMode = () => {
    setIsDialogOpen(false);
    navigate(`/redaccion-ia-new?acto=${selectedAct?.id}&mode=intake`);
  };

  const handleManualMode = () => {
    setIsDialogOpen(false);
    navigate(`/redaccion-ia-new?acto=${selectedAct?.id}&mode=manual`);
  };

  const toggleMatter = (matterId: string) => {
    setExpandedMatters(prev =>
      prev.includes(matterId)
        ? prev.filter(id => id !== matterId)
        : [...prev, matterId]
    );
  };

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = (LucideIcons as any)[name] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header Profesional */}
      <div className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Tipos de Actos Jurídicos
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Sistema de Redacción Legal • República Dominicana
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Search Bar */}
        <Card className="mb-6 border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar acto jurídico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 border-border/50 focus:border-primary/50"
              />
            </div>

            {/* Search Results */}
            {filteredResults && filteredResults.length > 0 && (
              <ScrollArea className="mt-3 h-56 rounded-md border border-border/50 bg-muted/20">
                <div className="p-2 space-y-1">
                  {filteredResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleActClick(result.act);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/60 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {result.act.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {result.category} • {result.matter}
                        </p>
                      </div>
                      <Badge 
                        variant={result.act.type === 'judicial' ? 'default' : 'secondary'} 
                        className="ml-2 text-xs shrink-0"
                      >
                        {result.act.type === 'judicial' ? 'Judicial' : 'Extrajudicial'}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
            {filteredResults && filteredResults.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-3">
                No se encontraron resultados
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="judicial" className="space-y-5">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-11 p-1 bg-muted/50">
            <TabsTrigger value="judicial" className="gap-2 text-sm font-medium">
              <Scale className="h-4 w-4" />
              Actos Judiciales
            </TabsTrigger>
            <TabsTrigger value="extrajudicial" className="gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Actos Extrajudiciales
            </TabsTrigger>
          </TabsList>

          {LEGAL_CATEGORIES.map((category) => (
            <TabsContent 
              key={category.id} 
              value={category.id}
              className="space-y-4 animate-in fade-in-50"
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${
                      category.type === 'judicial' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-secondary/10 text-secondary-foreground'
                    }`}>
                      {category.type === 'judicial' ? (
                        <Scale className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Organizado por materia • {category.matters.reduce((acc, m) => acc + m.acts.length, 0)} actos disponibles
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {category.matters.map((matter) => (
                    <MatterSection
                      key={matter.id}
                      matter={matter}
                      onActClick={handleActClick}
                      IconComponent={IconComponent}
                      isExpanded={expandedMatters.includes(matter.id)}
                      onToggle={() => toggleMatter(matter.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialog para seleccionar modo de redacción */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedAct?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Selecciona el modo de redacción para este acto procesal
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {selectedAct?.hasIntake && (
              <button
                onClick={handleIntakeMode}
                className="group relative overflow-hidden rounded-lg border-2 border-primary/20 p-6 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Redacción Asistida</h3>
                    <p className="text-sm text-muted-foreground">
                      Completa un formulario guiado con los datos necesarios y genera el documento automáticamente
                    </p>
                    <Badge className="mt-3" variant="secondary">Recomendado</Badge>
                  </div>
                </div>
              </button>
            )}

            {selectedAct?.hasManual && (
              <button
                onClick={handleManualMode}
                className="group relative overflow-hidden rounded-lg border-2 border-muted p-6 text-left hover:border-primary/40 hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Redacción Manual</h3>
                    <p className="text-sm text-muted-foreground">
                      Edita libremente una plantilla pre-cargada con notas sobre requisitos legales
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para cada materia (minimalista)
function MatterSection({ 
  matter, 
  onActClick,
  IconComponent,
  isExpanded,
  onToggle
}: { 
  matter: LegalMatter; 
  onActClick: (act: LegalAct) => void;
  IconComponent: React.ComponentType<{ name: string }>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
      {/* Header de Materia */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <IconComponent name={matter.icon} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{matter.name}</p>
            <p className="text-xs text-muted-foreground">
              {matter.acts.length} {matter.acts.length === 1 ? 'acto' : 'actos'}
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Lista de Actos */}
      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/10">
          <div className="p-2 space-y-0.5">
            {matter.acts.map((act) => (
              <button
                key={act.id}
                onClick={() => onActClick(act)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-background transition-colors text-sm group flex items-center justify-between"
              >
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {act.name}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
