import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function CalendarICSImport() {
  const [file, setFile] = useState<File | null>(null);
  const [icsUrl, setIcsUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const parseICSContent = (content: string) => {
    // Parser básico de ICS (v1.4.5)
    const events: any[] = [];
    const lines = content.split(/\r\n|\n|\r/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        if (key === 'SUMMARY') {
          currentEvent.titulo = value;
        } else if (key.startsWith('DTSTART')) {
          // Parsear fecha: YYYYMMDD o YYYYMMDDTHHMMSS
          const dateValue = value.replace(/[^0-9]/g, '');
          if (dateValue.length >= 8) {
            const year = dateValue.substring(0, 4);
            const month = dateValue.substring(4, 6);
            const day = dateValue.substring(6, 8);
            currentEvent.fecha = `${year}-${month}-${day}`;
            
            if (dateValue.length >= 12) {
              const hour = dateValue.substring(8, 10);
              const minute = dateValue.substring(10, 12);
              currentEvent.hora = `${hour}:${minute}`;
            }
          }
        } else if (key === 'LOCATION') {
          currentEvent.lugar = value;
        } else if (key === 'DESCRIPTION') {
          currentEvent.descripcion = value;
        } else if (key === 'UID') {
          currentEvent.uid = value;
        }
      }
    }

    return events;
  };

  const deduplicateEvents = (newEvents: any[], existingEvents: any[]) => {
    // v1.4.5 - Clave de deduplicación: {fecha_inicio}+{tribunal}+{expediente}
    const existingKeys = new Set(
      existingEvents.map(e => `${e.fecha}_${e.lugar}_${e.titulo}`.toLowerCase())
    );

    return newEvents.filter(event => {
      const key = `${event.fecha}_${event.lugar}_${event.titulo}`.toLowerCase();
      return !existingKeys.has(key);
    });
  };

  const handleFileImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo ICS",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const content = await file.text();
      const parsedEvents = parseICSContent(content);

      if (parsedEvents.length === 0) {
        toast({
          title: "No se encontraron eventos",
          description: "El archivo ICS no contiene eventos válidos.",
          variant: "destructive",
        });
        return;
      }

      // Obtener eventos existentes del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('inicio, lugar, titulo')
        .eq('user_id', user.id);

      // Deduplicar
      const uniqueEvents = deduplicateEvents(parsedEvents, existingEvents || []);

      if (uniqueEvents.length === 0) {
        toast({
          title: "Eventos duplicados",
          description: "Todos los eventos del archivo ya existen en su calendario.",
        });
        return;
      }

      // Insertar eventos únicos
      const eventsToInsert = uniqueEvents.map(event => {
        const fecha = event.fecha || new Date().toISOString().split('T')[0];
        const hora = event.hora || '09:00';
        
        return {
          user_id: user.id,
          titulo: event.titulo || 'Audiencia SCJ',
          tipo_evento: 'audiencia' as const,
          inicio: `${fecha}T${hora}:00`,
          fin: `${fecha}T${hora}:00`,
          lugar: event.lugar || '',
          descripcion: event.descripcion || 'Importado desde Portal Judicial SCJ',
          estado: 'confirmado' as const,
        };
      });

      const { error } = await supabase
        .from('calendar_events')
        .insert(eventsToInsert);

      if (error) throw error;

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${uniqueEvents.length} audiencias desde el Portal Judicial.`,
      });

      setFile(null);
    } catch (error: any) {
      console.error("Error importando ICS:", error);
      toast({
        title: "Error al importar",
        description: error.message || "No se pudo importar el archivo ICS.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUrlImport = async () => {
    if (!icsUrl) {
      toast({
        title: "Error",
        description: "Por favor ingrese una URL del calendario ICS",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // Validar URL
      const url = new URL(icsUrl);
      if (!url.protocol.startsWith('http')) {
        throw new Error("URL inválida. Debe comenzar con http:// o https://");
      }

      // Descargar ICS
      const response = await fetch(icsUrl);
      if (!response.ok) throw new Error("No se pudo descargar el calendario");

      const content = await response.text();
      const parsedEvents = parseICSContent(content);

      if (parsedEvents.length === 0) {
        toast({
          title: "No se encontraron eventos",
          description: "El calendario no contiene eventos válidos.",
          variant: "destructive",
        });
        return;
      }

      // Obtener eventos existentes
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('inicio, lugar, titulo')
        .eq('user_id', user.id);

      // Deduplicar
      const uniqueEvents = deduplicateEvents(parsedEvents, existingEvents || []);

      if (uniqueEvents.length === 0) {
        toast({
          title: "Eventos duplicados",
          description: "Todos los eventos ya existen en su calendario.",
        });
        return;
      }

      // Insertar eventos
      const eventsToInsert = uniqueEvents.map(event => {
        const fecha = event.fecha || new Date().toISOString().split('T')[0];
        const hora = event.hora || '09:00';
        
        return {
          user_id: user.id,
          titulo: event.titulo || 'Audiencia SCJ',
          tipo_evento: 'audiencia' as const,
          inicio: `${fecha}T${hora}:00`,
          fin: `${fecha}T${hora}:00`,
          lugar: event.lugar || '',
          descripcion: event.descripcion || 'Suscripción a calendario del Portal Judicial SCJ',
          estado: 'confirmado' as const,
        };
      });

      const { error } = await supabase
        .from('calendar_events')
        .insert(eventsToInsert);

      if (error) throw error;

      toast({
        title: "Suscripción exitosa",
        description: `Se importaron ${uniqueEvents.length} audiencias. La suscripción se actualizará automáticamente.`,
      });

      setIcsUrl("");
    } catch (error: any) {
      console.error("Error suscribiendo a ICS:", error);
      toast({
        title: "Error al suscribir",
        description: error.message || "No se pudo suscribir al calendario ICS.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Importar Audiencias del Portal Judicial
        </CardTitle>
        <CardDescription>
          Importe sus audiencias desde un archivo ICS o suscríbase a un calendario ICS del Portal Judicial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Importar archivo */}
        <div className="space-y-3">
          <Label htmlFor="file-upload">Subir archivo ICS</Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".ics"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isImporting}
            />
            <Button
              onClick={handleFileImport}
              disabled={!file || isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Descargue su calendario desde el Portal Judicial y súbalo aquí
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O</span>
          </div>
        </div>

        {/* Suscribirse a URL */}
        <div className="space-y-3">
          <Label htmlFor="ics-url">Suscribirse a calendario ICS</Label>
          <div className="flex gap-2">
            <Input
              id="ics-url"
              type="url"
              placeholder="https://portal.scj.gob.do/calendar/audiencias.ics"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              disabled={isImporting}
            />
            <Button
              onClick={handleUrlImport}
              disabled={!icsUrl || isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si el Portal Judicial ofrece una URL de suscripción ICS, péguela aquí para mantener sus audiencias actualizadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}