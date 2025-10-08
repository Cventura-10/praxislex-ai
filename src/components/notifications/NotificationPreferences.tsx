import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Smartphone, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NotificationPrefs {
  id?: string;
  user_id?: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  hearing_reminders: boolean;
  deadline_reminders: boolean;
  payment_reminders: boolean;
  case_updates: boolean;
  client_messages: boolean;
  reminder_advance_hours: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    hearing_reminders: true,
    deadline_reminders: true,
    payment_reminders: true,
    case_updates: true,
    client_messages: false,
    reminder_advance_hours: 24,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las preferencias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (updatedPrefs: Partial<NotificationPrefs>) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const newPrefs = { ...preferences, ...updatedPrefs };
      setPreferences(newPrefs);

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          ...newPrefs,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Preferencias actualizadas correctamente",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cargando preferencias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Preferencias de Notificaciones</CardTitle>
        </div>
        <CardDescription>
          Configura cómo y cuándo recibir notificaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canales de notificación */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Canales de notificación</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="in_app">Notificaciones en la app</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe notificaciones dentro de la aplicación
                </p>
              </div>
            </div>
            <Switch
              id="in_app"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                savePreferences({ in_app_enabled: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Notificaciones por email</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe notificaciones en tu correo
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                savePreferences({ email_enabled: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="push">Notificaciones push</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe notificaciones push (próximamente)
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) =>
                savePreferences({ push_enabled: checked })
              }
              disabled={true}
            />
          </div>
        </div>

        <Separator />

        {/* Tipos de notificaciones */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Tipos de notificaciones</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hearings">Recordatorios de audiencias</Label>
              <p className="text-xs text-muted-foreground">
                Recibe recordatorios antes de audiencias programadas
              </p>
            </div>
            <Switch
              id="hearings"
              checked={preferences.hearing_reminders}
              onCheckedChange={(checked) =>
                savePreferences({ hearing_reminders: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deadlines">Recordatorios de plazos</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones de plazos próximos a vencer
              </p>
            </div>
            <Switch
              id="deadlines"
              checked={preferences.deadline_reminders}
              onCheckedChange={(checked) =>
                savePreferences({ deadline_reminders: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="payments">Recordatorios de pagos</Label>
              <p className="text-xs text-muted-foreground">
                Notificaciones de facturas y pagos pendientes
              </p>
            </div>
            <Switch
              id="payments"
              checked={preferences.payment_reminders}
              onCheckedChange={(checked) =>
                savePreferences({ payment_reminders: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cases">Actualizaciones de casos</Label>
              <p className="text-xs text-muted-foreground">
                Cambios importantes en tus casos
              </p>
            </div>
            <Switch
              id="cases"
              checked={preferences.case_updates}
              onCheckedChange={(checked) =>
                savePreferences({ case_updates: checked })
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="clients">Mensajes de clientes</Label>
              <p className="text-xs text-muted-foreground">
                Comunicaciones del portal de clientes
              </p>
            </div>
            <Switch
              id="clients"
              checked={preferences.client_messages}
              onCheckedChange={(checked) =>
                savePreferences({ client_messages: checked })
              }
              disabled={isSaving}
            />
          </div>
        </div>

        <Separator />

        {/* Configuración de recordatorios */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configuración de recordatorios
          </h3>

          <div className="space-y-2">
            <Label htmlFor="advance">
              Anticipación de recordatorios (horas)
            </Label>
            <Input
              id="advance"
              type="number"
              min="1"
              max="168"
              value={preferences.reminder_advance_hours}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > 0 && value <= 168) {
                  savePreferences({ reminder_advance_hours: value });
                }
              }}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Recibe recordatorios con esta anticipación antes del evento
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
