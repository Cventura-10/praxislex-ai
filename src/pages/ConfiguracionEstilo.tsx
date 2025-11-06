import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, BarChart3, Variable, Rocket, History } from "lucide-react";
import { CargarTab } from "@/components/doc-learning/CargarTab";
import { AnalisisTab } from "@/components/doc-learning/AnalisisTab";
import { VariablesClausulasTab } from "@/components/doc-learning/VariablesClausulasTab";
import { PerfilPublicacionTab } from "@/components/doc-learning/PerfilPublicacionTab";
import { HistorialTab } from "@/components/doc-learning/HistorialTab";
import { StyleConfigTour } from "@/components/doc-learning/StyleConfigTour";

export default function ConfiguracionEstilo() {
  const [currentTab, setCurrentTab] = useState("cargar");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Configuración de Estilo</h1>
        <p className="text-muted-foreground">
          Sube documentos legales para que el sistema aprenda tu estilo de redacción y formato
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="cargar" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Cargar</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sube hasta 15 documentos legales (PDF, DOCX, RTF...)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="analisis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Análisis</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Revisa las métricas y características detectadas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="variables" className="flex items-center gap-2">
                <Variable className="h-4 w-4" />
                <span className="hidden sm:inline">Variables</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edita variables y cláusulas identificadas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Publica el perfil de estilo para usarlo en documentos</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Consulta análisis y versiones anteriores</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="cargar" className="mt-6">
          <CargarTab />
        </TabsContent>

        <TabsContent value="analisis" className="mt-6">
          <AnalisisTab />
        </TabsContent>

        <TabsContent value="variables" className="mt-6">
          <VariablesClausulasTab />
        </TabsContent>

        <TabsContent value="perfil" className="mt-6">
          <PerfilPublicacionTab />
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <HistorialTab />
        </TabsContent>
      </Tabs>

      <StyleConfigTour onTabChange={setCurrentTab} currentTab={currentTab} />
    </div>
  );
}
