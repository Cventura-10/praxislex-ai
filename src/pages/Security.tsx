import { useState, useEffect } from "react";
import { Shield, Lock, Eye, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { isAdmin } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";

const Security = () => {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const adminStatus = await isAdmin();
    setHasAdminAccess(adminStatus);
    setLoading(false);

    if (!adminStatus) {
      toast({
        title: "Acceso limitado",
        description: "Solo administradores pueden ver esta sección completa",
        variant: "default"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">Verificando permisos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Seguridad y Auditoría
          </h1>
          <p className="text-muted-foreground mt-2">
            Registro de auditoría inmutable y verificación de integridad
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Lock className="h-4 w-4 mr-2" />
          Enterprise-Grade
        </Badge>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Auditoría Inmutable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Activa</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registro SHA-256 protegido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              Cifrado de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">AES-256</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cédulas y datos sensibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              RLS Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">20+</div>
            <p className="text-xs text-muted-foreground mt-1">
              Políticas de seguridad activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Notice */}
      {!hasAdminAccess && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Vista limitada</AlertTitle>
          <AlertDescription>
            Solo puedes ver tus propios eventos de auditoría. Los administradores tienen acceso completo.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Registro de Auditoría
          </TabsTrigger>
          {hasAdminAccess && (
            <TabsTrigger value="policies">
              <Shield className="h-4 w-4 mr-2" />
              Políticas de Seguridad
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogViewer />
        </TabsContent>

        {hasAdminAccess && (
          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Políticas de Seguridad Activas</CardTitle>
                <CardDescription>
                  Row Level Security (RLS) configuradas en todas las tablas sensibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">events_audit</div>
                        <div className="text-sm text-muted-foreground">
                          Tabla de auditoría inmutable
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Solo lectura admin
                      </Badge>
                    </div>
                    <div className="mt-3 text-xs font-mono bg-muted p-2 rounded">
                      ❌ No UPDATE | ❌ No DELETE = Inmutable
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">clients</div>
                        <div className="text-sm text-muted-foreground">
                          Solo propietario puede ver/editar
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        RLS habilitado
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">cases</div>
                        <div className="text-sm text-muted-foreground">
                          Usuario solo ve sus propios casos
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        RLS habilitado
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">user_roles</div>
                        <div className="text-sm text-muted-foreground">
                          Solo admin puede gestionar roles
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                        Admin only
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Security;
