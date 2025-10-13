import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Scale,
  CreditCard,
  UserCircle,
  Receipt,
  Sparkles,
  Shield,
  Upload,
  BarChart3,
  Bot,
  FileStack,
  UserCog,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/casos", icon: Briefcase, label: "Casos" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/abogados", icon: UserCog, label: "Abogados" },
  { href: "/mensajes", icon: MessageSquare, label: "Mensajes Clientes" },
  { href: "/audiencias", icon: Calendar, label: "Audiencias" },
  { href: "/documentos", icon: FileText, label: "Documentos" },
  { href: "/generador-actos", icon: FileStack, label: "Generador de Actos" },
  { href: "/asistente-ia", icon: Bot, label: "Asistente IA" },
  { href: "/modelos-juridicos", icon: Upload, label: "Modelos Jurídicos" },
  { href: "/jurisprudencia", icon: Scale, label: "Jurisprudencia" },
  { href: "/contabilidad", icon: Receipt, label: "Contabilidad" },
  { href: "/portal", icon: UserCircle, label: "Portal Cliente" },
  { href: "/facturacion", icon: CreditCard, label: "Facturación" },
  { href: "/seguridad", icon: Shield, label: "Seguridad" },
  { href: "/analytics", icon: BarChart3, label: "Analítica" },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="w-64 border-r bg-sidebar min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-base",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
