import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/LoadingFallback";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

// Eager load critical routes (auth and dashboard)
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InvitationAccept from "./pages/InvitationAccept";

// Lazy load all other routes for better performance
const Cases = lazy(() => import("./pages/Cases"));
const Clients = lazy(() => import("./pages/Clients"));
const Hearings = lazy(() => import("./pages/Hearings"));
const Documents = lazy(() => import("./pages/Documents"));
const Jurisprudence = lazy(() => import("./pages/Jurisprudence"));
const AILegalDrafting = lazy(() => import("./pages/AILegalDrafting"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
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
                  <Header />
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 p-6">
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/casos" element={<Cases />} />
                          <Route path="/clientes" element={<Clients />} />
                          <Route path="/audiencias" element={<Hearings />} />
                          <Route path="/documentos" element={<Documents />} />
                          <Route path="/jurisprudencia" element={<Jurisprudence />} />
                          <Route path="/redaccion-ia" element={<AILegalDrafting />} />
                          <Route path="/contabilidad" element={<Accounting />} />
                          <Route path="/creditos-pagos" element={<AccountingNew />} />
                          <Route path="/contabilidad-general" element={<FirmAccounting />} />
                          <Route path="/configuracion/firma" element={<LawFirmSettings />} />
                          <Route path="/portal" element={<ClientPortal />} />
                          <Route path="/facturacion" element={<Billing />} />
                          <Route path="/perfil" element={<Profile />} />
                          <Route path="/configuracion" element={<Settings />} />
                          <Route path="/upgrade" element={<Upgrade />} />
                          <Route path="/seguridad" element={<Security />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </div>
                </div>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
