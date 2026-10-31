'use client';

import React from 'react';
import {
  Package,
  Store,
  CreditCard,
  AlertCircle,
  Receipt,
  ChevronRight,
  MapPin,
} from '@/presentation/components/common/Icons';
import { AdminProduct, AdminOrder } from '@/infrastructure/repositories/SupabaseAdminRepository';

export interface AdminDashboardTabProps {
  products: AdminProduct[];
  orders: AdminOrder[];
  criticalStockCount: number;
  outOfStockCount: number;
  onNavigateTab: (tab: 'dashboard' | 'inventory' | 'pos' | 'orders' | 'customers' | 'cash') => void;
  getInitials: (name?: string, email?: string) => string;
}

export function AdminDashboardTab({
  products,
  orders,
  criticalStockCount,
  outOfStockCount,
  onNavigateTab,
  getInitials,
}: AdminDashboardTabProps) {
  // Real sales calculations from orders
  const todayStr = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.created_at).toDateString() === todayStr);
  const totalSalesToday = todaysOrders.reduce((sum, o) => sum + o.total_cop, 0);

  // Critical stock names
  const criticalItemNames = products
    .filter((p) => p.status === 'low' || p.status === 'out')
    .slice(0, 4)
    .map((p) => p.name)
    .join(', ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316] font-mono">
              FerroMax • Ferretería de Barrio
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Atención a Vecinos y Maestros</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Panel Principal de Administración
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Monitoreo en tiempo real de caja, inventario en estantes y pedidos locales sincronizados con base de datos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('cash')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-sm hover:shadow transition-all"
          >
            <Receipt className="h-4 w-4" />
            <span>Cierre de Caja del Día</span>
          </button>
        </div>
      </div>

      {/* 3 Tarjetas KPI Superiores basadas en datos reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ventas Totales Hoy
              </span>
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-[#F97316]">
                <Store className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                ${totalSalesToday.toLocaleString('es-CO')}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">COP</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{todaysOrders.length} boletas registradas hoy</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Base de Datos Sincronizada
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Productos por Reponer
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#B45309] tracking-tight">
                {criticalStockCount + outOfStockCount}
              </span>
              <span className="text-sm font-bold text-amber-700">artículos críticos</span>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-[#FEF3C7] text-[#B45309] border border-amber-200/80 text-xs flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Alerta de inventario en tienda:
            </span>
            <p className="text-[11px] leading-tight text-amber-900 font-medium line-clamp-2">
              {criticalItemNames || 'Todos los productos tienen existencias suficientes.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Productos en Catálogo
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {products.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">ítems activos</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Catálogo Web & Mesón en Vivo
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Sincronizado con PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Tabla 1: Estado General de Inventario (Solo Visualización) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#F97316]" />
              Estado General de Inventario de Tienda
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Visualización del stock físico en tiempo real. Para editar existencias y precios dirígete a la pestaña &quot;Inventario y Precios&quot;.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ir a editar inventario ({products.length} productos)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <th className="py-2.5 px-4 rounded-l-lg">Producto</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4">Ubicación</th>
                <th className="py-2.5 px-4">Precio Venta (COP)</th>
                <th className="py-2.5 px-4 text-center">Stock Actual</th>
                <th className="py-2.5 px-4 text-right rounded-r-lg">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 8).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#EA580C]" />
                      {item.aisle}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    ${item.price_cop.toLocaleString('es-CO')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {item.stock_quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.status === 'ok' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Normal
                      </span>
                    )}
                    {item.status === 'low' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Bajo Stock
                      </span>
                    )}
                    {item.status === 'out' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Agotado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Últimas Compras y Boletas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#F97316]" />
              <h2 className="text-base font-bold text-slate-900">
                Últimas Compras y Boletas
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Boletas generadas en terminal POS o pedidos web recibidos.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver todos los pedidos ({orders.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              <Receipt className="h-7 w-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Aún no hay compras registradas en el sistema.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Las ventas realizadas en mostrador (POS) o por catálogo se reflejarán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                  <th className="py-2.5 px-4 rounded-l-lg">Cliente</th>
                  <th className="py-2.5 px-4">N° de Boleta</th>
                  <th className="py-2.5 px-4">Medio de Pago</th>
                  <th className="py-2.5 px-4">Total Pagado</th>
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4 text-right rounded-r-lg">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {getInitials(order.customer_name)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">
                            {order.customer_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {order.items_summary}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      #{order.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 text-slate-700 capitalize">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span>{order.payment_method}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ${order.total_cop.toLocaleString('es-CO')} COP
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        {order.status === 'delivered' ? 'Entregado' : 'Listo para Retiro'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
