import { memo } from "react";

/**
 * Logo de PraxisLex - Componente reutilizable
 */
export const PraxisLexLogo = memo(({ 
  size = "md",
  showTagline = false 
}: { 
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) => {
  const sizes = {
    sm: { width: 120, height: 42 },
    md: { width: 160, height: 56 },
    lg: { width: 200, height: 70 }
  };

  const { width, height } = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 1600 560" 
        xmlns="http://www.w3.org/2000/svg" 
        role="img" 
        aria-label="PraxisLex logo"
      >
        <title>PraxisLex — Donde la teoría se hace práctica</title>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0E6B4E" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        <g transform="translate(40,40) scale(0.45)">
          <rect x="64" y="64" width="896" height="896" rx="128" fill="url(#g1)"/>
          <circle cx="300" cy="280" r="28" fill="#D4AF37" opacity="0.95"/>
          <circle cx="248" cy="356" r="24" fill="#D4AF37" opacity="0.9"/>
          <circle cx="352" cy="356" r="24" fill="#D4AF37" opacity="0.9"/>
          <rect x="240" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.9"/>
          <rect x="320" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.85"/>
          <rect x="400" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.8"/>
          <path d="M560 320 L560 704 L736 704 C844 704 844 320 736 320 Z" fill="#F7F5EF" opacity="0.15"/>
          <path d="M608 356 L608 668 L720 668 C792 668 792 356 720 356 Z" fill="#F7F5EF" opacity="0.25"/>
          <path d="M600 512 L760 384 L760 640 Z" fill="#D4AF37" opacity="0.9"/>
          <rect x="240" y="776" width="496" height="16" rx="8" fill="#D4AF37" opacity="0.6"/>
        </g>
        <g transform="translate(520,120)">
          <text x="0" y="120" fontFamily="Playfair Display, Georgia, serif" fontWeight="700" fontSize="140" fill="#1E293B">Praxis</text>
          <text x="520" y="120" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="700" fontSize="140" fill="#0E6B4E">Lex</text>
          {showTagline && (
            <text x="0" y="220" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="400" fontSize="44" fill="#64748B">
              Donde la teoría se hace práctica.
            </text>
          )}
        </g>
      </svg>
    </div>
  );
});

PraxisLexLogo.displayName = "PraxisLexLogo";

/**
 * Cabecera con branding PraxisLex
 */
export const PraxisLexHeader = memo(() => {
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <PraxisLexLogo size="sm" />
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Sistema de Gestión Jurídica
          </span>
        </nav>
      </div>
    </header>
  );
});

PraxisLexHeader.displayName = "PraxisLexHeader";

/**
 * Footer con branding
 */
export const PraxisLexFooter = memo(() => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row md:py-4">
        <div className="flex items-center gap-2">
          <PraxisLexLogo size="sm" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear} PraxisLex. Todos los derechos reservados.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Donde la teoría se hace práctica.
        </p>
      </div>
    </footer>
  );
});

PraxisLexFooter.displayName = "PraxisLexFooter";
