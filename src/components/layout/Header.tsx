import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Bell, Search, User, LogOut, Settings, CreditCard, UserCircle, Crown, Clock, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useNotifications } from "@/hooks/useNotifications";
import logo from "@/assets/praxislex-logo-horizontal.svg";

export function Header() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isPro, isAdmin } = useUserRole();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name || "Usuario");
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTimeSince = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    if (hours > 0) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    return 'Hace un momento';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="PraxisLex" className="h-16 w-auto" />
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
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-80 z-50 bg-popover border shadow-strong"
              sideOffset={5}
            >
              <DropdownMenuLabel className="text-base font-semibold">
                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No hay notificaciones
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cuando tengas avisos importantes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={notif.id}>
                      {index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem 
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent focus:bg-accent ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.type === 'deadline' || notif.type === 'hearing') {
                            navigate('/audiencias');
                          }
                        }}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {notif.type === 'deadline' && (
                            <Clock className={`h-4 w-4 mt-0.5 ${notif.priority === 'high' ? 'text-destructive' : 'text-primary'}`} />
                          )}
                          {notif.type === 'hearing' && (
                            <CalendarIcon className={`h-4 w-4 mt-0.5 ${notif.priority === 'high' ? 'text-destructive' : 'text-primary'}`} />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${notif.priority === 'high' ? 'text-destructive' : 'text-foreground'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                              {getTimeSince(notif.timestamp)}
                            </span>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center justify-center text-primary hover:text-primary cursor-pointer"
                    onClick={() => navigate("/audiencias")}
                  >
                    Ver todas las notificaciones
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
                {isPro && (
                  <Crown className="h-3 w-3 absolute -top-1 -right-1 text-accent" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50 bg-popover border shadow-strong" sideOffset={5}>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
                  {role && (
                    <Badge variant={isPro ? "default" : "secondary"} className="w-fit text-xs mt-1">
                      {role === "admin" ? "Administrador" : isPro ? "Plan Pro" : "Plan Gratuito"}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/configuracion")}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/facturacion")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Facturación
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/portal")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Portal del Cliente
              </DropdownMenuItem>
              {!isPro && !isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/upgrade")}
                    className="bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Actualizar a Pro
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
