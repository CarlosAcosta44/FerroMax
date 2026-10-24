'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Wrench, Search, Phone, Clock } from '@/presentation/components/common/Icons';
import { useCart } from '@/presentation/context/CartContext';

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      {/* Top Bar for Hours & Contact */}
      <div className="hidden border-b border-zinc-800/60 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Lunes a Sábado: 7:30 AM – 6:30 PM | Domingos: 8:30 AM – 2:00 PM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/historial"
              className="text-zinc-400 transition hover:text-amber-400"
            >
              Consultar mi pedido
            </Link>
            <span className="text-zinc-600">|</span>
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              <Phone className="h-3 w-3" />
              Atención WhatsApp: 300 123 4567
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
            <Wrench className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">
                FERRO<span className="text-amber-500">MAX</span>
              </span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                EN VIVO
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
              Ferretería & Herramientas
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/catalogo" className="transition hover:text-amber-400">
            Catálogo Completo
          </Link>
          <Link href="/catalogo?categoria=herramientas-electricas" className="transition hover:text-amber-400">
            Eléctricas
          </Link>
          <Link href="/catalogo?categoria=herramientas-manuales" className="transition hover:text-amber-400">
            Manuales
          </Link>
          <Link href="/catalogo?categoria=pinturas-adhesivos" className="transition hover:text-amber-400">
            Pinturas
          </Link>
          <Link href="/catalogo?categoria=plomeria-griferia" className="transition hover:text-amber-400">
            Plomería
          </Link>
        </nav>

        {/* Action Buttons: Search & Cart */}
        <div className="flex items-center gap-3">
          <Link
            href="/catalogo"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar producto...</span>
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:border-amber-500/50 hover:bg-zinc-800"
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-5 w-5 text-amber-500" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-zinc-950 shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
