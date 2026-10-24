'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Wrench, Phone, Clock, User } from '@/presentation/components/common/Icons';
import { useCart } from '@/presentation/context/CartContext';

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();

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
            <Link
              href="/historial"
              className="text-slate-400 transition hover:text-[#F97316]"
            >
              Consultar mi pedido
            </Link>
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
        {/* Brand Logo - Clean, without "EN VIVO" badge */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F97316] text-white shadow-md shadow-orange-500/20 transition group-hover:bg-[#EA580C]">
            <Wrench className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white leading-none">
              FERRO<span className="text-[#F97316]">MAX</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
              Tu Ferretería de Barrio
            </span>
          </div>
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

        {/* Action Buttons: Profile Icon & Cart (Search removed as requested) */}
        <div className="flex items-center gap-3">
          {/* User / Profile Icon */}
          <Link
            href="/historial"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:border-[#F97316]/60 hover:bg-slate-800 hover:text-white"
            aria-label="Mi Perfil / Mis Pedidos"
            title="Mi Perfil / Mis Pedidos"
          >
            <User className="h-5 w-5 text-slate-300" />
          </Link>

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
