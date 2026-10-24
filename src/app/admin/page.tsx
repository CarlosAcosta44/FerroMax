'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  LogOut,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle,
} from '@/presentation/components/common/Icons';
import { useAuth } from '@/presentation/context/AuthContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, profile, role, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders'>('overview');

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-3 border-[#F97316] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verificando permisos de Don Carlos...</p>
        </div>
      </div>
    );
  }

  // Role Gate: if not authenticated or not admin, show guard view
  if (!user || role !== 'admin') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso Exclusivo de Administrador
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Esta sección está reservada para Don Carlos y el personal administrativo de FerroMax.
            {user ? (
              <span className="block mt-2 font-medium text-slate-700">
                Tu cuenta actual (<span className="text-slate-900 font-semibold">{user.email}</span>) tiene rol de{' '}
                <span className="text-slate-900 font-semibold uppercase">{role || 'Cliente'}</span>.
              </span>
            ) : (
              <span className="block mt-2 font-medium text-slate-700">
                Debes iniciar sesión con una cuenta de rol Administrador.
              </span>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 px-4 rounded font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <User className="h-4 w-4" />
              <span>Iniciar Sesión como Administrador</span>
            </Link>

            <Link
              href="/"
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded font-semibold text-xs transition"
            >
              Volver a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar: Deep Slate #0F172A matching DESIGN.md & Admin reference */}
      <aside className="w-full lg:w-64 bg-[#0F172A] border-r border-slate-800 p-5 shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand Name - FerroMax (replacing 'El Maestro') */}
          <div className="pb-5 border-b border-slate-800">
            <Link href="/" className="flex flex-col group">
              <span className="text-xl font-black tracking-tight text-white leading-none">
                FERRO<span className="text-[#F97316]">MAX</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#F97316] uppercase mt-1">
                Panel de Administración
              </span>
            </Link>
          </div>

          {/* Don Carlos User Card */}
          <div className="my-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white font-bold text-xs shadow">
              DC
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate leading-tight">
                {profile?.fullName || 'Don Carlos'}
              </span>
              <span className="text-slate-400 text-[10px] truncate">
                Dueño / Administrador
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition text-left ${
                activeTab === 'overview'
                  ? 'bg-[#F97316] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Resumen General</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition text-left ${
                activeTab === 'inventory'
                  ? 'bg-[#F97316] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Inventario y Precios</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition text-left ${
                activeTab === 'orders'
                  ? 'bg-[#F97316] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Pedidos & Retiro en Mesón</span>
            </button>

            <Link
              href="/catalogo"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <ShoppingCart className="h-4 w-4 text-slate-400" />
              <span>Ver Tienda Pública</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-orange-100 text-[#EA580C] text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-3 w-3" />
              Rol Activo: Administrador
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Control Operativo FerroMax
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión unificada de ventas en mostrador, inventario físico y retiros Click & Collect.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Caja Abierta (Turno Mañana)
            </span>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Ventas de Hoy</span>
              <span className="text-emerald-600 font-bold">+18% vs ayer</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              $1,485,000 <span className="text-xs font-normal text-slate-500">COP</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">14 transacciones completadas</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Retiros en Mesón</span>
              <span className="bg-orange-100 text-[#EA580C] text-[10px] font-bold px-1.5 py-0.5 rounded">
                Pendientes
              </span>
            </div>
            <p className="text-2xl font-black text-[#F97316] mt-2 tracking-tight">
              3 <span className="text-xs font-normal text-slate-500">pedidos</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Tiempo promedio de entrega: 22 min</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Stock Crítico</span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Alerta
              </span>
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2 tracking-tight">
              2 <span className="text-xs font-normal text-slate-500">SKUs</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Cinta Teﬂón y Tubo PVC 1/2"</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">Clientes Activos</span>
              <span className="text-slate-400">Total</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              128 <span className="text-xs font-normal text-slate-500">registrados</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">8 pedidos recurrentes esta semana</p>
          </div>
        </div>

        {/* Orders in Preparation / Ready for Pickup Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Cola de Retiro en Tienda (Click & Collect)
              </h2>
              <p className="text-xs text-slate-500">
                Clientes que vienen a reclamar en el mostrador en menos de 30 minutos
              </p>
            </div>
            <span className="text-xs text-slate-500">Actualizado hace un instante</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nº Orden</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Productos</th>
                  <th className="py-2.5 px-3">Total COP</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">FM-2025-001</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">Juan Carlos Pérez</p>
                    <p className="text-[11px] text-slate-400">310 987 6543</p>
                  </td>
                  <td className="py-3 px-3">Taladro DeWalt 20V + Brocas (2 items)</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">$395,000</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle className="h-3 w-3" />
                      Listo para Retiro
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="bg-[#F97316] hover:bg-[#EA580C] text-white px-3 py-1 rounded text-[11px] font-bold transition">
                      Entregar en Mesón
                    </button>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">FM-2025-002</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">Construcciones del Valle</p>
                    <p className="text-[11px] text-slate-400">301 223 4455</p>
                  </td>
                  <td className="py-3 px-3">Caja Tornillos Drywall 6x1 (500 und) + Cinta Teﬂón</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">$45,000</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="h-3 w-3" />
                      Empacando en Bodega
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded text-[11px] font-semibold transition">
                      Marcar Listo
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
