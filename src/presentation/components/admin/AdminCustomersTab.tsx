'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Search,
  ShoppingCart,
  User,
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
  const [filterType, setFilterType] = useState<'all' | 'online' | 'credit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [abonoCustomerId, setAbonoCustomerId] = useState<string>(customers[0]?.id || '');
  const [abonoAmount, setAbonoAmount] = useState<number>(50000);
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [isSubmittingAbono, setIsSubmittingAbono] = useState(false);

  const onlineCustomersCount = useMemo(
    () => customers.filter((c) => c.customer_type === 'online_user').length,
    [customers]
  );

  const creditCustomersCount = useMemo(
    () => customers.filter((c) => (c.credit_balance_cop || 0) > 0).length,
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterType === 'online' && c.customer_type !== 'online_user') return false;
      if (filterType === 'credit' && (c.credit_balance_cop || 0) <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.full_name.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [customers, filterType, searchQuery]);

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Gestión de Clientes y Usuarios Registrados</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EA580C] border border-orange-200">
              {customers.length} Clientes Activos
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Usuarios que compran en línea por la plataforma web y maestros con libreta de crédito.
          </p>
        </div>
      </div>

      {/* 4 KPIs Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border-t-2 border-[#F97316] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Total Clientes
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{customers.length}</h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Sincronizados con la BD
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-sky-500 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Usuarios en Línea (Web)
            </span>
            <h3 className="text-2xl font-black text-sky-700 mt-1">
              {onlineCustomersCount}
            </h3>
            <span className="text-[11px] text-sky-600 font-semibold">
              Compradores registrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-amber-500 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Cartera por Cobrar
            </span>
            <h3 className="text-2xl font-black text-amber-700 mt-1">
              ${totalOutstandingCredit.toLocaleString('es-CO')}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Fiados pendientes
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border-t-2 border-emerald-500 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              Compras Totales Acumuladas
            </span>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              ${customers.reduce((sum, c) => sum + (c.total_purchases_cop || 0), 0).toLocaleString('es-CO')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Facturación acumulada
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'online'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            Usuarios en Línea ({onlineCustomersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('credit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'credit'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#EA580C]'
            }`}
          >
            Con Fiado Activo ({creditCustomersCount})
          </button>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o celular..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
          />
        </div>
      </div>

      {/* Grid de Contenido (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Tarjetas de Clientes */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {filteredCustomers.map((c) => {
            const isOnline = c.customer_type === 'online_user';
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
                    <div
                      className={`w-12 h-12 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                        isOnline
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-orange-100 text-[#EA580C]'
                      }`}
                    >
                      {getInitials(c.full_name, c.email)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{c.full_name}</h3>
                        {isOnline ? (
                          <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold">
                            🌐 Comprador en Línea
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-[#EA580C] text-[10px] font-bold">
                            {c.club_tier}
                          </span>
                        )}
                        {c.credit_balance_cop > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            Deuda: ${c.credit_balance_cop.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">{c.trade}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                        {c.email && <span>{c.email}</span>}
                        {c.email && c.phone && <span>•</span>}
                        <span>{c.phone}</span>
                        {c.address && <span>•</span>}
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
                    {c.phone && c.phone.length >= 7 && (
                      <a
                        href={`https://wa.me/57${c.phone.replace(/\s+/g, '')}?text=Hola%20${encodeURIComponent(c.full_name)},%20te%20saludamos%20de%20FerroMax.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Contactar por WhatsApp"
                      >
                        <Smartphone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Resumen de Compras & Cartera */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Línea de Crédito:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${c.credit_balance_cop.toLocaleString('es-CO')} / ${c.credit_limit_cop.toLocaleString('es-CO')} COP
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
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Compras Acumuladas: ${c.total_purchases_cop.toLocaleString('es-CO')} COP
                    </span>
                    <span>{creditPct}% del cupo utilizado</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="py-12 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              No se encontraron clientes con el filtro seleccionado.
            </div>
          )}
        </div>

        {/* Columna Derecha: Ficha Rápida de Abono */}
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
                  Cliente o Usuario:
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-[#F97316]"
                  value={selectedAbonoCustomer?.id}
                  onChange={(e) => setAbonoCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} (${(c.credit_balance_cop || 0).toLocaleString('es-CO')} saldo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 flex justify-between items-center font-mono">
                <span>Saldo Pendiente:</span>
                <span className="font-bold text-sm">
                  ${(selectedAbonoCustomer?.credit_balance_cop || 0).toLocaleString('es-CO')} COP
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
                  <span>Registrar Abono</span>
                )}
              </button>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-slate-700 text-xs flex flex-col gap-2">
            <span className="font-bold text-[#EA580C] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Reglas de Clientes FerroMax:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Los compradores en línea acumulan puntos para descuento en mesón.</li>
              <li>Crédito vecinal a 30 días calendario para maestros calificados.</li>
              <li>Actualización de saldo en tiempo real con cada abono.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
