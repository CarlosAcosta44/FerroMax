'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Store,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Phone,
} from '@/presentation/components/common/Icons';
import { useCart } from '@/presentation/context/CartContext';
import { useAuth } from '@/presentation/context/AuthContext';
import { createWebOrderAction } from '@/app/actions/orderActions';

export function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmountCop,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const { user, profile } = useAuth();

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');

  // Customer Contact State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    pickupPin: string;
    deliveryType: 'pickup' | 'delivery';
    totalCop: number;
  } | null>(null);

  // Auto-populate when user is authenticated
  useEffect(() => {
    if (user) {
      if (profile?.fullName && !customerName) setCustomerName(profile.fullName);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (profile?.phone && !customerPhone) setCustomerPhone(profile.phone);
    }
  }, [user, profile]);

  const shippingCost = deliveryType === 'delivery' ? 8000 : 0;
  const finalTotalCop = totalAmountCop + shippingCost;
  const subtotalNeto = Math.round(finalTotalCop / 1.19);
  const subtotalIva = finalTotalCop - subtotalNeto;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) return;

    if (!customerName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 7) {
      setErrorMessage('Por favor ingresa un teléfono celular válido de contacto');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Por favor ingresa la dirección exacta de entrega para el domicilio');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createWebOrderAction({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : null,
        paymentMethod,
        customerNotes: deliveryNotes.trim() || null,
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productSku: i.product.sku,
          unitPriceCop: i.product.priceCop,
          quantity: i.quantity,
          subtotalCop: i.product.priceCop * i.quantity,
        })),
        subtotalCop: totalAmountCop,
        shippingCop: shippingCost,
        totalCop: finalTotalCop,
        customerId: user?.id || null,
      });

      if (res.success && res.order) {
        setCompletedOrder({
          orderNumber: res.order.orderNumber,
          pickupPin: res.order.pickupPin,
          deliveryType: res.order.deliveryType as 'pickup' | 'delivery',
          totalCop: res.order.totalCop,
        });
        clearCart();
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al procesar tu pedido');
      }
    } catch (err: unknown) {
      console.error('Error al emitir orden web:', err);
      setErrorMessage('Error de conexión al procesar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    // Reset order success state after close
    if (completedOrder) {
      setCompletedOrder(null);
      setDeliveryNotes('');
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight">Tu Carrito de Compra</h2>
                <p className="text-[11px] text-slate-300">
                  {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en orden
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
              aria-label="Cerrar carrito"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* COMPLETED ORDER VIEW */}
            {completedOrder ? (
              <div className="flex flex-col items-center text-center py-6 space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle className="h-10 w-10" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    ¡Pedido Recibido con Éxito!
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Orden #{completedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hemos registrado tu pedido y el equipo de FerroMax ya comenzó a prepararlo.
                  </p>
                </div>

                {/* Pickup PIN Box or Delivery Badge */}
                {completedOrder.deliveryType === 'pickup' ? (
                  <div className="w-full p-4 rounded-xl bg-orange-50 border-2 border-dashed border-[#F97316] text-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block mb-1">
                      Código PIN de Retiro en Mesón
                    </span>
                    <span className="text-3xl font-black font-mono tracking-widest text-slate-900 block my-1">
                      {completedOrder.pickupPin}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Presenta este código en Calle Principal #45-12 para retirar en 30-60 min sin pagar flete.
                    </p>
                  </div>
                ) : (
                  <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-[#EA580C]">
                      <Truck className="h-4 w-4" /> Despacho a Domicilio Programado
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Te notificaremos al celular cuando el domiciliario salga hacia tu dirección.
                    </p>
                  </div>
                )}

                <div className="w-full p-3 bg-slate-50 rounded-lg text-xs font-mono font-bold text-slate-800 flex justify-between">
                  <span>Total Pedido:</span>
                  <span className="text-[#EA580C]">
                    ${completedOrder.totalCop.toLocaleString('es-CO')} COP
                  </span>
                </div>

                {/* CTAs */}
                <div className="w-full space-y-2 pt-2">
                  <Link
                    href={`/historial?q=${completedOrder.orderNumber}`}
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Hacer Seguimiento de mi Pedido</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <a
                    href={`https://wa.me/573001234567?text=Hola%20FerroMax,%20acabo%20de%20realizar%20el%20pedido%20%23${completedOrder.orderNumber}%20por%20$${completedOrder.totalCop.toLocaleString('es-CO')}%20COP.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Smartphone className="h-4 w-4 text-[#25D366]" />
                    <span>Confirmar por WhatsApp</span>
                  </a>

                  <button
                    onClick={handleClose}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-medium"
                  >
                    Cerrar ventana
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              /* EMPTY CART VIEW */
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tu carrito está vacío</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Explora nuestro catálogo ferretero y agrega herramientas, plomería o materiales.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-sm transition"
                >
                  Explorar Catálogo
                </Link>
              </div>
            ) : (
              /* ACTIVE CART & CHECKOUT FORM */
              <>
                {/* Product List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Productos en Orden
                    </span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-slate-400 hover:text-rose-600 transition flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Vaciar</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
                    {items.map((item) => (
                      <div key={item.product.id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-[#EA580C]">
                            {item.product.sku}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ${item.product.priceCop.toLocaleString('es-CO')} c/u
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 transition"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 transition disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            ${(item.product.priceCop * item.quantity).toLocaleString('es-CO')}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] text-slate-400 hover:text-rose-600 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Options Selector (Retiro en Mesón vs Domicilio) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Modalidad de Entrega:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition ${
                        deliveryType === 'pickup'
                          ? 'border-[#F97316] bg-orange-50/70 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Store className="h-4 w-4 text-[#EA580C]" />
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          $0 COP
                        </span>
                      </div>
                      <span className="font-bold text-xs block">Retiro en Mesón</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        ¡Ahorra el flete, más barato!
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition ${
                        deliveryType === 'delivery'
                          ? 'border-[#F97316] bg-orange-50/70 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Truck className="h-4 w-4 text-[#EA580C]" />
                        <span className="text-[10px] font-bold text-slate-700 font-mono">
                          +$8.000 COP
                        </span>
                      </div>
                      <span className="font-bold text-xs block">Envío Domicilio</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        A tu puerta hoy mismo
                      </span>
                    </button>
                  </div>
                </div>

                {/* Formulario de Datos de Contacto y Envío */}
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 text-xs">
                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Datos del Cliente:
                    </span>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Nombre Completo:
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ej: Carlos Gómez"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            Teléfono Celular:
                          </label>
                          <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="310 123 4567"
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            Correo Electrónico:
                          </label>
                          <input
                            type="email"
                            required
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="carlos@gmail.com"
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#F97316] outline-none"
                          />
                        </div>
                      </div>

                      {/* Dirección obligatoria si es a domicilio */}
                      {deliveryType === 'delivery' && (
                        <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200 space-y-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-800 block mb-0.5">
                              Dirección de Entrega:
                            </label>
                            <input
                              type="text"
                              required
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Ej: Calle 52 #14-20, Casa 2"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#F97316] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-0.5">
                              Barrio o Indicaciones:
                            </label>
                            <input
                              type="text"
                              value={deliveryNotes}
                              onChange={(e) => setDeliveryNotes(e.target.value)}
                              placeholder="Ej: Barrio San Carlos, frente al parque"
                              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#F97316] outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Forma de pago */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Método de Pago:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('efectivo')}
                            className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition ${
                              paymentMethod === 'efectivo'
                                ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {deliveryType === 'pickup' ? 'Efectivo en Tienda' : 'Contra Entrega'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('transferencia')}
                            className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition ${
                              paymentMethod === 'transferencia'
                                ? 'bg-orange-50 border-[#F97316] text-[#EA580C]'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            Transferencia QR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Drawer Footer / Sticky Totals & Submit */}
          {items.length > 0 && !completedOrder && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Productos:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${totalAmountCop.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de Envío:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700 font-bold">¡$0 Gratis (Mesón)!</span>
                    ) : (
                      `$${shippingCost.toLocaleString('es-CO')} COP`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>IVA 19% Incluido:</span>
                  <span className="font-mono">${subtotalIva.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                  <span className="font-extrabold text-sm uppercase">Total a Pagar:</span>
                  <span className="text-xl font-black text-[#EA580C] font-mono">
                    ${finalTotalCop.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Procesando Pedido...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar y Emitir Pedido</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
