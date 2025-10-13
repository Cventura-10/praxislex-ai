import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml, sanitizePlainText, sanitizeUrl, sanitizeFileName, isValidEmail } from '@/lib/sanitize';
import { rateLimiter, RATE_LIMITS } from '@/lib/rateLimit';
import { securityMonitor, detectXSS, detectSQLInjection, validateSecureInput } from '@/lib/securityMonitor';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, AlertTriangle, CheckCircle, Users, Database } from 'lucide-react';

const SecurityShowcase = () => {
  const { toast } = useToast();
  const [testInput, setTestInput] = useState('');
  const [sanitizedOutput, setSanitizedOutput] = useState('');
  const [rateLimitStatus, setRateLimitStatus] = useState<string>('');
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  // Test XSS Detection
  const testXSSDetection = () => {
    const isXSS = detectXSS(testInput);
    if (isXSS) {
      toast({
        title: "🚨 XSS Detectado",
        description: "Se detectó contenido potencialmente malicioso",
        variant: "destructive",
      });
      securityMonitor.logEvent({
        type: 'xss_attempt',
        severity: 'high',
        message: 'XSS attempt detected in test input',
        metadata: { input: testInput.substring(0, 100) },
      });
    } else {
      toast({
        title: "✅ Entrada segura",
        description: "No se detectó contenido malicioso",
      });
    }
  };

  // Test SQL Injection Detection
  const testSQLInjection = () => {
    const isSQLI = detectSQLInjection(testInput);
    if (isSQLI) {
      toast({
        title: "🚨 SQL Injection Detectado",
        description: "Se detectó intento de inyección SQL",
        variant: "destructive",
      });
      securityMonitor.logEvent({
        type: 'sql_injection_attempt',
        severity: 'critical',
        message: 'SQL injection attempt detected',
        metadata: { input: testInput.substring(0, 100) },
      });
    } else {
      toast({
        title: "✅ Entrada segura",
        description: "No se detectó inyección SQL",
      });
    }
  };

  // Test Sanitization
  const testSanitization = () => {
    const sanitized = sanitizeHtml(testInput);
    setSanitizedOutput(sanitized);
    toast({
      title: "Sanitización completa",
      description: "El contenido ha sido sanitizado",
    });
  };

  // Test Rate Limiting
  const testRateLimit = () => {
    const allowed = rateLimiter.check('test-action', RATE_LIMITS.API_CALL);
    const remaining = rateLimiter.getRemaining('test-action', RATE_LIMITS.API_CALL);
    
    if (allowed) {
      setRateLimitStatus(`✅ Permitido. Intentos restantes: ${remaining}`);
      toast({
        title: "Rate limit OK",
        description: `${remaining} intentos restantes`,
      });
    } else {
      setRateLimitStatus('🚫 Rate limit excedido');
      toast({
        title: "Rate limit excedido",
        description: "Demasiadas peticiones. Espera un momento.",
        variant: "destructive",
      });
    }
  };

  // View Security Events
  const viewSecurityEvents = () => {
    const events = securityMonitor.getRecentEvents(10);
    setSecurityEvents(events);
  };

  // Test Multi-Tenant
  const testMultiTenant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "No autenticado",
          description: "Inicia sesión para probar multi-tenancy",
          variant: "destructive",
        });
        return;
      }

      // Get user's tenant
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('*, tenants(*)')
        .eq('user_id', user.id)
        .single();

      setTenantInfo(tenantUser);
      
      toast({
        title: "✅ Multi-Tenant OK",
        description: `Tenant: ${tenantUser?.tenants?.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar tenant",
        variant: "destructive",
      });
    }
  };

  // Test Audit Trail
  const testAuditTrail = async () => {
    try {
      const { data: events } = await supabase
        .from('events_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      toast({
        title: "✅ Audit Trail",
        description: `${events?.length || 0} eventos recientes encontrados`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar audit trail",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-10 h-10 text-primary" />
          Security & Multi-Tenant Showcase
        </h1>
        <p className="text-muted-foreground">
          Prueba todas las funcionalidades de seguridad y multi-tenancy implementadas
        </p>
      </div>

      <Tabs defaultValue="sanitization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sanitization">Sanitización</TabsTrigger>
          <TabsTrigger value="detection">Detección</TabsTrigger>
          <TabsTrigger value="ratelimit">Rate Limit</TabsTrigger>
          <TabsTrigger value="multitenant">Multi-Tenant</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        {/* Sanitization Tests */}
        <TabsContent value="sanitization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Pruebas de Sanitización
              </CardTitle>
              <CardDescription>
                Prueba la sanitización de HTML, URLs, nombres de archivo, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Entrada de prueba
                </label>
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="<script>alert('XSS')</script>"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={testSanitization}>
                  Sanitizar HTML
                </Button>
                <Button onClick={() => setSanitizedOutput(sanitizePlainText(testInput))}>
                  Texto Plano
                </Button>
                <Button onClick={() => setSanitizedOutput(sanitizeUrl(testInput))}>
                  Sanitizar URL
                </Button>
                <Button onClick={() => setSanitizedOutput(sanitizeFileName(testInput))}>
                  Sanitizar Nombre
                </Button>
                <Button onClick={() => {
                  const valid = isValidEmail(testInput);
                  setSanitizedOutput(valid ? '✅ Email válido' : '❌ Email inválido');
                }}>
                  Validar Email
                </Button>
              </div>

              {sanitizedOutput && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Resultado:</p>
                  <code className="text-sm">{sanitizedOutput}</code>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detection Tests */}
        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Detección de Amenazas
              </CardTitle>
              <CardDescription>
                Prueba la detección de XSS y SQL Injection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Entrada maliciosa de prueba
                </label>
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="<script>alert('XSS')</script> or ' OR '1'='1"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testXSSDetection} variant="destructive">
                  Detectar XSS
                </Button>
                <Button onClick={testSQLInjection} variant="destructive">
                  Detectar SQL Injection
                </Button>
                <Button onClick={viewSecurityEvents} variant="outline">
                  Ver Eventos de Seguridad
                </Button>
              </div>

              {securityEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Eventos recientes:</p>
                  {securityEvents.map((event, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={event.severity === 'critical' ? 'destructive' : 'default'}>
                          {event.severity}
                        </Badge>
                        <span className="font-medium">{event.type}</span>
                      </div>
                      <p className="text-muted-foreground">{event.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limiting Tests */}
        <TabsContent value="ratelimit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Rate Limiting
              </CardTitle>
              <CardDescription>
                Prueba los límites de peticiones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testRateLimit}>
                Probar Rate Limit (100/min)
              </Button>

              {rateLimitStatus && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{rateLimitStatus}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Límites configurados:</p>
                <div className="grid gap-2">
                  <div className="p-2 bg-muted rounded text-sm">
                    <strong>Login:</strong> 5 intentos / 15 min
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <strong>API:</strong> 100 llamadas / min
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <strong>Generación:</strong> 10 documentos / min
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <strong>Búsqueda:</strong> 30 búsquedas / min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Tenant Tests */}
        <TabsContent value="multitenant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Multi-Tenancy
              </CardTitle>
              <CardDescription>
                Verifica el aislamiento de datos por tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testMultiTenant}>
                Verificar Mi Tenant
              </Button>

              {tenantInfo && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm"><strong>Tenant:</strong> {tenantInfo.tenants?.name}</p>
                  <p className="text-sm"><strong>Slug:</strong> {tenantInfo.tenants?.slug}</p>
                  <p className="text-sm"><strong>Plan:</strong> {tenantInfo.tenants?.plan}</p>
                  <p className="text-sm"><strong>Rol:</strong> {tenantInfo.role}</p>
                  <Badge variant="outline">
                    ID: {tenantInfo.tenant_id}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Características Multi-Tenant:</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Aislamiento automático por tenant_id</li>
                  <li>RLS policies aplicadas en todas las tablas</li>
                  <li>Triggers automáticos para asignación de tenant</li>
                  <li>Función SECURITY DEFINER para verificación</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tests */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Registro de Auditoría
              </CardTitle>
              <CardDescription>
                Verifica el registro inmutable de eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testAuditTrail}>
                Verificar Audit Trail
              </Button>

              <div className="space-y-2">
                <p className="text-sm font-medium">Características del Audit Trail:</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Registro inmutable de todos los eventos críticos</li>
                  <li>Hash SHA-256 para verificación de integridad</li>
                  <li>Triggers automáticos en tablas sensibles</li>
                  <li>Políticas RLS para protección de logs</li>
                  <li>Función de verificación de integridad</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityShowcase;
