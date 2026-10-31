'use client';

import React, { useState, useMemo } from 'react';
import {
  Store,
  Receipt,
  DollarSign,
  Zap,
  Search,
  Plus,
  Trash2,
  CreditCard,
  QrCode,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
} from '@/presentation/components/common/Icons';
import { AdminProduct, AdminCustomer, AdminOrder } from '@/infrastructure/repositories/SupabaseAdminRepository';
import { createPosSaleAction } from '@/app/actions/posActions';

export interface AdminPosTabProps {
  products: AdminProduct[];
  customers: AdminCustomer[];
  orders?: AdminOrder[];
  cashierName: string;
  onSaleCompleted: (newOrder: AdminOrder) => void;
  showToast: (msg: string) => void;
}

export function AdminPosTab({
  products,
  customers,
  orders = [],
  cashierName,
  onSaleCompleted,
  showToast,
}: AdminPosTabProps) {
  const [posCart, setPosCart] = useState<
    Array<{
      id: string;
      name: string; 
      price: number;
      qty: number;
      sku: string;
      aisle: string;
    }>
  >([]);

  const [posSearch, setPosSearch] = useState('');
  const [posSelectedCustomer, setPosSelectedCustomer] = useState<'regular' | 'occasional'>('occasional');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'qr' | 'fiado'>('efectivo');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [posSaleSuccess, setPosSaleSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic real metrics from Supabase orders
  const todayStr = new Date().toDateString();
  const todaysOrders = useMemo(
    () => orders.filter((o) => new Date(o.created_at).toDateString() === todayStr),
    [orders, todayStr]
  );
  const totalCajaTurno = useMemo(
    () => todaysOrders.reduce((sum, o) => sum + o.total_cop, 0),
    [todaysOrders]
  );
  const ticketPromedio = useMemo(
    () => (todaysOrders.length > 0 ? Math.round(totalCajaTurno / todaysOrders.length) : 0),
    [todaysOrders, totalCajaTurno]
  );

  const addPosItem = (product: AdminProduct) => {
    setPosCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price_cop,
          qty: 1,
          sku: product.sku,
          aisle: product.aisle,
        },
      ];
    });
    showToast(`Sumado al ticket: ${product.name}`);
  };

  const updateCartQty = (id: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof posCart
    );
  };

  const removeCartItem = (id: string) => {
    setPosCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setPosCart([]);
    setCashGiven(0);
  };

  const posSubtotalGross = useMemo(
    () => posCart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [posCart]
  );

  const posDiscount = useMemo(
    () => (posSelectedCustomer === 'regular' ? Math.round(posSubtotalGross * 0.05) : 0),
    [posSubtotalGross, posSelectedCustomer]
  );

  const posTotalFinal = Math.max(0, posSubtotalGross - posDiscount);
  const posSubtotalNeto = Math.round(posTotalFinal / 1.19);
  const posIVA = posTotalFinal - posSubtotalNeto;
  const cashChange = Math.max(0, cashGiven - posTotalFinal);

  const regularCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || customers[0],
    [customers, selectedCustomerId]
  );

  const handleCompletePosSale = async () => {
    if (posCart.length === 0 || isSubmitting) return;

    if (posPaymentMethod === 'efectivo' && cashGiven < posTotalFinal) {
      showToast(
        `Efectivo insuficiente: Recibido $${cashGiven.toLocaleString('es-CO')} de $${posTotalFinal.toLocaleString('es-CO')} COP`
      );
      return;
    }

    setIsSubmitting(true);
    const customerName =
      posSelectedCustomer === 'regular'
        ? regularCustomer?.full_name || 'Cliente Registrado'
        : 'Cliente Ocasional';

    const customerPhone =
      posSelectedCustomer === 'regular' ? regularCustomer?.phone || '' : '';

    try {
      const res = await createPosSaleAction({
        customerType: posSelectedCustomer,
        customerName,
        customerPhone,
        paymentMethod: posPaymentMethod,
        items: posCart.map((i) => ({
          id: i.id,
          name: i.name,
          sku: i.sku,
          price: i.price,
          qty: i.qty,
        })),
        subtotalGross: posSubtotalGross,
        discountCop: posDiscount,
        totalFinal: posTotalFinal,
        customerId: posSelectedCustomer === 'regular' ? regularCustomer?.id : undefined,
      });

      if (res.success && res.order) {
        onSaleCompleted(res.order as AdminOrder);
        setPosSaleSuccess(true);
        showToast(`Venta POS #${res.order.order_number} registrada correctamente`);

        setTimeout(() => {
          setPosSaleSuccess(false);
          clearCart();
        }, 2500);
      } else {
        showToast(res.error || 'Error al registrar venta');
      }
    } catch (err) {
      console.error('Error registrando venta POS:', err);
      showToast('Error de red al registrar venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalogForPos = useMemo(() => {
    if (!posSearch.trim()) return products.slice(0, 6);
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
        p.aisle.toLowerCase().includes(posSearch.toLowerCase())
    );
  }, [products, posSearch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Turno y Cajero
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1">{cashierName}</span>
            <span className="text-[11px] text-[#EA580C] font-mono mt-0.5">Mesón Principal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Boletas Emitidas Hoy
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1">{todaysOrders.length} boletas</span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">Sincronizadas con Supabase</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Total Ventas Hoy
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1">
              ${totalCajaTurno.toLocaleString('es-CO')} COP
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">✓ En base de datos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border-t-2 border-[#F97316] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Ticket Promedio Hoy
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1">
              ${ticketPromedio.toLocaleString('es-CO')} COP
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
              {todaysOrders.length > 0 ? 'Calculado en tiempo real' : 'Sin ventas hoy'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Área Operativa POS (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Buscador y Lector de Código de Barras */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-3">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-[#F97316] h-5 w-5" />
              <input
                className="w-full pl-12 pr-28 py-3 bg-slate-50 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316] transition-all"
                placeholder="Escanear código de barra o buscar producto (ej: tornillo, brocha, cerradura)... [F3]"
                type="text"
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
              />
              <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                  F3
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-white font-mono text-[10px] font-bold animate-pulse">
                  LÁSER ACTIVO
                </span>
              </div>
            </div>
          </div>

          {/* Favoritos de Alta Rotación en Mesón */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F97316]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {posSearch ? 'Resultados de Búsqueda Rápida' : 'Favoritos de Alta Rotación en Mesón'}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Clic rápido para añadir
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCatalogForPos.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg bg-slate-50 hover:bg-orange-50/50 transition-all flex flex-col justify-between gap-3 border border-slate-200/70 hover:border-[#F97316]"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-[#EA580C] font-bold">{item.sku}</span>
                    <span className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">{item.name}</span>
                    <span className="text-[11px] text-slate-400">{item.aisle}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-[#F97316]">
                      ${item.price_cop.toLocaleString('es-CO')}
                    </span>
                    <button
                      onClick={() => addPosItem(item)}
                      className="px-2.5 py-1 rounded bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Sumar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket de Venta Actual */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#F97316]" />
                <h3 className="text-sm font-bold text-slate-900">Ticket de Venta en Mesón</h3>
              </div>
              <button
                onClick={clearCart}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpiar Ticket</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-y border-slate-200">
                    <th className="py-2.5 px-4 rounded-l-lg">Producto / Ubicación</th>
                    <th className="py-2.5 px-4 text-center">Cantidad</th>
                    <th className="py-2.5 px-4 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-4 text-right">Total Línea</th>
                    <th className="py-2.5 px-3 text-center rounded-r-lg w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posCart.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.sku} • {item.aisle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ${item.price.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${(item.price * item.qty).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posCart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Ticket vacío. Haz clic en &quot;Sumar&quot; en los favoritos o busca un producto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 pt-4 bg-slate-50 rounded-xl p-5 flex flex-col gap-2 border border-slate-200/60 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Neto</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${posSubtotalNeto.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="flex justify-between items-center text-[#EA580C]">
                <span className="flex items-center gap-1.5 font-medium">
                  Descuento Vecino Frecuente (Maestro Club 5%)
                </span>
                <span className="font-mono font-bold bg-orange-100/80 text-[#EA580C] px-2 py-0.5 rounded">
                  -${posDiscount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>IVA (19% Incluido)</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${posIVA.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="mt-3 pt-3 flex items-center justify-between bg-orange-500/10 p-4 rounded-xl border border-orange-300">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-[#EA580C] font-extrabold">
                    Total a Cobrar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {posCart.reduce((sum, i) => sum + i.qty, 0)} artículos en ticket
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#EA580C]">
                    ${posTotalFinal.toLocaleString('es-CO')}
                  </span>
                  <span className="text-xs font-bold text-[#EA580C]">COP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cliente y Cobro */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cliente en Mesón
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                {posSelectedCustomer === 'regular' ? 'Club Activo (5% Desc)' : 'Mostrador'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 border border-slate-200/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                  {posSelectedCustomer === 'regular' ? (regularCustomer?.full_name?.slice(0, 2).toUpperCase() || 'CR') : 'CO'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {posSelectedCustomer === 'regular'
                      ? regularCustomer?.full_name || 'Cliente Registrado'
                      : 'Cliente Ocasional'}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {posSelectedCustomer === 'regular'
                      ? `${regularCustomer?.address || 'Mostrador'} • ${regularCustomer?.phone || 'Sin tel'}`
                      : 'Venta rápida mostrador'}
                  </span>
                </div>
              </div>
            </div>

            {posSelectedCustomer === 'regular' && customers.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Seleccionar Cliente de la Base de Datos:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone || c.email || 'Registrado'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPosSelectedCustomer(
                    posSelectedCustomer === 'regular' ? 'occasional' : 'regular'
                  )
                }
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition"
              >
                {posSelectedCustomer === 'regular'
                  ? 'Cambiar a Cliente Ocasional'
                  : 'Buscar Cliente Registrado / Maestro'}
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Forma de Pago
              </span>
              <span className="text-[11px] font-semibold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded-full">
                Caja Rápida
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPosPaymentMethod('efectivo')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                  posPaymentMethod === 'efectivo'
                    ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                    : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Efectivo</span>
              </button>

              <button
                onClick={() => setPosPaymentMethod('tarjeta')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                  posPaymentMethod === 'tarjeta'
                    ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                    : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Tarjeta POS</span>
              </button>

              <button
                onClick={() => setPosPaymentMethod('qr')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                  posPaymentMethod === 'qr'
                    ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                    : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span>Transf. QR</span>
              </button>

              <button
                onClick={() => setPosPaymentMethod('fiado')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold gap-1.5 ${
                  posPaymentMethod === 'fiado'
                    ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                    : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Cuenta Fiado</span>
              </button>
            </div>

            {posPaymentMethod === 'efectivo' && (
              <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                {/* Billetes Rápidos Oficiales de Colombia */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700 font-bold flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-[#F97316]" />
                      Billetes Rápidos (COP):
                    </span>
                    <button
                      type="button"
                      onClick={() => setCashGiven(0)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Fila de Billetes Fijos */}
                  <div className="grid grid-cols-5 gap-1.5 font-mono font-bold text-center">
                    <button
                      type="button"
                      onClick={() => setCashGiven(posTotalFinal)}
                      className={`px-1 py-1.5 rounded-lg border text-xs transition ${
                        cashGiven === posTotalFinal && posTotalFinal > 0
                          ? 'bg-[#F97316] text-white border-[#EA580C] shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-orange-50 text-slate-700'
                      }`}
                      title="Monto Exacto"
                    >
                      Exacto
                    </button>
                    {[10000, 20000, 50000, 100000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashGiven(bill)}
                        className={`px-1 py-1.5 rounded-lg border text-xs transition ${
                          cashGiven === bill
                            ? 'bg-[#F97316] text-white border-[#EA580C] shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-orange-50 text-slate-700'
                        }`}
                      >
                        ${bill >= 1000 ? `${bill / 1000}k` : bill}
                      </button>
                    ))}
                  </div>

                  {/* Fila de Sumar Billetes (+10k, +20k, +50k) */}
                  <div className="flex items-center gap-1.5 mt-2 font-mono">
                    <span className="text-[10px] text-slate-400 font-sans mr-0.5">Sumar:</span>
                    {[10000, 20000, 50000].map((bill) => (
                      <button
                        key={`add-${bill}`}
                        type="button"
                        onClick={() => setCashGiven((prev) => prev + bill)}
                        className="flex-1 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[11px] transition shadow-2xs"
                      >
                        +${bill / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input de Efectivo Recibido */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
                  <label className="font-bold text-slate-700 whitespace-nowrap">
                    Efectivo Recibido:
                  </label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#F97316] font-bold text-sm">
                      $
                    </span>
                    <input
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-right font-mono font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition"
                      type="number"
                      min="0"
                      step="50"
                      placeholder="0"
                      value={cashGiven === 0 ? '' : cashGiven}
                      onChange={(e) => setCashGiven(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </div>

                {/* Banner de Estado: Cambio / Faltante / Inicial */}
                {posTotalFinal > 0 && cashGiven >= posTotalFinal && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-950 flex items-center justify-between border border-emerald-300 shadow-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Vuelto / Cambio a entregar
                      </span>
                      <span className="font-mono font-black text-base text-emerald-900">
                        ${cashChange.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                      {cashChange === 0 ? 'Pago Exacto' : 'Entregar Vueltos'}
                    </div>
                  </div>
                )}

                {posTotalFinal > 0 && cashGiven > 0 && cashGiven < posTotalFinal && (
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-950 flex items-center justify-between border border-amber-300 shadow-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        Monto Insuficiente
                      </span>
                      <span className="font-mono font-bold text-xs text-amber-900">
                        Faltan ${(posTotalFinal - cashGiven).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCashGiven(posTotalFinal)}
                      className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-md font-bold text-[11px] transition"
                    >
                      Completar Exacto
                    </button>
                  </div>
                )}

                {posTotalFinal > 0 && cashGiven === 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-between border border-slate-200 text-[11px]">
                    <span>Seleccione billete rápido o ingrese el monto recibido.</span>
                    <button
                      type="button"
                      onClick={() => setCashGiven(posTotalFinal)}
                      className="px-2 py-1 bg-white hover:bg-orange-50 border border-slate-300 text-[#EA580C] rounded font-bold text-[11px] transition"
                    >
                      Exacto
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCompletePosSale}
              disabled={
                posCart.length === 0 ||
                isSubmitting ||
                (posPaymentMethod === 'efectivo' && cashGiven < posTotalFinal)
              }
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm ${
                posSaleSuccess
                  ? 'bg-emerald-600 text-white'
                  : posCart.length === 0 ||
                    isSubmitting ||
                    (posPaymentMethod === 'efectivo' && cashGiven < posTotalFinal)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F97316] hover:bg-[#EA580C] text-white'
              }`}
            >
              {posSaleSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>¡Venta Exitosa y Boleta Emitida!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Procesando Venta...</span>
                </>
              ) : posPaymentMethod === 'efectivo' && cashGiven < posTotalFinal ? (
                <>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span>
                    {cashGiven === 0
                      ? 'Ingrese Efectivo Recibido'
                      : `Faltan $${(posTotalFinal - cashGiven).toLocaleString('es-CO')} COP`}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Finalizar Venta (${posTotalFinal.toLocaleString('es-CO')} COP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
