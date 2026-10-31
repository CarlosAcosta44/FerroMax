'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle,
  Smartphone,
  Truck,
  Store,
  MapPin,
  Search,
  Package,
  AlertCircle,
  Phone,
} from '@/presentation/components/common/Icons';
import { AdminOrder } from '@/infrastructure/repositories/SupabaseAdminRepository';

export interface AdminOrdersTabProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (
    orderId: string,
    status: 'preparing' | 'ready_for_pickup' | 'delivered'
  ) => Promise<void>;
  getInitials: (name?: string, email?: string) => string;
  showToast: (msg: string) => void;
}

export function AdminOrdersTab({
  orders,
  onUpdateOrderStatus,
  getInitials,
  showToast,
}: AdminOrdersTabProps) {
  // Active delivery section filter: 'all' | 'delivery' | 'pickup'
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparing' | 'ready_for_pickup' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinLookup, setPinLookup] = useState('');
  const [pinAlert, setPinAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Filter only web/online orders (or all non-pos orders)
  const webOrders = useMemo(() => {
    return orders.filter((o) => o.channel === 'web' || !o.order_number.startsWith('POS-'));
  }, [orders]);

  // Derived metrics
  const pendingDeliveries = useMemo(
    () => webOrders.filter((o) => o.delivery_type === 'delivery' && o.status !== 'delivered'),
    [webOrders]
  );

  const pendingPickups = useMemo(
    () => webOrders.filter((o) => o.delivery_type === 'pickup' && o.status !== 'delivered'),
    [webOrders]
  );

  const totalWebRevenue = useMemo(
    () => webOrders.reduce((sum, o) => sum + o.total_cop, 0),
    [webOrders]
  );

  // Filtered list
  const filteredOrders = useMemo(() => {
    return webOrders.filter((o) => {
      // 1. Delivery Type Filter
      if (deliveryFilter === 'delivery' && o.delivery_type !== 'delivery') return false;
      if (deliveryFilter === 'pickup' && o.delivery_type !== 'pickup') return false;

      // 2. Status Filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = o.order_number.toLowerCase().includes(q);
        const matchName = o.customer_name.toLowerCase().includes(q);
        const matchPhone = o.customer_phone.includes(q);
        const matchPin = o.pickup_pin?.includes(q);
        const matchAddress = o.delivery_address?.toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchPhone && !matchPin && !matchAddress) return false;
      }

      return true;
    });
  }, [webOrders, deliveryFilter, statusFilter, searchQuery]);

  const handleDeliverOrderByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinLookup.trim()) return;

    const matched = webOrders.find(
      (o) =>
        o.pickup_pin === pinLookup.trim() ||
        o.order_number.toLowerCase().includes(pinLookup.toLowerCase().trim())
    );

    if (matched) {
      await onUpdateOrderStatus(matched.id, 'delivered');
      setPinAlert({
        type: 'success',
        msg: `¡Pedido #${matched.order_number} de ${matched.customer_name} validado y entregado con éxito!`,
      });
      setPinLookup('');
      showToast(`Pedido #${matched.order_number} entregado`);
      setTimeout(() => setPinAlert(null), 4000);
    } else {
      setPinAlert({
        type: 'error',
        msg: 'No se encontró ningún pedido pendiente con ese código PIN de retiro.',
      });
      setTimeout(() => setPinAlert(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Compras en Línea y Despachos Web</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EA580C] border border-orange-200">
              Canal E-commerce
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Gestión centralizada de compras en línea: Domicilios locales a coordinar y Retiros en Tienda (Click & Collect).
          </p>
        </div>
      </div>

      {/* 4 KPIs de Compras en Línea */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Pedidos Web Totales
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{webOrders.length}</h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Canal digital activo
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Domicilios Pendientes
            </span>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              {pendingDeliveries.length}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Por alistar o en camino
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#EA580C] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Retiro en Mesón Pendientes
            </span>
            <h3 className="text-2xl font-black text-[#EA580C] mt-1">
              {pendingPickups.length}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              ¡Ahorro de flete ($0)!
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Facturación Online
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ${totalWebRevenue.toLocaleString('es-CO')}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Total pedidos web COP
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            $
          </div>
        </div>
      </div>

      {/* Caja Destacada: Validador de PIN para Retiro en Mesón */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316] shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight leading-snug">
                  Mesón de Entrega Click & Collect
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  Entrega Rápida
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Valida el PIN de 4 dígitos para los clientes que compraron en línea y vinieron a retirar a la tienda para ahorrar el envío.
              </p>
            </div>
          </div>

          <form onSubmit={handleDeliverOrderByPin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            <input
              type="text"
              maxLength={10}
              placeholder="Ingresa PIN (ej. 7492) o # orden"
              value={pinLookup}
              onChange={(e) => setPinLookup(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#F97316] placeholder:text-slate-400 placeholder:font-sans w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer text-center"
            >
              Validar y Entregar
            </button>
          </form>
        </div>

        {pinAlert && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              pinAlert.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{pinAlert.msg}</span>
          </div>
        )}
      </div>

      {/* Barra de Filtros Operativos: Modalidad (Domicilio vs Mesón) y Estados */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Selector de Modalidad */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setDeliveryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              deliveryFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({webOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setDeliveryFilter('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              deliveryFilter === 'delivery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Domicilios ({webOrders.filter((o) => o.delivery_type === 'delivery').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryFilter('pickup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              deliveryFilter === 'pickup'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#EA580C]'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Retiro Mesón ({webOrders.filter((o) => o.delivery_type === 'pickup').length})</span>
          </button>
        </div>

        {/* Buscador Rápido de Pedidos */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, # orden o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto">
          {(['all', 'preparing', 'ready_for_pickup', 'delivered'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-lg transition shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' && 'Todos'}
              {st === 'preparing' && 'Por Empacar'}
              {st === 'ready_for_pickup' && 'En Ruta / Listos'}
              {st === 'delivered' && 'Entregados'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas de Pedidos Web */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((ord) => {
          const isDelivery = ord.delivery_type === 'delivery';

          return (
            <div
              key={ord.id}
              className={`bg-white rounded-xl border shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition ${
                isDelivery ? 'border-emerald-200/80' : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Header Card: Order Number, Channel Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900">
                      #{ord.order_number}
                    </span>
                    {isDelivery ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Domicilio
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[10px] font-bold border border-orange-200 flex items-center gap-1">
                        <Store className="h-3 w-3" /> Retiro Mesón
                      </span>
                    )}
                  </div>

                  <div>
                    {ord.status === 'preparing' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        Por Empacar
                      </span>
                    )}
                    {ord.status === 'ready_for_pickup' && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
                        {isDelivery ? 'En Ruta' : 'Listo para Retiro'}
                      </span>
                    )}
                    {ord.status === 'delivered' && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Entregado
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(ord.customer_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {ord.customer_name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {ord.customer_phone || 'Sin celular'}
                    </span>
                  </div>
                </div>

                {/* Address Box (Highlight if Delivery) */}
                {isDelivery ? (
                  <div className="my-2.5 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs">
                    <div className="flex items-start gap-1.5 text-emerald-950 font-bold mb-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{ord.delivery_address || 'Dirección no especificada'}</span>
                    </div>
                    {ord.customer_notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                        {ord.customer_notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="my-2.5 p-2.5 bg-orange-50/50 rounded-lg border border-orange-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#EA580C] block">PIN Retiro Mesón:</span>
                      <span className="text-[10px] text-slate-500">Calle Principal #45-12</span>
                    </div>
                    <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-md border border-orange-200 shadow-2xs">
                      {ord.pickup_pin || '0000'}
                    </span>
                  </div>
                )}

                {/* Items Summary */}
                <div className="my-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                  <p className="text-slate-700 font-medium leading-relaxed line-clamp-3">
                    {ord.items_summary}
                  </p>
                </div>
              </div>

              {/* Card Footer: Total & Operational Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total con IVA</span>
                  <span className="font-mono font-black text-sm text-[#F97316]">
                    ${ord.total_cop.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* WhatsApp Quick Notification */}
                  {ord.customer_phone && (
                    <a
                      href={`https://wa.me/57${ord.customer_phone.replace(/\s+/g, '')}?text=${encodeURIComponent(
                        isDelivery
                          ? `Hola ${ord.customer_name}, te saludamos de FerroMax. Tu pedido #${ord.order_number} está siendo preparado para despacho a ${ord.delivery_address}.`
                          : `Hola ${ord.customer_name}, tu pedido #${ord.order_number} en FerroMax ya está listo para retiro en mesón con el PIN ${ord.pickup_pin}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                      title="Contactar al cliente por WhatsApp"
                    >
                      <Smartphone className="h-4 w-4" />
                    </a>
                  )}

                  {/* Actions by status */}
                  {ord.status === 'preparing' && (
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                      className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition"
                    >
                      {isDelivery ? 'Despachar' : 'Marcar Listo'}
                    </button>
                  )}

                  {ord.status === 'ready_for_pickup' && (
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'delivered')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      {isDelivery ? 'Entregado a Domicilio' : 'Entregar en Mesón'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center space-y-2">
            <Package className="h-10 w-10 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron pedidos web</h4>
            <p className="text-xs text-slate-400">
              Prueba cambiando los filtros de entrega o limpiando el buscador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
