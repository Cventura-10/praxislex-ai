import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";

export default function LawFirmSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  const [formData, setFormData] = useState({
    nombre_firma: "",
    rnc: "",
    direccion: "",
    telefono: "",
    email: "",
    ciudad: "",
    provincia: "",
    abogado_principal: "",
    matricula_card: "",
    eslogan: "",
    sitio_web: "",
    logo_url: "",
  });

  useEffect(() => {
    fetchLawFirmProfile();
  }, []);

  const fetchLawFirmProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("law_firm_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfileExists(true);
        setFormData({
          nombre_firma: data.nombre_firma || "",
          rnc: data.rnc || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
          email: data.email || "",
          ciudad: data.ciudad || "",
          provincia: data.provincia || "",
          abogado_principal: data.abogado_principal || "",
          matricula_card: data.matricula_card || "",
          eslogan: data.eslogan || "",
          sitio_web: data.sitio_web || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching law firm profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la firma",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre_firma || !formData.abogado_principal) {
      toast({
        title: "Campos requeridos",
        description: "El nombre de la firma y abogado principal son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      if (profileExists) {
        const { error } = await supabase
          .from("law_firm_profile")
          .update(formData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("law_firm_profile")
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
        setProfileExists(true);
      }

      toast({
        title: "✓ Guardado",
        description: "La información de la firma ha sido actualizada",
      });
    } catch (error: any) {
      console.error("Error saving law firm profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/configuracion")}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Configuración
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Carátula de Firma</h1>
          <p className="text-muted-foreground">
            Esta información aparecerá en todos los documentos generados
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Firma</CardTitle>
            <CardDescription>
              Datos principales del bufete o despacho
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la Firma *</Label>
                <Input
                  value={formData.nombre_firma}
                  onChange={(e) => handleInputChange("nombre_firma", e.target.value)}
                  placeholder="Ej: Pérez & Asociados"
                />
              </div>

              <div className="space-y-2">
                <Label>RNC</Label>
                <Input
                  value={formData.rnc}
                  onChange={(e) => handleInputChange("rnc", e.target.value)}
                  placeholder="123-45678-9"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                  placeholder="(809) 555-1234"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contacto@firma.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  value={formData.ciudad}
                  onChange={(e) => handleInputChange("ciudad", e.target.value)}
                  placeholder="Santo Domingo"
                />
              </div>

              <div className="space-y-2">
                <Label>Provincia</Label>
                <Input
                  value={formData.provincia}
                  onChange={(e) => handleInputChange("provincia", e.target.value)}
                  placeholder="Distrito Nacional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección Completa</Label>
              <Textarea
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                placeholder="Calle Principal #123, Edificio..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Sitio Web</Label>
              <Input
                value={formData.sitio_web}
                onChange={(e) => handleInputChange("sitio_web", e.target.value)}
                placeholder="https://www.firma.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Eslogan</Label>
              <Input
                value={formData.eslogan}
                onChange={(e) => handleInputChange("eslogan", e.target.value)}
                placeholder="Su confianza, nuestra misión"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abogado Principal</CardTitle>
            <CardDescription>
              Información del abogado que firma los documentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={formData.abogado_principal}
                  onChange={(e) => handleInputChange("abogado_principal", e.target.value)}
                  placeholder="Dr. Juan Pérez García"
                />
              </div>

              <div className="space-y-2">
                <Label>Matrícula CARD</Label>
                <Input
                  value={formData.matricula_card}
                  onChange={(e) => handleInputChange("matricula_card", e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar Información
          </Button>
          <Button variant="outline" onClick={() => navigate("/configuracion")}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
