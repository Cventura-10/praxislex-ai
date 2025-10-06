import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Lock, Globe, ArrowLeft, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-[#0E6B4E]" />
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Carátula de Firma</CardTitle>
            </div>
            <CardDescription>
              Configura la información que aparecerá en tus documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/configuracion/firma")} className="w-full">
              Personalizar Carátula
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#0E6B4E]" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>
              Gestiona cómo recibes notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por correo</Label>
                <p className="text-sm text-slate-500">
                  Recibe actualizaciones por correo electrónico
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de vencimientos</Label>
                <p className="text-sm text-slate-500">
                  Notificaciones de plazos próximos a vencer
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de audiencias</Label>
                <p className="text-sm text-slate-500">
                  Alertas 24h antes de cada audiencia
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#0E6B4E]" />
              <CardTitle>Preferencias</CardTitle>
            </div>
            <CardDescription>
              Personaliza tu experiencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select defaultValue="es">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Select defaultValue="mx">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mx">Ciudad de México (GMT-6)</SelectItem>
                  <SelectItem value="co">Bogotá (GMT-5)</SelectItem>
                  <SelectItem value="ar">Buenos Aires (GMT-3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#0E6B4E]" />
              <CardTitle>Seguridad</CardTitle>
            </div>
            <CardDescription>
              Protege tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticación de dos factores</Label>
                <p className="text-sm text-slate-500">
                  Añade una capa extra de seguridad
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sesiones activas</Label>
                <p className="text-sm text-slate-500">
                  Gestiona dispositivos con sesión iniciada
                </p>
              </div>
              <button className="text-sm font-medium text-[#0E6B4E] hover:underline">
                Ver todas
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
