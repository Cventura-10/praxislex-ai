import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { AuthGuard } from "@/components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Clients from "./pages/Clients";
import Hearings from "./pages/Hearings";
import Documents from "./pages/Documents";
import Jurisprudence from "./pages/Jurisprudence";
import AILegalDrafting from "./pages/AILegalDrafting";
import Accounting from "./pages/Accounting";
import AccountingNew from "./pages/AccountingNew";
import FirmAccounting from "./pages/FirmAccounting";
import LawFirmSettings from "./pages/LawFirmSettings";
import ClientPortal from "./pages/ClientPortal";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Upgrade from "./pages/Upgrade";
import Auth from "./pages/Auth";
import InvitationAccept from "./pages/InvitationAccept";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// App principal
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/invitation-accept" element={<InvitationAccept />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <div className="min-h-screen bg-background">
                  <Header />
                  <div className="flex">
                    <Navigation />
                    <main className="flex-1 p-6">
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
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
