'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle,
  Smartphone,
} from '@/presentation/components/common/Icons';
import { AdminOrder } from '@/infrastructure/repositories/SupabaseAdminRepository';

export interface AdminOrdersTabProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, status: 'preparing' | 'ready_for_pickup' | 'delivered') => Promise<void>;
  getInitials: (name?: string, email?: string) => string;
  showToast: (msg: string) => void;
}

export function AdminOrdersTab({
  orders,
  onUpdateOrderStatus,
  getInitials,
  showToast,
}: AdminOrdersTabProps) {
  const [orderFilterStatus, setOrderFilterStatus] = useState<'all' | 'preparing' | 'ready_for_pickup' | 'delivered'>('all');
  const [pinLookup, setPinLookup] = useState('');
  const [pinAlert, setPinAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilterStatus === 'all') return true;
      return o.status === orderFilterStatus;
    });
  }, [orders, orderFilterStatus]);

  const handleDeliverOrderByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinLookup.trim()) return;

    const matched = orders.find(
      (o) =>
        o.pickup_pin === pinLookup.trim() ||
        o.order_number.toLowerCase().includes(pinLookup.toLowerCase().trim())
    );

    if (matched) {
      await onUpdateOrderStatus(matched.id, 'delivered');
      setPinAlert({
        type: 'success',
        msg: `¡Pedido #${matched.order_number} de ${matched.customer_name} validado y entregado!`,
      });
      setPinLookup('');
      setTimeout(() => setPinAlert(null), 4000);
    } else {
      setPinAlert({
        type: 'error',
        msg: 'No se encontró ningún pedido con ese código PIN de retiro.',
      });
      setTimeout(() => setPinAlert(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pedidos Online y Retiro en Mesón
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Click & Collect: valida con PIN de 4 dígitos o QR para entregas inmediatas en mostrador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-[#EA580C] text-xs font-bold border border-orange-200">
            <Clock className="h-3.5 w-3.5" />
            Promedio entrega: 14 min
          </span>
        </div>
      </div>

      {/* Caja de Validación PIN Rápido */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-[#EA580C] p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                Entrega Exprés en Mesón
              </h3>
              <p className="text-orange-100 text-xs">
                Ingresa el PIN de 4 dígitos que el cliente recibió por WhatsApp o correo.
              </p>
            </div>
          </div>

          <form onSubmit={handleDeliverOrderByPin} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={8}
              placeholder="Ej: 7492 o FM-001"
              value={pinLookup}
              onChange={(e) => setPinLookup(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400 placeholder:font-sans"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow transition active:scale-95"
            >
              Validar PIN
            </button>
          </form>
        </div>

        {pinAlert && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              pinAlert.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>{pinAlert.msg}</span>
          </div>
        )}
      </div>

      {/* Tabs de Filtro de Pedidos */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setOrderFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            orderFilterStatus === 'all'
              ? 'bg-[#F97316] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todos ({orders.length})
        </button>
        <button
          onClick={() => setOrderFilterStatus('preparing')}
          className={`px-3 py-1.5 rounded-lg transition ${
            orderFilterStatus === 'preparing'
              ? 'bg-[#F97316] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Por Empacar
        </button>
        <button
          onClick={() => setOrderFilterStatus('ready_for_pickup')}
          className={`px-3 py-1.5 rounded-lg transition ${
            orderFilterStatus === 'ready_for_pickup'
              ? 'bg-[#F97316] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Listos para Retiro
        </button>
        <button
          onClick={() => setOrderFilterStatus('delivered')}
          className={`px-3 py-1.5 rounded-lg transition ${
            orderFilterStatus === 'delivered'
              ? 'bg-[#F97316] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Entregados
        </button>
      </div>

      {/* Lista de Pedidos Click & Collect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-800">
                  #{ord.order_number}
                </span>
                {ord.status === 'ready_for_pickup' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Listo para Retiro
                  </span>
                )}
                {ord.status === 'preparing' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                    Por Empacar
                  </span>
                )}
                {ord.status === 'delivered' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Entregado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center shrink-0">
                  {getInitials(ord.customer_name)}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    {ord.customer_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {ord.customer_phone}
                  </span>
                </div>
              </div>

              <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                <p className="text-slate-700 font-medium leading-relaxed">
                  {ord.items_summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>PIN Retiro:</span>
                <span className="font-mono font-bold text-slate-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                  {ord.pickup_pin}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">Total Pedido</span>
                <span className="font-mono font-black text-sm text-[#F97316]">
                  ${ord.total_cop.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="flex items-center gap-2">
                {ord.customer_phone && (
                  <a
                    href={`https://wa.me/57${ord.customer_phone.replace(/\s+/g, '')}?text=Hola%20${encodeURIComponent(ord.customer_name)},%20tu%20pedido%20%23${ord.order_number}%20en%20FerroMax%20ya%20está%20listo%20con%20el%20PIN%20${ord.pickup_pin}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                    title="Notificar por WhatsApp"
                  >
                    <Smartphone className="h-4 w-4" />
                  </a>
                )}

                {ord.status === 'preparing' && (
                  <button
                    onClick={() => onUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                    className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-xs transition"
                  >
                    Marcar Listo
                  </button>
                )}

                {ord.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => onUpdateOrderStatus(ord.id, 'delivered')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Entregar en Mesón
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
