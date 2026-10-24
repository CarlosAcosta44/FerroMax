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
  AlertCircle,
  User,
  Phone,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      // All new accounts are automatically created with 'cliente' role.
      // Roles are managed directly in Supabase.
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role: 'cliente',
      });

      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la cuenta. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
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
            Crear Cuenta de Usuario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Regístrate para comprar en línea con retiro en mesón en 30 minutos
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
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                  className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Para notificarte cuando tu pedido esté empacado y listo para retiro en mesón.
              </p>
            </div>

            {/* Password & Confirm Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className="w-full rounded bg-white border border-slate-300 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] focus:outline-none transition"
                  />
                </div>
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
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarme en FerroMax</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link to Login */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-600">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link
              href="/login"
              className="font-bold text-[#F97316] hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
