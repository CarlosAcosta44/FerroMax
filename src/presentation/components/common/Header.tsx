'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Phone,
  Clock,
  User,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  ChevronDown,
  ShieldCheck,
} from '@/presentation/components/common/Icons';
import { useCart } from '@/presentation/context/CartContext';
import { useAuth } from '@/presentation/context/AuthContext';

export function Header() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, profile, role, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  // Rule of Hooks: early return MUST be placed AFTER all hooks have executed unconditionally
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0F172A]">
      {/* Top Bar for Hours & WhatsApp */}
      <div className="hidden border-b border-slate-800/60 bg-slate-950/40 px-4 py-1.5 text-xs text-slate-400 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#F97316]" />
              Lunes a Sábado: 7:30 AM – 6:30 PM | Domingos: 8:30 AM – 2:00 PM
            </span>
          </div>
          <div className="flex items-center gap-4">
            {role === 'admin' ? (
              <Link
                href="/admin"
                className="flex items-center gap-1 text-[#F97316] font-medium transition hover:text-orange-400"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Panel de Administración
              </Link>
            ) : (
              <Link
                href="/historial"
                className="text-slate-400 transition hover:text-[#F97316]"
              >
                Consultar mi pedido
              </Link>
            )}
            <span className="text-slate-600">|</span>
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-medium text-[#25D366] transition hover:text-emerald-300"
            >
              <Phone className="h-3.5 w-3.5" />
              Atención WhatsApp: 300 123 4567
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo - Pure typography */}
        <Link href="/" className="flex flex-col group py-0.5">
          <span className="text-2xl font-black tracking-tight text-white leading-none transition-colors group-hover:text-slate-100">
            FERRO<span className="text-[#F97316]">MAX</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
            Tu Ferretería de Barrio
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
          <Link href="/catalogo" className="transition hover:text-[#F97316]">
            Catálogo Completo
          </Link>
          <Link href="/catalogo?categoria=herramientas-electricas" className="transition hover:text-[#F97316]">
            Eléctricas
          </Link>
          <Link href="/catalogo?categoria=herramientas-manuales" className="transition hover:text-[#F97316]">
            Manuales
          </Link>
          <Link href="/catalogo?categoria=plomeria-griferia" className="transition hover:text-[#F97316]">
            Plomería
          </Link>
          <Link href="/catalogo?categoria=electricidad-iluminacion" className="transition hover:text-[#F97316]">
            Electricidad
          </Link>
          <Link href="/catalogo?categoria=pinturas-adhesivos" className="transition hover:text-[#F97316]">
            Pinturas
          </Link>
        </nav>

        {/* Action Buttons: User / Profile & Cart */}
        <div className="flex items-center gap-3">
          {/* User Auth Menu */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-slate-200 transition hover:border-[#F97316]/60 hover:bg-slate-800 focus:outline-none"
                aria-label="Menú de usuario"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                    role === 'admin'
                      ? 'bg-gradient-to-tr from-[#EA580C] to-[#F97316]'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {getInitials(profile?.fullName, user.email)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[110px] truncate text-xs font-semibold text-slate-200 leading-tight">
                    {profile?.fullName || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] font-medium text-[#F97316] leading-none mt-0.5">
                    {role === 'admin' ? 'Admin' : 'Cliente'}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-[#F97316]/60 hover:bg-slate-800 hover:text-white"
                title="Iniciar Sesión o Registrarse"
              >
                <User className="h-4 w-4 text-slate-300" />
                <span className="hidden sm:inline">Ingresar</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {user && isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#0F172A] p-2 text-slate-200 shadow-2xl z-50">
                {/* User Info Header */}
                <div className="border-b border-slate-800 px-3 py-2.5">
                  <p className="text-sm font-bold text-white truncate">
                    {profile?.fullName || 'Usuario FerroMax'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#F97316]/15 border border-[#F97316]/40 px-2 py-0.5 text-[11px] font-bold text-[#F97316]">
                        <ShieldCheck className="h-3 w-3" />
                        Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        Cliente FerroMax
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-1 text-xs">
                  {role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-200 hover:bg-slate-800/90 hover:text-[#F97316] transition"
                    >
                      <LayoutDashboard className="h-4 w-4 text-[#F97316]" />
                      <span>Panel de Administración</span>
                    </Link>
                  )}
                  <Link
                    href="/historial"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-200 hover:bg-slate-800/90 hover:text-white transition"
                  >
                    <ShoppingBag className="h-4 w-4 text-slate-400" />
                    <span>Mis Pedidos & Comprobantes</span>
                  </Link>
                  <Link
                    href="/catalogo"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-200 hover:bg-slate-800/90 hover:text-white transition"
                  >
                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                    <span>Explorar Catálogo</span>
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:border-[#F97316]/60 hover:bg-slate-800"
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-5 w-5 text-[#F97316]" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
