import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LogoHorizontal = ({ size = 360 }: { size?: number }) => (
  <svg
    width={size}
    viewBox="0 0 1600 560"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="PraxisLex — Donde la teoría se hace práctica"
  >
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0E6B4E" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
    </defs>
    <g transform="translate(40,40) scale(0.45)">
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
      <text x="0" y="120" fontFamily="Georgia, serif" fontWeight="700" fontSize="140" fill="#1E293B">
        Praxis
      </text>
      <text x="520" y="120" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="700" fontSize="140" fill="#0E6B4E">
        Lex
      </text>
      <text x="0" y="220" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontWeight="400" fontSize="44" fill="#64748B">
        Donde la teoría se hace práctica.
      </text>
    </g>
  </svg>
);

const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; form?: string }>({});
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
    if (!emailRegex.test(email)) e.email = "Por favor introduce un correo válido";
    if (!password || password.length < 6) e.password = "Mínimo 6 caracteres";
    if (isSignUp && (!fullName || fullName.trim().length === 0)) e.fullName = "El nombre es requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

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

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#F7F5EF,white)] text-slate-800">
      {/* Decoración de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#0E6B4E]/10 blur-2xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-2xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2 lg:py-16">
        {/* Columna izquierda: marca y valor */}
        <div className="flex flex-col items-start justify-center gap-6">
          <LogoHorizontal size={360} />
          <p className="max-w-xl text-lg text-slate-600">
            Plataforma de gestión jurídica de última generación: expedientes claros, plazos bajo control y redacción asistida con IA que <strong>cita sus fuentes</strong>.
          </p>
          <ul className="mt-2 grid w-full max-w-xl grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <li className="flex items-start gap-2 rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#0E6B4E]"></span>
              IA con "citar‑primero"
            </li>
            <li className="flex items-start gap-2 rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#0E6B4E]"></span>
              Casos, audiencias y plazos
            </li>
            <li className="flex items-start gap-2 rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#0E6B4E]"></span>
              Documentos y plantillas DOCX/PDF
            </li>
            <li className="flex items-start gap-2 rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-slate-200">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#0E6B4E]"></span>
              Portal del cliente y pagos por paquete
            </li>
          </ul>
        </div>

        {/* Columna derecha: formulario */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
            <h2 className="text-2xl font-semibold text-slate-900">
              {isSignUp ? "Crear despacho" : "Iniciar sesión"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isSignUp ? "Comienza gratis hoy mismo" : "Accede a tu escritorio jurídico"}
            </p>

            {errors.form && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.form}
              </div>
            )}

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
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
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
              </div>

              {isSignUp && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium mb-1">Plan Gratuito incluye:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Gestión básica de casos</li>
                    <li>5 documentos IA por mes</li>
                    <li>1 usuario</li>
                  </ul>
                </div>
              )}

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
                  "Crear cuenta gratis"
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
