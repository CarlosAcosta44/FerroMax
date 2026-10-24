'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  Phone,
  Search,
  CheckCircle,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';

export default function HistorialPage() {
  const { user, profile, role, isLoading } = useAuth();
  const [orderQuery, setOrderQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    // Demonstration order lookup result
    setSearchedOrder({
      orderNumber: orderQuery.toUpperCase().trim(),
      date: 'Hoy, hace 25 min',
      totalCop: 145000,
      status: 'ready_for_pickup',
      items: [
        { name: 'Cerradura de Sobreponer Yale', qty: 1, price: 110000 },
        { name: 'Candado de Alta Seguridad 50mm', qty: 1, price: 35000 },
      ],
      pickupPin: '7492',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-[#F97316] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando pedidos de FerroMax...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Mis Pedidos y Retiro en Mesón</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Historial de Compras y Comprobantes
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa el estado de tu pedido para retirar en 30 minutos o seguimiento de factura.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {profile?.fullName?.slice(0, 2).toUpperCase() || 'CL'}
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 truncate">{profile?.fullName || user.email}</p>
                <p className="text-[10px] text-slate-400 capitalize">{role || 'Cliente'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Unauthenticated Banner */}
        {!user && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">¿Tienes una cuenta en FerroMax?</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Inicia sesión para sincronizar automáticamente tus compras, acumular historial y agilizar tus compras en el mostrador.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white px-4 py-2 rounded text-xs font-semibold transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="border border-slate-500 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-semibold transition"
              >
                Registrarme
              </Link>
            </div>
          </div>
        )}

        {/* Quick Order Lookup by Number */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Consultar pedido por número de comprobante o teléfono
          </h2>
          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Ej. FM-2025-001 o tu número de celular..."
                className="w-full rounded bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#F97316] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold transition shrink-0"
            >
              Consultar
            </button>
          </form>

          {/* Searched Demo Result */}
          {searchedOrder && (
            <div className="mt-5 border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    Orden: {searchedOrder.orderNumber}
                  </span>
                  <p className="text-[11px] text-slate-500">{searchedOrder.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Listo para Retiro en Mesón
                  </span>
                  <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                    PIN: {searchedOrder.pickupPin}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                {searchedOrder.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.qty}x {it.name}</span>
                    <span className="font-semibold">${it.price.toLocaleString('es-CO')} COP</span>
                  </div>
                ))}
                <div className="border-t border-emerald-100 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Pagado:</span>
                  <span>${searchedOrder.totalCop.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800 mt-3">
                Acércate a nuestro mostrador en Calle Principal #45-12 y presenta este PIN para entrega inmediata.
              </p>
            </div>
          )}
        </div>

        {/* Back to Catalog */}
        <div className="text-center pt-2">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline"
          >
            <span>Continuar comprando en el catálogo</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
