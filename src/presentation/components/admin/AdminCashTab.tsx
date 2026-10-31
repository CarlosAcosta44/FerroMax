'use client';

import React, { useState, useMemo } from 'react';
import {
  Save,
  DollarSign,
  Coins,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from '@/presentation/components/common/Icons';
import { CashShift, AdminOrder } from '@/infrastructure/repositories/SupabaseAdminRepository';

export interface AdminCashTabProps {
  cashShift: CashShift | null;
  orders?: AdminOrder[];
  expectedCashInDrawer?: number;
  onSaveShift: (denominations: Record<string, number>, countedTotal: number) => Promise<void>;
  showToast: (msg: string) => void;
}

const BILLETES_COLOMBIA = [
  { denom: '100000', label: '$100.000', sub: 'Billete Verde (Valle de Cocora)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { denom: '50000', label: '$50.000', sub: 'Billete Morado (Gabo)', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  { denom: '20000', label: '$20.000', sub: 'Billete Naranja (Alfonso López)', badge: 'bg-orange-50 text-orange-800 border-orange-200' },
  { denom: '10000', label: '$10.000', sub: 'Billete Rojo (Virginia Gutiérrez)', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
  { denom: '5000', label: '$5.000', sub: 'Billete Café (José Asunción Silva)', badge: 'bg-amber-50 text-amber-900 border-amber-200' },
  { denom: '2000', label: '$2.000', sub: 'Billete Celeste (Débora Arango)', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
];

const MONEDAS_COLOMBIA = [
  { denom: '1000', label: '$1.000', sub: 'Moneda Bicolor (Tortuga)', badge: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
  { denom: '500', label: '$500', sub: 'Moneda Bicolor (Rana de Cristal)', badge: 'bg-teal-50 text-teal-900 border-teal-200' },
  { denom: '200', label: '$200', sub: 'Moneda Dorada (Guacamaya)', badge: 'bg-amber-50 text-amber-900 border-amber-200' },
  { denom: '100', label: '$100', sub: 'Moneda Plateada (Frailejón)', badge: 'bg-slate-100 text-slate-800 border-slate-300' },
  { denom: '50', label: '$50', sub: 'Moneda Pequeña (Oso de Anteojos)', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
];

export function AdminCashTab({
  cashShift,
  orders = [],
  expectedCashInDrawer,
  onSaveShift,
  showToast,
}: AdminCashTabProps) {
  const [cashDenominations, setCashDenominations] = useState<{ [key: string]: number }>(
    cashShift?.denominations || {
      '100000': 4,
      '50000': 10,
      '20000': 15,
      '10000': 20,
      '5000': 15,
      '2000': 20,
      '1000': 30,
      '500': 40,
      '200': 50,
      '100': 60,
      '50': 20,
    }
  );

  const setDenominationDirectQty = (denom: string, qty: number) => {
    setCashDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, qty),
    }));
  };

  const alterDenominationQty = (denom: string, delta: number) => {
    setCashDenominations((prev) => {
      const current = prev[denom] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [denom]: next };
    });
  };

  // Subtotales separados para Billetes y Monedas
  const subtotalBilletes = useMemo(() => {
    return BILLETES_COLOMBIA.reduce((sum, b) => {
      const qty = cashDenominations[b.denom] || 0;
      return sum + parseInt(b.denom, 10) * qty;
    }, 0);
  }, [cashDenominations]);

  const subtotalMonedas = useMemo(() => {
    return MONEDAS_COLOMBIA.reduce((sum, m) => {
      const qty = cashDenominations[m.denom] || 0;
      return sum + parseInt(m.denom, 10) * qty;
    }, 0);
  }, [cashDenominations]);

  const totalCashCounted = subtotalBilletes + subtotalMonedas;

  // Cálculos en vivo conectados con las ventas reales del día
  const todayStr = new Date().toDateString();
  const todaysOrders = useMemo(
    () => orders.filter((o) => new Date(o.created_at).toDateString() === todayStr),
    [orders, todayStr]
  );

  const initialCash = cashShift?.initial_cash_cop ?? 200000;

  const cashSales = useMemo(
    () =>
      todaysOrders
        .filter((o) => o.payment_method === 'efectivo')
        .reduce((sum, o) => sum + o.total_cop, 0),
    [todaysOrders]
  );

  const cardSales = useMemo(
    () =>
      todaysOrders
        .filter(
          (o) =>
            o.payment_method === 'tarjeta' ||
            o.payment_method === 'credit_card' ||
            o.payment_method === 'debit_card'
        )
        .reduce((sum, o) => sum + o.total_cop, 0),
    [todaysOrders]
  );

  const qrSales = useMemo(
    () =>
      todaysOrders
        .filter(
          (o) =>
            o.payment_method === 'qr' ||
            o.payment_method === 'transferencia' ||
            o.payment_method === 'pse'
        )
        .reduce((sum, o) => sum + o.total_cop, 0),
    [todaysOrders]
  );

  const creditSales = useMemo(
    () =>
      todaysOrders
        .filter((o) => o.payment_method === 'fiado')
        .reduce((sum, o) => sum + o.total_cop, 0),
    [todaysOrders]
  );

  // El efectivo esperado en la gaveta es: Fondo inicial + Ventas en efectivo cobradas hoy
  const effectiveExpectedCash = expectedCashInDrawer ?? (initialCash + cashSales);
  const cashDifference = totalCashCounted - effectiveExpectedCash;

  const handleSaveArqueo = async () => {
    await onSaveShift(cashDenominations, totalCashCounted);
    showToast('¡Arqueo y cierre de caja guardado exitosamente en base de datos!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Cierre de Caja y Arqueo Físico de Efectivo
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Conciliación de gaveta física, desglose oficial de billetes y monedas en pesos colombianos.
          </p>
        </div>
        <button
          onClick={handleSaveArqueo}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition"
        >
          <Save className="h-4 w-4" />
          <span>Guardar Arqueo y Generar Acta</span>
        </button>
      </div>

      {/* Grid 65% / 35% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Estado de Periféricos */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estado de Periféricos de Caja
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                <span className="font-bold">Gaveta de Dinero</span>
                <span className="text-[10px] text-emerald-600">● Conectada (RJ11)</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                <span className="font-bold">Impresora 80mm</span>
                <span className="text-[10px] text-emerald-600">● En línea (Térmica)</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                <span className="font-bold">Lector de Códigos</span>
                <span className="text-[10px] text-emerald-600">● Láser Activo</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col gap-1">
                <span className="font-bold">Datáfono POS</span>
                <span className="text-[10px] text-emerald-600">● Conectado (Redelcom)</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: Billetes de Colombia */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#F97316]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Billetes de Colombia</h3>
                  <p className="text-[11px] text-slate-400">Denominaciones vigentes en circulación nacional</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subtotal Billetes</span>
                <span className="text-sm font-black font-mono text-slate-800">
                  ${subtotalBilletes.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {BILLETES_COLOMBIA.map((d) => {
                const count = cashDenominations[d.denom] || 0;
                const subtotal = parseInt(d.denom, 10) * count;
                return (
                  <div
                    key={d.denom}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-2.5 hover:border-orange-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-black text-sm text-slate-900 block font-mono">
                          {d.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{d.sub}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${d.badge}`}>
                        Billete
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                      <button
                        onClick={() => alterDenominationQty(d.denom, -1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition active:scale-95"
                        title="Restar 1"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => setDenominationDirectQty(d.denom, parseInt(e.target.value, 10) || 0)}
                        className="flex-1 text-center font-mono font-bold text-xs bg-transparent outline-none text-slate-900"
                        title="Digitar cantidad de billetes"
                      />
                      <button
                        onClick={() => alterDenominationQty(d.denom, 1)}
                        className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition active:scale-95"
                        title="Sumar 1"
                      >
                        +
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Total:</span>
                      <span className="font-bold text-slate-800">
                        ${subtotal.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: Monedas de Colombia */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monedas de Colombia</h3>
                  <p className="text-[11px] text-slate-400">Monedas de $1.000, $500, $200, $100 y $50</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subtotal Monedas</span>
                <span className="text-sm font-black font-mono text-amber-700">
                  ${subtotalMonedas.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {MONEDAS_COLOMBIA.map((d) => {
                const count = cashDenominations[d.denom] || 0;
                const subtotal = parseInt(d.denom, 10) * count;
                return (
                  <div
                    key={d.denom}
                    className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 flex flex-col justify-between gap-2 hover:border-amber-400 transition"
                  >
                    <div>
                      <span className="font-black text-sm text-slate-900 block font-mono">
                        {d.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 truncate" title={d.sub}>
                        {d.sub}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                      <button
                        onClick={() => alterDenominationQty(d.denom, -1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => setDenominationDirectQty(d.denom, parseInt(e.target.value, 10) || 0)}
                        className="flex-1 min-w-0 text-center font-mono font-bold text-xs bg-transparent outline-none text-slate-900"
                        title="Digitar cantidad de monedas"
                      />
                      <button
                        onClick={() => alterDenominationQty(d.denom, 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition active:scale-95"
                      >
                        +
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-amber-200/60 flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Total:</span>
                      <span className="font-bold text-slate-800">
                        ${subtotal.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Conciliación y Conexión con Ventas */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              Resumen del Turno Actual
            </span>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Fondo Inicial de Caja (Apertura):</span>
              <span className="font-mono font-bold text-slate-800">
                ${initialCash.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 bg-orange-50/50 px-2 rounded">
              <span className="text-[#EA580C] font-semibold flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Ventas en Efectivo (Mesón):
              </span>
              <span className="font-mono font-black text-[#EA580C]">
                +${cashSales.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                Ventas con Datáfono / Tarjeta:
              </span>
              <span className="font-mono font-semibold text-slate-700">
                ${cardSales.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5 text-slate-400" />
                Transferencias QR (Nequi / Bancolombia):
              </span>
              <span className="font-mono font-semibold text-slate-700">
                ${qrSales.toLocaleString('es-CO')} COP
              </span>
            </div>
            {creditSales > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Ventas a Crédito (Fiado):
                </span>
                <span className="font-mono font-semibold text-amber-700">
                  ${creditSales.toLocaleString('es-CO')} COP
                </span>
              </div>
            )}
            <div className="pt-2 flex justify-between text-slate-700 font-bold border-t border-slate-200">
              <span>Total Facturado Hoy:</span>
              <span className="font-mono">
                ${(cashSales + cardSales + qrSales + creditSales).toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 text-white shadow-md flex flex-col gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Total Contado Físico en Gaveta
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-[#F97316] font-mono">
                  ${totalCashCounted.toLocaleString('es-CO')}
                </span>
                <span className="text-xs text-orange-200 font-bold">COP</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800">
                <span>Billetes: ${subtotalBilletes.toLocaleString('es-CO')}</span>
                <span>•</span>
                <span>Monedas: ${subtotalMonedas.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Esperado en Gaveta (Fondo + Efectivo):</span>
              <span className="font-mono font-bold text-slate-200">
                ${effectiveExpectedCash.toLocaleString('es-CO')} COP
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${
                cashDifference === 0
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : cashDifference > 0
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>
                {cashDifference === 0
                  ? '✓ Caja Cuadrada Exacta'
                  : cashDifference > 0
                  ? 'Sobrante en Caja'
                  : 'Faltante en Caja'}
              </span>
              <span className="font-mono text-sm">
                {cashDifference >= 0 ? '+' : ''}${cashDifference.toLocaleString('es-CO')} COP
              </span>
            </div>

            <button
              onClick={handleSaveArqueo}
              className="w-full py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs transition shadow-sm"
            >
              Confirmar Cierre de Turno
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
