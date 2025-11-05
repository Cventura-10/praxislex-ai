import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDocLearningRuns, useDocLearningVariables, useDocLearningClauses, useUpdateVariable } from "@/hooks/useDocLearning";
import { Variable, FileText, Edit, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function VariablesClausulasTab() {
  const { data: runs } = useDocLearningRuns();
  const latestRun = runs?.find(r => r.status === 'completed');
  const { data: variables } = useDocLearningVariables(latestRun?.id);
  const { data: clauses } = useDocLearningClauses(latestRun?.id);
  const updateMutation = useUpdateVariable();
  
  const [searchVar, setSearchVar] = useState("");
  const [searchClause, setSearchClause] = useState("");
  const [editingVar, setEditingVar] = useState<string | null>(null);

  if (!latestRun) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Datos</CardTitle>
          <CardDescription>
            Ejecuta un análisis primero para ver variables y cláusulas detectadas
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredVars = variables?.filter(v =>
    v.name.toLowerCase().includes(searchVar.toLowerCase())
  );

  const filteredClauses = clauses?.filter(c =>
    c.title.toLowerCase().includes(searchClause.toLowerCase()) ||
    c.body.toLowerCase().includes(searchClause.toLowerCase())
  );

  const handleUpdateVariable = async (id: string, updates: any) => {
    await updateMutation.mutateAsync({ id, updates });
    setEditingVar(null);
  };

  return (
    <Tabs defaultValue="variables" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="variables">
          <Variable className="mr-2 h-4 w-4" />
          Variables ({variables?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="clausulas">
          <FileText className="mr-2 h-4 w-4" />
          Cláusulas ({clauses?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="variables" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Variables Detectadas</CardTitle>
            <CardDescription>
              Variables identificadas en los documentos. Puedes editar nombres y marcar como requeridas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar variables..."
              value={searchVar}
              onChange={(e) => setSearchVar(e.target.value)}
            />

            <div className="space-y-2">
              {filteredVars?.map((variable) => (
                <div
                  key={variable.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {`{{${variable.name}}}`}
                      </code>
                      <Badge variant={variable.confidence > 90 ? 'default' : 'secondary'}>
                        {variable.confidence.toFixed(0)}% confianza
                      </Badge>
                      {variable.required && (
                        <Badge variant="destructive">Requerida</Badge>
                      )}
                    </div>
                    
                    {variable.pattern && (
                      <p className="text-sm text-muted-foreground">
                        Patrón: <code className="text-xs">{variable.pattern}</code>
                      </p>
                    )}
                    
                    {variable.examples && variable.examples.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {variable.examples.slice(0, 3).map((ex: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Variable</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            defaultValue={variable.name}
                            onBlur={(e) => {
                              if (e.target.value !== variable.name) {
                                handleUpdateVariable(variable.id, { name: e.target.value });
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`required-${variable.id}`}
                            checked={variable.required}
                            onCheckedChange={(checked) =>
                              handleUpdateVariable(variable.id, { required: checked })
                            }
                          />
                          <Label htmlFor={`required-${variable.id}`}>Campo requerido</Label>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clausulas" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Cláusulas Detectadas</CardTitle>
            <CardDescription>
              Cláusulas frecuentes encontradas en tus documentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar cláusulas..."
              value={searchClause}
              onChange={(e) => setSearchClause(e.target.value)}
            />

            <div className="space-y-2">
              {filteredClauses?.map((clause) => (
                <Dialog key={clause.id}>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{clause.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {clause.frequency}x
                          </Badge>
                          <Badge variant={clause.confidence > 90 ? 'default' : 'secondary'}>
                            {clause.confidence.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {clause.body}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{clause.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Badge>Frecuencia: {clause.frequency}</Badge>
                        <Badge>Confianza: {clause.confidence.toFixed(1)}%</Badge>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{clause.body}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
