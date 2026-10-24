'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  User,
  LayoutDashboard,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, role: currentRole, user: currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, show status & redirect button
  if (currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803D] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sesión Activa</h2>
          <p className="text-xs text-slate-500 mt-1">
            Has iniciado sesión como <span className="font-semibold text-slate-800">{currentUser.email}</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 bg-orange-50 text-[#EA580C]">
            Rol: {currentRole === 'admin' ? 'Administrador / Don Carlos' : 'Cliente Comprador'}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {currentRole === 'admin' ? (
              <button
                onClick={() => router.push('/admin')}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 px-4 rounded font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Ir al Panel de Administración
              </button>
            ) : (
              <button
                onClick={() => router.push('/historial')}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 px-4 rounded font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                Ir a Mis Pedidos
              </button>
            )}
            <Link
              href="/"
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded font-semibold text-xs transition text-center"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile } = await signIn({ email, password });
      
      // Role-based routing configured from Supabase
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center group">
            <span className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              FERRO<span className="text-[#F97316]">MAX</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
              Tu Ferretería de Barrio
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-4">
            Ingreso al Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inicia sesión para gestionar pedidos, retiro en mesón o inventario
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@ferromax.com"
                  required
                  className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Acceso Rápido para Pruebas
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@ferromax.com', 'Admin123*')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 transition text-left group"
              >
                <div className="flex items-center gap-1.5 text-[#EA580C] font-bold text-[11px]">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Cuenta Admin</span>
                </div>
                <span className="text-[10px] text-slate-600 mt-0.5">Don Carlos</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('cliente@ferromax.com', 'Cliente123*')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left group"
              >
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cuenta Cliente</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Comprador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-600">
            ¿No tienes cuenta todavía?{' '}
            <Link
              href="/registro"
              className="font-bold text-[#F97316] hover:underline"
            >
              Crear una cuenta nueva
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
