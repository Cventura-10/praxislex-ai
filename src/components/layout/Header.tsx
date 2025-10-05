import { Button } from "@/components/ui/button";
import { Scale, Bell, Search, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">PraxisLex</h1>
              <p className="text-[10px] text-muted-foreground leading-none">
                Donde la teoría se hace práctica
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Search className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <p className="text-sm font-medium">Vencimiento próximo</p>
                <p className="text-xs text-muted-foreground">
                  Caso "Cobro de pesos" vence en 2 días
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <p className="text-sm font-medium">Audiencia mañana</p>
                <p className="text-xs text-muted-foreground">
                  Primera Instancia DN - 10:00 AM
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <p className="text-sm font-medium">Documento pendiente</p>
                <p className="text-xs text-muted-foreground">
                  Demanda requiere firma del cliente
                </p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>María Arias</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Bufete Arias & Co.
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mi perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuItem>Facturación</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
