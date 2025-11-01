import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SafeComponent } from "@/components/SafeComponent";
import { LoadingFallback } from "@/components/LoadingFallback";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { FloatingAIWidget } from "@/components/ai/FloatingAIWidget";
import { HealthMonitor } from "@/components/system/HealthMonitor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

// Eager load critical routes (auth and dashboard)
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InvitationAccept from "./pages/InvitationAccept";
import LegalActWizard from "./pages/LegalActWizard";
import TestHydration from "./pages/TestHydration";
import TestHydrationV2 from "./pages/TestHydrationV2";
import LegalActWizardNew from "./pages/LegalActWizardNew";

// Lazy load all other routes for better performance
const Cases = lazy(() => import("./pages/Cases"));
const Clients = lazy(() => import("./pages/Clients"));
const Hearings = lazy(() => import("./pages/Hearings"));
const Documents = lazy(() => import("./pages/Documents"));
const Jurisprudence = lazy(() => import("./pages/Jurisprudence"));
const AILegalDrafting = lazy(() => import("./pages/AILegalDrafting"));
const AssistantIA = lazy(() => import("./pages/AssistantIA"));
const Accounting = lazy(() => import("./pages/Accounting"));
const AccountingNew = lazy(() => import("./pages/AccountingNew"));
const FirmAccounting = lazy(() => import("./pages/FirmAccounting"));
const LawFirmSettings = lazy(() => import("./pages/LawFirmSettings"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Billing = lazy(() => import("./pages/Billing"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Security = lazy(() => import("./pages/Security"));
const Analytics = lazy(() => import("./pages/Analytics"));
const LegalModels = lazy(() => import("./pages/LegalModels"));
// Eager load for legal acts generator to prevent 404
import LegalActsGenerator from "./pages/LegalActsGenerator";
const SecurityShowcase = lazy(() => import("./pages/SecurityShowcase"));
const LawyersAdmin = lazy(() => import("./pages/LawyersAdmin"));
const ClientMessages = lazy(() => import("./pages/ClientMessages"));
const VirtualRoom = lazy(() => import("./pages/VirtualRoom"));
const NotarialActs = lazy(() => import("./pages/NotarialActs"));
const NotarialActsNew = lazy(() => import("./pages/NotarialActsNew"));
const ActosGenerados = lazy(() => import("./pages/ActosGenerados"));
const NotFound = lazy(() => import("./pages/NotFound"));

// React Query Error Fallback
function RQFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar datos</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm">{error.message}</p>
          <Button onClick={resetErrorBoundary} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <TooltipProvider delayDuration={200} disableHoverableContent>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <PWAInstallBanner />
        <OfflineIndicator />
        <UpdatePrompt />
        <FloatingAIWidget />
        <HealthMonitor />
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/invitation-accept" element={<InvitationAccept />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <AuthGuard>
                <div className="min-h-screen bg-background">
                  <SafeComponent componentName="Header">
                    <Header />
                  </SafeComponent>
                  <div className="flex">
                    <SafeComponent componentName="Navigation">
                      <Navigation />
                    </SafeComponent>
                    <main className="flex-1 p-6">
                      <QueryErrorResetBoundary>
                        {({ reset }) => (
                          <ReactErrorBoundary onReset={reset} FallbackComponent={RQFallback}>
                            <Suspense fallback={<LoadingFallback />}>
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/casos" element={<Cases />} />
                                <Route path="/clientes" element={<Clients />} />
                                <Route path="/audiencias" element={<Hearings />} />
                                <Route path="/documentos" element={<Documents />} />
                                <Route path="/jurisprudencia" element={<Jurisprudence />} />
                                <Route path="/redaccion-ia-clasico" element={<AILegalDrafting />} />
                                <Route path="/asistente-ia" element={<AssistantIA />} />
                                <Route path="/contabilidad" element={<Accounting />} />
                                <Route path="/creditos-pagos" element={<AccountingNew />} />
                                <Route path="/contabilidad-general" element={<FirmAccounting />} />
                                <Route path="/configuracion/firma" element={<LawFirmSettings />} />
                                <Route path="/portal" element={<ClientPortal />} />
                                <Route path="/client-portal" element={<ClientPortal />} />
                                <Route path="/facturacion" element={<Billing />} />
                                <Route path="/perfil" element={<Profile />} />
                                <Route path="/configuracion" element={<Settings />} />
                                <Route path="/upgrade" element={<Upgrade />} />
                                <Route path="/seguridad" element={<Security />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/modelos-juridicos" element={<LegalModels />} />
                                <Route path="/generador-actos" element={<LegalActsGenerator />} />
                                <Route path="/redaccion-ia" element={<LegalActWizard />} />
                                <Route path="/redaccion-ia-new" element={<LegalActWizardNew />} />
                                <Route path="/abogados" element={<LawyersAdmin />} />
                                <Route path="/mensajes" element={<ClientMessages />} />
                                <Route path="/sala-virtual" element={<VirtualRoom />} />
                                <Route path="/actos-notariales" element={<NotarialActsNew />} />
                                <Route path="/actos-notariales-old" element={<NotarialActs />} />
                                <Route path="/actos-generados" element={<ActosGenerados />} />
                                <Route path="/security-showcase" element={<SecurityShowcase />} />
                                <Route path="/test-hydration" element={<TestHydration />} />
                                <Route path="/test-hydration-v2" element={<TestHydrationV2 />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                          </ReactErrorBoundary>
                        )}
                      </QueryErrorResetBoundary>
                    </main>
                  </div>
                </div>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
