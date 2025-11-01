import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLegalActsBundle } from "@/hooks/useLegalActsBundle";
import { UniversalIntakeForm } from "@/components/legal-acts/UniversalIntakeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function LegalActWizardNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const actoSlug = searchParams.get("acto");
  const mode = searchParams.get("mode");
  
  const { getActoBySlug } = useLegalActsBundle();
  const acto = useMemo(() => {
    return actoSlug ? getActoBySlug(actoSlug) : null;
  }, [actoSlug, getActoBySlug]);

  useEffect(() => {
    if (!actoSlug) {
      navigate('/generador-actos');
    }
  }, [actoSlug, navigate]);

  if (!acto) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Acto no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/generador-actos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al selector
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header con navegación */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/generador-actos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{acto.title || acto.slug}</h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'intake' ? 'Redacción Asistida' : 'Redacción Manual'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario Universal */}
      {mode === 'intake' ? (
        <UniversalIntakeForm
          acto={acto}
          onSuccess={(data) => {
            console.log('Acto generado:', data);
            // Aquí se puede navegar a vista previa o descarga
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Modo Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              El editor manual se implementará aquí con la plantilla pre-cargada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
