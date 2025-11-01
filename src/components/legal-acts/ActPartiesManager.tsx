import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Scale, Building2 } from "lucide-react";
import { ClientSelector } from "./ClientSelector";
import { NotarioSelector } from "./ProfessionalSelectors";
import { ContraparteManager, type ContraparteData } from "./ContraparteManager";
import { AbogadoContrarioManager, type AbogadoContrarioData } from "./AbogadoContrarioManager";

interface ActPartiesManagerProps {
  actType: 'judicial' | 'extrajudicial' | 'notarial';
  onPartiesChange: (parties: {
    actor?: string;
    demandado?: string;
    notario?: string;
    contrapartes: ContraparteData[];
    abogadosContrarios: AbogadoContrarioData[];
  }) => void;
}

export function ActPartiesManager({ actType, onPartiesChange }: ActPartiesManagerProps) {
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [selectedDemandado, setSelectedDemandado] = useState<string | null>(null);
  const [selectedNotario, setSelectedNotario] = useState<string | null>(null);
  const [contrapartes, setContrapartes] = useState<ContraparteData[]>([]);
  const [abogadosContrarios, setAbogadosContrarios] = useState<AbogadoContrarioData[]>([]);

  // Actualizar parent cuando cambie cualquier parte
  const updateParties = () => {
    onPartiesChange({
      actor: selectedActor || undefined,
      demandado: selectedDemandado || undefined,
      notario: selectedNotario || undefined,
      contrapartes,
      abogadosContrarios,
    });
  };

  const handleActorChange = (clientId: string | null) => {
    setSelectedActor(clientId);
    updateParties();
  };

  const handleDemandadoChange = (clientId: string | null) => {
    setSelectedDemandado(clientId);
    updateParties();
  };

  const handleNotarioChange = (notario: any) => {
    setSelectedNotario(notario?.id || null);
    updateParties();
  };

  const handleContrapartesChange = (newContrapartes: ContraparteData[]) => {
    setContrapartes(newContrapartes);
    updateParties();
  };

  const handleAbogadosChange = (newAbogados: AbogadoContrarioData[]) => {
    setAbogadosContrarios(newAbogados);
    updateParties();
  };

  if (actType === 'notarial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Partes del Acto Notarial
          </CardTitle>
          <CardDescription>
            Seleccione el notario actuante y las partes comparecientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notario */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notario Actuante *</label>
            <NotarioSelector
              value={selectedNotario}
              onChange={handleNotarioChange}
              onFieldUpdate={() => {}}
            />
          </div>

          {/* Comparecientes */}
          <div className="space-y-2">
            <ClientSelector
              label="Primera Parte (Compareciente)"
              fieldPrefix="primera_parte"
              value={selectedActor}
              onChange={handleActorChange}
              onFieldUpdate={() => {}}
            />
          </div>

          <div className="space-y-2">
            <ClientSelector
              label="Segunda Parte (si aplica)"
              fieldPrefix="segunda_parte"
              value={selectedDemandado}
              onChange={handleDemandadoChange}
              onFieldUpdate={() => {}}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actType === 'judicial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Partes del Proceso
          </CardTitle>
          <CardDescription>
            Configure las partes demandante, demandada y sus representantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="actor" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actor">
                <UserPlus className="h-4 w-4 mr-2" />
                Actor/Demandante
              </TabsTrigger>
              <TabsTrigger value="demandado">
                <Users className="h-4 w-4 mr-2" />
                Demandados
              </TabsTrigger>
              <TabsTrigger value="abogados">
                <Scale className="h-4 w-4 mr-2" />
                Abogados Contrarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actor" className="space-y-4 mt-4">
              <ClientSelector
                label="Demandante/Actor"
                fieldPrefix="demandante"
                value={selectedActor}
                onChange={handleActorChange}
                onFieldUpdate={() => {}}
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Cliente o persona que inicia la acción judicial
              </p>
            </TabsContent>

            <TabsContent value="demandado" className="mt-4">
              <ContraparteManager
                contrapartes={contrapartes}
                onChange={handleContrapartesChange}
                title="Demandados / Contrapartes"
                description="Personas o entidades demandadas en este proceso"
              />
            </TabsContent>

            <TabsContent value="abogados" className="mt-4">
              <AbogadoContrarioManager
                abogados={abogadosContrarios}
                onChange={handleAbogadosChange}
                title="Abogados de la Contraparte"
                description="Representación legal de la parte demandada"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Extrajudicial
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Partes del Acto
        </CardTitle>
        <CardDescription>
          Configure las partes que intervienen en este acto extrajudicial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ClientSelector
          label="Primera Parte"
          fieldPrefix="primera_parte"
          value={selectedActor}
          onChange={handleActorChange}
          onFieldUpdate={() => {}}
          required
        />

        <ClientSelector
          label="Segunda Parte"
          fieldPrefix="segunda_parte"
          value={selectedDemandado}
          onChange={handleDemandadoChange}
          onFieldUpdate={() => {}}
        />

        {/* Contrapartes adicionales si se necesitan */}
        <ContraparteManager
          contrapartes={contrapartes}
          onChange={handleContrapartesChange}
          title="Partes Adicionales"
          description="Otras personas o entidades que intervienen en el acto"
        />
      </CardContent>
    </Card>
  );
}
