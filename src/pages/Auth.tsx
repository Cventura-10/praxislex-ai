import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { passwordSchema, calculatePasswordStrength } from "@/lib/validation";
import { z } from "zod";

const LogoHorizontal = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 1600 560"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="PraxisLex — Donde la teoría se hace práctica"
    preserveAspectRatio="xMidYMid meet"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    className={`w-full h-auto block ${className}`}
  >
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0E6B4E" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
    </defs>
    <g transform="translate(32,32) scale(0.5)">
      <rect x="64" y="64" width="896" height="896" rx="128" fill="url(#g1)" />
      <circle cx="300" cy="280" r="28" fill="#D4AF37" opacity="0.95" />
      <circle cx="248" cy="356" r="24" fill="#D4AF37" opacity="0.9" />
      <circle cx="352" cy="356" r="24" fill="#D4AF37" opacity="0.9" />
      <rect x="240" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.9" />
      <rect x="320" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.85" />
      <rect x="400" y="440" width="48" height="320" rx="16" fill="#F7F5EF" opacity="0.8" />
      <path d="M560 320 L560 704 L736 704 C844 704 844 320 736 320 Z" fill="#F7F5EF" opacity="0.15" />
      <path d="M608 356 L608 668 L720 668 C792 668 792 356 720 356 Z" fill="#F7F5EF" opacity="0.25" />
      <path d="M600 512 L760 384 L760 640 Z" fill="#D4AF37" opacity="0.9" />
      <rect x="240" y="776" width="496" height="16" rx="8" fill="#D4AF37" opacity="0.6" />
    </g>
    <g transform="translate(520,120)">
      <text x="0" y="120" fontFamily="Georgia, serif" fontWeight="800" fontSize="152" fill="#1E293B">
        Praxis
      </text>
      <text x="560" y="120" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="900" fontSize="152" fill="#0E6B4E">
        Lex
      </text>
      <text x="0" y="230" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="500" fontSize="48" fill="#64748B">
        Donde la teoría se hace práctica.
      </text>
    </g>
  </svg>
);

const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; form?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(calculatePasswordStrength(""));
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validate = () => {
    const e: { email?: string; password?: string; fullName?: string } = {};
    
    // Email validation
    if (!emailRegex.test(email)) e.email = "Por favor introduce un correo válido";
    
    // Password validation - enforce 12 char minimum for both signup and signin
    if (isSignUp) {
      try {
        passwordSchema.parse(password);
      } catch (err) {
        if (err instanceof z.ZodError) {
          e.password = err.issues[0].message;
        }
      }
    } else {
      // Sign-in also requires 12+ characters for UX parity
      if (!password || password.length < 12) {
        e.password = "La contraseña debe tener al menos 12 caracteres";
      }
    }
    
    // Full name validation
    if (isSignUp && (!fullName || fullName.trim().length === 0)) e.fullName = "El nombre es requerido";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Update password strength on change
  useEffect(() => {
    if (isSignUp) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, isSignUp]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta gratuita ha sido creada exitosamente.",
      });
    } catch (error: any) {
      setErrors({ form: error.message });
      toast({
        title: "Error al crear cuenta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });
    } catch (error: any) {
      setErrors({ form: error.message });
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!emailRegex.test(email)) {
      setErrors({ email: "Por favor introduce un correo válido" });
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Correo enviado",
        description: "Revisa tu correo para restablecer tu contraseña.",
      });
    } catch (error: any) {
      setErrors({ form: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#F7F5EF,white)] text-slate-800">
      {/* Decoración de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#0E6B4E]/10 blur-2xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-2xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2 lg:py-16">
        {/* Columna izquierda: marca y valor */}
        <div className="flex flex-col items-start justify-center gap-7">
          <div className="w-full max-w-[1200px] sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1280px] drop-shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
            <LogoHorizontal />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#0E6B4E]/10 px-3 py-1 text-xs font-semibold text-[#0E6B4E] ring-1 ring-[#0E6B4E]/20">
            NUEVA GENERACIÓN LEGALTECH
          </span>

          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
            El despacho <span className="text-[#0E6B4E]">en la nube</span> con IA que <span className="text-[#D4AF37]">cita sus fuentes</span>.
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-slate-600">
            Gestiona expedientes, plazos y documentos en un solo lugar. Redacta con respaldo en jurisprudencia oficial y ofrece a tus clientes un portal claro y profesional.
          </p>

          <ul className="mt-2 grid w-full max-w-2xl grid-cols-1 gap-3 text-[15px] text-slate-700 sm:grid-cols-2">
            {[
              "Borradores con jurisprudencia del Poder Judicial",
              "Alertas de vencimientos y audiencias",
              "Plantillas DOCX/PDF con variables",
              "Suscripciones por paquetes y portal del cliente"
            ].map((txt) => (
              <li key={txt} className="flex items-start gap-3 rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-200">
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden className="mt-1 flex-shrink-0">
                  <circle cx="10" cy="10" r="10" fill="#0E6B4E"/>
                  <path d="M5 10.5 L8.2 13.5 L15 7" stroke="#F7F5EF" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{txt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna derecha: formulario */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isForgotPassword ? "Recuperar contraseña" : isSignUp ? "Crear despacho" : "Entrar a PraxisLex"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isForgotPassword 
                ? "Te enviaremos un correo para restablecer tu contraseña" 
                : isSignUp 
                  ? "Comienza tu prueba gratuita hoy" 
                  : "Accede a tu escritorio jurídico en la nube"}
            </p>

            {errors.form && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            {resetEmailSent && isForgotPassword && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Correo enviado exitosamente. Revisa tu bandeja de entrada.
              </div>
            )}

            {isForgotPassword ? (
              // Formulario de recuperación de contraseña
              <form className="mt-6 flex flex-col gap-4" onSubmit={handleForgotPassword}>
                <div className="w-full">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.email ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:ring-[#0E6B4E]/20 focus:border-[#0E6B4E]"
                    }`}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || resetEmailSent}
                  className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#0E6B4E] px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#0E6B4E]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Enviando…
                    </span>
                  ) : resetEmailSent ? (
                    "Correo enviado"
                  ) : (
                    "Enviar correo de recuperación"
                  )}
                </button>

                <div className="mt-4 text-center text-sm text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetEmailSent(false);
                      setErrors({});
                    }}
                    className="font-medium text-[#0E6B4E] hover:underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </form>
            ) : (
              // Formulario de login/signup
              <form className="mt-6 flex flex-col gap-4" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                {isSignUp && (
                  <div className="w-full">
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan Pérez"
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-4 transition-all ${
                        errors.fullName ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:ring-[#0E6B4E]/20 focus:border-[#0E6B4E]"
                      }`}
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                )}

                <div className="w-full">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.email ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:ring-[#0E6B4E]/20 focus:border-[#0E6B4E]"
                    }`}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Contraseña
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrors({});
                        }}
                        className="text-xs font-medium text-[#0E6B4E] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      className={`w-full rounded-xl border bg-white px-4 py-3 pr-20 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-4 transition-all ${
                        errors.password ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:ring-[#0E6B4E]/20 focus:border-[#0E6B4E]"
                      }`}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPass ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  
                  {isSignUp && password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Fortaleza de contraseña:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score < 3 ? 'text-red-600' :
                          passwordStrength.score < 5 ? 'text-orange-600' :
                          passwordStrength.score < 6 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Usa al menos 12 caracteres con mayúsculas, minúsculas, números y símbolos
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#0E6B4E] px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#0E6B4E]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {isSignUp ? "Creando cuenta…" : "Ingresando…"}
                    </span>
                  ) : isSignUp ? (
                    "Crear cuenta gratuita"
                  ) : (
                    "Entrar"
                  )}
                </button>

                <div className="mt-4 text-center text-sm text-slate-500">
                  {isSignUp ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrors({});
                    }}
                    className="font-medium text-[#0E6B4E] hover:underline"
                  >
                    {isSignUp ? "Iniciar sesión" : "Crear despacho"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 border-t pt-4 text-xs text-slate-500">
              Al continuar aceptas los{" "}
              <a href="#" className="underline hover:text-slate-700">
                Términos
              </a>{" "}
              y la{" "}
              <a href="#" className="underline hover:text-slate-700">
                Política de Privacidad
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
