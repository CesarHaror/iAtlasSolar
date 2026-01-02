import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sun, Loader2, Zap, BarChart3, Brain, CheckCircle2 } from 'lucide-react';
import { useLogin } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mejorado */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">iAtlas Solar</h1>
              <p className="text-sm text-blue-600 font-medium">Powered by AI</p>
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido de vuelta</h2>
            <p className="text-gray-600 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Correo electrónico
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="tu@email.com"
                className={cn(
                  'form-input',
                  errors.email && 'border-red-500 focus:ring-red-500'
                )}
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  className={cn(
                    'form-input pr-10',
                    errors.password && 'border-red-500 focus:ring-red-500'
                  )}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            ¿Problemas para acceder?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contactar soporte
            </a>
          </p>
        </div>
      </div>

      {/* Panel derecho - Branding con IA */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 items-center justify-center relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full -ml-48 -mb-48 blur-3xl"></div>

        <div className="max-w-lg text-white relative z-10">
          {/* Encabezado con IA */}
          <div className="mb-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Brain className="w-5 h-5 text-blue-300" />
            <span className="text-sm font-medium text-blue-100">Inteligencia Artificial Avanzada</span>
          </div>

          <h2 className="text-4xl font-bold mb-6">
            Potencia tu negocio solar con IA
          </h2>
          
          <p className="text-xl text-blue-100 mb-10">
            Sistema de cotización inteligente que optimiza cálculos solares con 
            precisión usando tecnología de Inteligencia Artificial.
          </p>
          
          {/* Características principales */}
          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/20">
                <Brain className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Cálculos Optimizados por IA</h3>
                <p className="text-blue-100 text-sm">Algoritmos inteligentes que predicen producción solar con precisión del 99%</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/20">
                <Zap className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Automatización Inteligente</h3>
                <p className="text-blue-100 text-sm">Genera cotizaciones profesionales en segundos sin cálculos manuales</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/20">
                <BarChart3 className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Análisis de ROI Inteligente</h3>
                <p className="text-blue-100 text-sm">Proyecciones financieras precisas y análisis de rentabilidad en tiempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors border border-white/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PDFs Profesionales Automáticos</h3>
                <p className="text-blue-100 text-sm">Reportes personalizados generados automáticamente con datos validados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}