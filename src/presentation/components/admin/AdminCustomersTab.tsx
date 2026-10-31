'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Smartphone,
} from '@/presentation/components/common/Icons';
import { AdminCustomer } from '@/infrastructure/repositories/SupabaseAdminRepository';
import { recordCustomerAbonoAction } from '@/app/actions/customerActions';

export interface AdminCustomersTabProps {
  customers: AdminCustomer[];
  totalOutstandingCredit: number;
  onCustomerAbonoSuccess: (customerId: string, newBalance: number) => void;
  getInitials: (name?: string, email?: string) => string;
  showToast: (msg: string) => void;
}

export function AdminCustomersTab({
  customers,
  totalOutstandingCredit,
  onCustomerAbonoSuccess,
  getInitials,
  showToast,
}: AdminCustomersTabProps) {
  const [abonoCustomerId, setAbonoCustomerId] = useState<string>(customers[0]?.id || '');
  const [abonoAmount, setAbonoAmount] = useState<number>(50000);
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [isSubmittingAbono, setIsSubmittingAbono] = useState(false);

  const selectedAbonoCustomer = useMemo(
    () => customers.find((c) => c.id === abonoCustomerId) || customers[0],
    [customers, abonoCustomerId]
  );

  const handleRecordAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbonoCustomer || abonoAmount <= 0 || isSubmittingAbono) return;

    setIsSubmittingAbono(true);
    try {
      const res = await recordCustomerAbonoAction({
        customerId: selectedAbonoCustomer.id,
        amountCop: abonoAmount,
        paymentMethod: abonoPaymentMethod,
      });

      if (res.success && res.newBalance !== undefined) {
        onCustomerAbonoSuccess(selectedAbonoCustomer.id, res.newBalance);
        showToast(`Abono de $${abonoAmount.toLocaleString('es-CO')} registrado para ${selectedAbonoCustomer.full_name}`);
        setAbonoAmount(50000);
      } else {
        showToast(res.error || 'Error registrando abono');
      }
    } catch (err) {
      console.error('Error registrando abono:', err);
      showToast('Error de red al registrar abono');
    } finally {
      setIsSubmittingAbono(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Clientes Frecuentes, Maestros y Cuentas Vecinales
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Libreta de créditos (fiado), abonos en mesón y descuentos del Club Ferretero.
          </p>
        </div>
      </div>

      {/* 4 KPIs Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Clientes Registrados
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{customers.length}</h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Maestros y vecinos activos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Saldo en Cuentas Vecinales
            </span>
            <h3 className="text-2xl font-black text-amber-700 mt-1">
              ${totalOutstandingCredit.toLocaleString('es-CO')}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              COP por cobrar (fiado)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Cupo Total Habilitado
            </span>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              ${customers.reduce((sum, c) => sum + (c.credit_limit_cop || 0), 0).toLocaleString('es-CO')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Límite total asignado
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Cuentas con Saldo
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {customers.filter((c) => (c.credit_balance_cop || 0) > 0).length} de {customers.length}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Clientes con fiado pendiente
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Grid 65% / 35% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          {customers.map((c) => {
            const creditPct =
              c.credit_limit_cop > 0
                ? Math.min(100, Math.round((c.credit_balance_cop / c.credit_limit_cop) * 100))
                : 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#EA580C] font-black text-sm flex items-center justify-center shrink-0">
                      {getInitials(c.full_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{c.full_name}</h3>
                        <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#EA580C] text-[10px] font-bold">
                          {c.club_tier}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{c.trade}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{c.phone}</span>
                        <span>•</span>
                        <span>{c.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAbonoCustomerId(c.id);
                        showToast(`Seleccionado para abono: ${c.full_name}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-xs transition"
                    >
                      Registrar Abono
                    </button>
                    {c.phone && (
                      <a
                        href={`https://wa.me/57${c.phone.replace(/\s+/g, '')}?text=Hola%20${encodeURIComponent(c.full_name)},%20te%20saludamos%20de%20FerroMax.%20Tu%20saldo%20actual%20en%20cuenta%20es%20de%20$${c.credit_balance_cop.toLocaleString('es-CO')}%20COP.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Enviar recordatorio WhatsApp"
                      >
                        <Smartphone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Línea de Crédito Utilizada:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${c.credit_balance_cop.toLocaleString('es-CO')} / $
                      {c.credit_limit_cop.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        creditPct > 80
                          ? 'bg-rose-500'
                          : creditPct > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${creditPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Compras acumuladas: ${c.total_purchases_cop.toLocaleString('es-CO')} COP</span>
                    <span>{creditPct}% del cupo asignado</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-5 rounded-xl bg-white shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#F97316]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ficha Rápida de Abono
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[10px] font-bold">
                Caja 01
              </span>
            </div>

            <form onSubmit={handleRecordAbono} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cliente o Maestro:
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#F97316]"
                  value={selectedAbonoCustomer?.id}
                  onChange={(e) => setAbonoCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} (${c.credit_balance_cop.toLocaleString('es-CO')} deudor)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 flex justify-between items-center font-mono">
                <span>Deuda Pendiente:</span>
                <span className="font-bold text-sm">
                  ${selectedAbonoCustomer?.credit_balance_cop.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Monto del Abono (COP):
                </label>
                <input
                  type="number"
                  step={5000}
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Medio de Pago:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAbonoPaymentMethod('efectivo')}
                    className={`py-1.5 text-center rounded-lg border font-bold ${
                      abonoPaymentMethod === 'efectivo'
                        ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoPaymentMethod('transferencia')}
                    className={`py-1.5 text-center rounded-lg border font-bold ${
                      abonoPaymentMethod === 'transferencia'
                        ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Transf.
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoPaymentMethod('tarjeta')}
                    className={`py-1.5 text-center rounded-lg border font-bold ${
                      abonoPaymentMethod === 'tarjeta'
                        ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Tarjeta
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAbono}
                className="w-full py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-slate-400 text-white font-bold transition shadow-sm mt-2 flex items-center justify-center gap-2"
              >
                {isSubmittingAbono ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <span>Registrar Abono en Mesón</span>
                )}
              </button>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-slate-700 text-xs flex flex-col gap-2">
            <span className="font-bold text-[#EA580C] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Reglas de Crédito Vecinal FerroMax:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Pago máximo a 30 días calendario.</li>
              <li>Descuento adicional de 2% por pago antes del día 15.</li>
              <li>Límite de fiado bloqueado automáticamente al superar el cupo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
