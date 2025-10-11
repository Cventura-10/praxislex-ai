import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, FileText, Scale, Sparkles, Edit3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LEGAL_CATEGORIES, searchLegalActs, type LegalAct, type LegalMatter } from "@/lib/legalActsData";
import * as LucideIcons from "lucide-react";

export default function LegalActsGenerator() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAct, setSelectedAct] = useState<LegalAct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['judicial']);

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
    // Navegar a la página de redacción asistida
    navigate(`/redaccion-ia?acto=${selectedAct?.id}&mode=intake`);
  };

  const handleManualMode = () => {
    setIsDialogOpen(false);
    // Navegar a la página de redacción manual
    navigate(`/redaccion-ia?acto=${selectedAct?.id}&mode=manual`);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = (LucideIcons as any)[name] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Generador de Actos Procesales
            </h1>
            <p className="text-muted-foreground mt-1">
              Redacción asistida o manual de documentos jurídicos
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="shadow-lg border-primary/10">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar acto procesal o extrajudicial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base bg-background"
            />
          </div>

          {/* Search Results */}
          {filteredResults && filteredResults.length > 0 && (
            <ScrollArea className="mt-4 h-64 rounded-md border bg-muted/30">
              <div className="p-2 space-y-1">
                {filteredResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleActClick(result.act);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-background transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {result.act.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.category} • {result.matter}
                      </p>
                    </div>
                    <Badge variant={result.act.type === 'judicial' ? 'default' : 'secondary'} className="ml-2">
                      {result.act.type === 'judicial' ? 'JUDICIAL' : 'EXTRAJUDICIAL'}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
          {filteredResults && filteredResults.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              No se encontraron actos que coincidan con "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Navigation */}
      <div className="grid gap-6">
        {LEGAL_CATEGORIES.map((category) => (
          <Card key={category.id} className="overflow-hidden shadow-md">
            <Collapsible
              open={expandedCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        category.type === 'judicial' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary/10 text-secondary-foreground'
                      }`}>
                        {category.type === 'judicial' ? (
                          <Scale className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {category.matters.length} materias • {category.matters.reduce((acc, m) => acc + m.acts.length, 0)} actos disponibles
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                      expandedCategories.includes(category.id) ? 'rotate-90' : ''
                    }`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.matters.map((matter) => (
                      <MatterCard
                        key={matter.id}
                        matter={matter}
                        onActClick={handleActClick}
                        IconComponent={IconComponent}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
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

// Componente para cada materia
function MatterCard({ 
  matter, 
  onActClick,
  IconComponent 
}: { 
  matter: LegalMatter; 
  onActClick: (act: LegalAct) => void;
  IconComponent: React.ComponentType<{ name: string }>;
}) {
  return (
    <Card className="overflow-hidden border-muted hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-base flex items-center gap-2">
          <IconComponent name={matter.icon} />
          {matter.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-1">
          {matter.acts.map((act) => (
            <button
              key={act.id}
              onClick={() => onActClick(act)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm group flex items-center justify-between"
            >
              <span className="group-hover:text-primary transition-colors">
                {act.name}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
